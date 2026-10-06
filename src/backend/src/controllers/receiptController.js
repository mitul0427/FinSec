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

    let extractedData = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = 'Analyze this receipt image. Extract the merchant name, total amount, date, and category. Return ONLY a valid JSON object. If you cannot read the receipt, return {"error": "unreadable"}. Do not hallucinate data.';

        const imagePart = {
          inlineData: {
            data: sanitizedBuffer.toString('base64'),
            mimeType: type.mime
          }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text().trim();
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        extractedData = JSON.parse(cleanJson);
      } catch (geminiError) {
        console.warn('Gemini OCR API error:', geminiError.message);
        return res.status(502).json({
          error: 'OCR_PROCESSING_FAILED',
          message: `Gemini OCR failure: ${geminiError.message}`
        });
      }
    } else {
      return res.status(400).json({
        error: 'GEMINI_API_KEY_REQUIRED',
        message: 'No Gemini API key configured. Please set GEMINI_API_KEY in backend .env or enter your personal Gemini API key in Profile Settings.'
      });
    }

    if (extractedData && extractedData.error === 'unreadable') {
      return res.status(422).json({
        error: 'RECEIPT_UNREADABLE',
        message: 'The uploaded image could not be read as a valid receipt. Please upload a clearer photo.'
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
