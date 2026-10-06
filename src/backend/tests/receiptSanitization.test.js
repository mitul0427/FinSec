import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExifParser from 'exif-parser';
import { sanitizeImageMetadata, stripJpegMetadata } from '../src/services/imageSanitizer.js';
import { normalizeCategory } from '../src/controllers/receiptController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Receipt EXIF Stripping & Category Normalization', () => {
  const sampleExifJpegPath = path.resolve(__dirname, '../node_modules/exif-parser/test/starfish.jpg');

  test('EXIF Sanitization: Real JPEG with GPS/camera tags is stripped completely', () => {
    assert.ok(fs.existsSync(sampleExifJpegPath), 'Sample JPEG with EXIF must exist');
    const rawBuffer = fs.readFileSync(sampleExifJpegPath);

    // Verify initial raw buffer has EXIF tags
    const initialParser = ExifParser.create(rawBuffer);
    const initialResult = initialParser.parse();
    const initialTagCount = Object.keys(initialResult.tags || {}).length;
    assert.ok(initialTagCount > 0, 'Original image must contain EXIF tags');
    assert.ok(initialResult.tags.GPSLatitude !== undefined, 'Original image contains GPS metadata');

    // Execute sanitization
    const { sanitizedBuffer, exifStripped, hadExif } = sanitizeImageMetadata(rawBuffer, 'image/jpeg');

    assert.equal(hadExif, true, 'Original EXIF presence must be detected');
    assert.equal(exifStripped, true, 'EXIF metadata must be stripped');
    assert.ok(sanitizedBuffer.length < rawBuffer.length, 'Sanitized buffer should be smaller without APP1 metadata');

    // Verify sanitized buffer has ZERO remaining EXIF tags
    const sanitizedParser = ExifParser.create(sanitizedBuffer);
    const sanitizedResult = sanitizedParser.parse();
    const remainingTags = Object.keys(sanitizedResult.tags || {});
    assert.equal(remainingTags.length, 0, 'Sanitized image must have 0 EXIF tags remaining');
  });

  test('EXIF Sanitization: Image without EXIF returns hadExif: false and exifStripped: false', () => {
    // Generate minimal clean JPEG (SOI + DQT + SOF0 + SOS + EOI)
    const cleanJpeg = Buffer.from([
      0xFF, 0xD8, // SOI
      0xFF, 0xDB, 0x00, 0x05, 0x00, 0x01, 0x02, // DQT
      0xFF, 0xDA, 0x00, 0x02, // SOS
      0xFF, 0xD9  // EOI
    ]);

    const { sanitizedBuffer, exifStripped, hadExif } = sanitizeImageMetadata(cleanJpeg, 'image/jpeg');
    assert.equal(exifStripped, false, 'Non-EXIF image should not report stripped');
    assert.equal(hadExif, false, 'Non-EXIF image should not report hadExif');
    assert.equal(sanitizedBuffer.length, cleanJpeg.length, 'Buffer unchanged when no EXIF present');
  });

  test('Category Normalization: Maps diverse merchant item terms to supported FinSec categories', () => {
    assert.equal(normalizeCategory('Whole Foods Market Groceries'), 'Food & Dining');
    assert.equal(normalizeCategory('Blue Bottle Coffee & Bakery'), 'Food & Dining');
    assert.equal(normalizeCategory('ConEdison Electric & Gas Bill'), 'Utilities');
    assert.equal(normalizeCategory('Starlink High-Speed Internet'), 'Utilities');
    assert.equal(normalizeCategory('Uber Ride Downtown'), 'Travel');
    assert.equal(normalizeCategory('Delta Airlines Flight Ticket'), 'Travel');
    assert.equal(normalizeCategory('CVS Pharmacy & Prescription Drugs'), 'Healthcare');
    assert.equal(normalizeCategory('Best Buy 4K Monitor & Electronics'), 'Shopping');
    assert.equal(normalizeCategory('AMC Theatres Movie Tickets'), 'Entertainment');
    assert.equal(normalizeCategory('Unknown Generic Purchase'), 'Other');
  });
});
