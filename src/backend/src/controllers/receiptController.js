import { fileTypeFromBuffer } from 'file-type';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../config/prisma.js';
import { sanitizeImageMetadata } from '../services/imageSanitizer.js';

export const SUPPORTED_CATEGORIES = [
  'Food & Dining',
  'Housing',
  'Utilities',
  'Shopping',
  'Travel',
  'Healthcare',
  'Salary',
  'Investment',
  'Entertainment',
  'Other'
];

export function normalizeCategory(raw) {
  if (!raw || typeof raw !== 'string') return 'Shopping';
  const trimmed = raw.trim();
  const exact = SUPPORTED_CATEGORIES.find((c) => c.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  if (lower.includes('food') || lower.includes('dine') || lower.includes('dining') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('grocery') || lower.includes('coffee') || lower.includes('bakery') || lower.includes('meal')) return 'Food & Dining';
  if (lower.includes('util') || lower.includes('electric') || lower.includes('water') || lower.includes('power') || lower.includes('internet') || lower.includes('wifi') || lower.includes('phone') || lower.includes('gas bill')) return 'Utilities';
  if (lower.includes('travel') || lower.includes('flight') || lower.includes('uber') || lower.includes('lyft') || lower.includes('taxi') || lower.includes('cab') || lower.includes('transport') || lower.includes('transit') || lower.includes('hotel') || lower.includes('gas') || lower.includes('fuel') || lower.includes('airline')) return 'Travel';
  if (lower.includes('health') || lower.includes('pharma') || lower.includes('doctor') || lower.includes('hospital') || lower.includes('clinic') || lower.includes('dental') || lower.includes('medicine') || lower.includes('drug')) return 'Healthcare';
  if (lower.includes('house') || lower.includes('rent') || lower.includes('mortgage') || lower.includes('property') || lower.includes('apartment')) return 'Housing';
  if (lower.includes('entertain') || lower.includes('movie') || lower.includes('cinema') || lower.includes('theater') || lower.includes('game') || lower.includes('concert') || lower.includes('ticket') || lower.includes('music')) return 'Entertainment';
  if (lower.includes('shop') || lower.includes('store') || lower.includes('retail') || lower.includes('market') || lower.includes('cloth') || lower.includes('apparel') || lower.includes('electronic') || lower.includes('mall')) return 'Shopping';
  if (lower.includes('salary') || lower.includes('paycheck') || lower.includes('wage') || lower.includes('income')) return 'Salary';
  if (lower.includes('invest') || lower.includes('stock') || lower.includes('fund') || lower.includes('crypto')) return 'Investment';

  return 'Other';
}

export const scanReceipt = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const buffer = req.file.buffer;

    // Step 1: Magic Bytes Verification using file-type
    const type = await fileTypeFromBuffer(buffer);
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
      return res.status(400).json({
        error: 'INVALID_FILE_TYPE',
        message: 'Security Violation: File header magic bytes do not match an allowed image format (JPEG, PNG, WebP). Potential polyglot upload rejected.'
      });
    }

    // Step 2: Strip EXIF metadata to protect user privacy (GPS coordinates, device ID)
    const { sanitizedBuffer, exifStripped } = sanitizeImageMetadata(buffer, type.mime);

    // Step 3: Determine Gemini API Key (User custom key or server environment key)
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const apiKey = user?.customGeminiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(422).json({
        error: 'GEMINI_API_KEY_REQUIRED',
        message: 'Gemini API key is not configured. Please set GEMINI_API_KEY in the server environment or provide a Custom Gemini API Key in your Profile Settings to enable AI Receipt Extraction.',
        securityChecks: {
          magicBytesVerified: true,
          detectedMime: type.mime,
          exifMetadataScrubbed: exifStripped
        }
      });
    }

    // Step 4: Call Gemini Vision with Sanitized Image Buffer
    let extractedData = null;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Support primary model with fallback if needed
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `You are a financial receipt parser. Analyze this receipt image and return ONLY a valid JSON object with these exact keys:
{
  "merchant": "Name of store or merchant",
  "amount": 45.50,
  "date": "YYYY-MM-DD",
  "category": "One of: Food & Dining, Housing, Utilities, Shopping, Travel, Healthcare, Salary, Investment, Entertainment, Other",
  "description": "Brief summary of purchased items"
}
Ensure amount is a positive number.
Do not include any markdown fences, backticks, or text outside the JSON object.`;

      const imagePart = {
        inlineData: {
          data: sanitizedBuffer.toString('base64'),
          mimeType: type.mime
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();
      const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Step 5: Strict Validation of Extracted Entities
      const merchant = String(parsed.merchant || 'Unknown Merchant').trim().slice(0, 100);
      const rawAmount = parseFloat(parsed.amount);
      const amount = (!isNaN(rawAmount) && rawAmount > 0) ? Math.round(rawAmount * 100) / 100 : 0;

      let date = parsed.date;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        date = new Date().toISOString().split('T')[0];
      }

      const category = normalizeCategory(parsed.category);
      const description = String(parsed.description || `Scanned receipt from ${merchant}`).trim().slice(0, 200);

      extractedData = {
        merchant,
        amount,
        date,
        category,
        description
      };
    } catch (geminiError) {
      console.error('Gemini OCR API error:', geminiError.message);
      return res.status(502).json({
        error: 'AI_EXTRACTION_FAILED',
        message: `Gemini AI Receipt Vision processing failed: ${geminiError.message}. Verify that the configured API key is valid and has quota available.`,
        securityChecks: {
          magicBytesVerified: true,
          detectedMime: type.mime,
          exifMetadataScrubbed: exifStripped
        }
      });
    }

    return res.json({
      message: 'Receipt validated, sanitized, and parsed successfully.',
      securityChecks: {
        magicBytesVerified: true,
        detectedMime: type.mime,
        exifMetadataScrubbed: exifStripped
      },
      receipt: extractedData
    });
  } catch (err) {
    console.error('scanReceipt error:', err);
    return res.status(500).json({ error: 'Failed to process receipt image.', details: err.message });
  }
};
