import ExifParser from 'exif-parser';

/**
 * Strips EXIF (APP1), IPTC (APP13), and comment (COM) segments from JPEG buffers.
 * Preserves SOI, quantization, Huffman tables, frame header, and SOS pixel stream.
 */
export function stripJpegMetadata(buffer) {
  if (!buffer || buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
    return { buffer, stripped: false, hadExif: false };
  }

  let hadExif = false;
  try {
    const parser = ExifParser.create(buffer);
    const parsed = parser.parse();
    if (parsed && parsed.tags && Object.keys(parsed.tags).length > 0) {
      hadExif = true;
    }
  } catch (e) {
    // Parser error when no standard EXIF is present
  }

  const pieces = [buffer.subarray(0, 2)]; // Start with SOI (0xFFD8)
  let offset = 2;
  let stripped = false;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xFF) break;

    while (offset < buffer.length && buffer[offset] === 0xFF) {
      offset++;
    }
    if (offset >= buffer.length) break;

    const marker = buffer[offset];
    offset++;

    // SOS (0xDA) or EOI (0xD9) - pixel entropy stream starts here
    if (marker === 0xDA || marker === 0xD9) {
      pieces.push(buffer.subarray(offset - 2));
      break;
    }

    // RST0-RST7 (0xD0-0xD7) have no length bytes
    if (marker >= 0xD0 && marker <= 0xD7) {
      pieces.push(Buffer.from([0xFF, marker]));
      continue;
    }

    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (offset + length > buffer.length) break;

    // 0xE1: APP1 (EXIF / XMP), 0xED: APP13 (IPTC/Photoshop), 0xFE: COM (Comment)
    if (marker === 0xE1 || marker === 0xED || marker === 0xFE) {
      stripped = true;
      hadExif = true;
      offset += length;
    } else {
      pieces.push(buffer.subarray(offset - 2, offset + length));
      offset += length;
    }
  }

  return {
    buffer: stripped ? Buffer.concat(pieces) : buffer,
    stripped,
    hadExif
  };
}

/**
 * Strips metadata chunks (eXIf, tEXt, zTXt, iTXt) from PNG buffers.
 */
export function stripPngMetadata(buffer) {
  if (!buffer || buffer.length < 8) return { buffer, stripped: false, hadExif: false };
  const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!buffer.subarray(0, 8).equals(PNG_HEADER)) return { buffer, stripped: false, hadExif: false };

  const pieces = [buffer.subarray(0, 8)];
  let offset = 8;
  let stripped = false;
  let hadExif = false;

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const totalChunkLength = 12 + length;
    if (offset + totalChunkLength > buffer.length) break;

    if (['eXIf', 'tEXt', 'zTXt', 'iTXt'].includes(type)) {
      stripped = true;
      if (type === 'eXIf') hadExif = true;
    } else {
      pieces.push(buffer.subarray(offset, offset + totalChunkLength));
    }
    offset += totalChunkLength;
  }

  return {
    buffer: stripped ? Buffer.concat(pieces) : buffer,
    stripped,
    hadExif
  };
}

/**
 * Sanitizes image buffer by stripping all EXIF and user privacy metadata.
 * Returns { sanitizedBuffer, exifStripped, hadExif }.
 */
export function sanitizeImageMetadata(buffer, mimeType) {
  if (mimeType === 'image/jpeg') {
    const res = stripJpegMetadata(buffer);
    return {
      sanitizedBuffer: res.buffer,
      exifStripped: res.stripped,
      hadExif: res.hadExif
    };
  }

  if (mimeType === 'image/png') {
    const res = stripPngMetadata(buffer);
    return {
      sanitizedBuffer: res.buffer,
      exifStripped: res.stripped,
      hadExif: res.hadExif
    };
  }

  // WebP or other supported types without recognized metadata segments
  return {
    sanitizedBuffer: buffer,
    exifStripped: false,
    hadExif: false
  };
}
