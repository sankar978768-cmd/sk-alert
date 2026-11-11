import fs from 'fs';
import zlib from 'zlib';
import path from 'path';

function createPNG(width, height) {
  // Minimal PNG encoder
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(6, 9); // color type RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rawBytes = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.45;

  for (let y = 0; y < height; y++) {
    rawBytes[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < r) {
        // Inner circle icon: Amber gradient
        const innerDist = Math.sqrt(dx * dx + (dy + 5) * (dy + 5));
        if (innerDist < r * 0.55) {
          // Gold / Amber Bell center
          rawBytes[offset++] = 251; // R
          rawBytes[offset++] = 191; // G
          rawBytes[offset++] = 36;  // B (#fbbf24)
          rawBytes[offset++] = 255; // A
        } else {
          // Slate 900 background circle
          rawBytes[offset++] = 15;
          rawBytes[offset++] = 23;
          rawBytes[offset++] = 42;
          rawBytes[offset++] = 255;
        }
      } else {
        // Outer dark background
        rawBytes[offset++] = 2;
        rawBytes[offset++] = 6;
        rawBytes[offset++] = 23;
        rawBytes[offset++] = 255;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawBytes);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'icon-192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(pubDir, 'icon-512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), createPNG(64, 64));
console.log('Icons generated successfully');
