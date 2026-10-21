/**
 * High-Speed Native PNG Receipt Card Generator for WhatsApp Image Header Templates
 * Zero external libraries, uses Node.js standard zlib module.
 * Generates an 800 x 500 px branded invoice summary card.
 */

const zlib = require('zlib');

// Precomputed CRC-32 table for PNG chunk checksums
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Minimal 5x7 ASCII bitmap font for crisp receipt text rasterization
const FONT_5X7 = {
  ' ': [0,0,0,0,0],
  'A': [0x7c,0x12,0x11,0x12,0x7c],
  'B': [0x7f,0x49,0x49,0x49,0x36],
  'C': [0x3e,0x41,0x41,0x41,0x22],
  'D': [0x7f,0x41,0x41,0x22,0x1c],
  'E': [0x7f,0x49,0x49,0x49,0x41],
  'F': [0x7f,0x09,0x09,0x09,0x01],
  'G': [0x3e,0x41,0x49,0x49,0x7a],
  'H': [0x7f,0x08,0x08,0x08,0x7f],
  'I': [0x00,0x41,0x7f,0x41,0x00],
  'J': [0x20,0x40,0x41,0x3f,0x01],
  'K': [0x7f,0x08,0x14,0x22,0x41],
  'L': [0x7f,0x40,0x40,0x40,0x40],
  'M': [0x7f,0x02,0x0c,0x02,0x7f],
  'N': [0x7f,0x04,0x08,0x10,0x7f],
  'O': [0x3e,0x41,0x41,0x41,0x3e],
  'P': [0x7f,0x09,0x09,0x09,0x06],
  'Q': [0x3e,0x41,0x51,0x21,0x5e],
  'R': [0x7f,0x09,0x19,0x29,0x46],
  'S': [0x46,0x49,0x49,0x49,0x31],
  'T': [0x01,0x01,0x7f,0x01,0x01],
  'U': [0x3f,0x40,0x40,0x40,0x3f],
  'V': [0x1f,0x20,0x40,0x20,0x1f],
  'W': [0x7f,0x20,0x18,0x20,0x7f],
  'X': [0x63,0x14,0x08,0x14,0x63],
  'Y': [0x07,0x08,0x70,0x08,0x07],
  'Z': [0x61,0x51,0x49,0x45,0x43],
  '0': [0x3e,0x51,0x49,0x45,0x3e],
  '1': [0x00,0x42,0x7f,0x40,0x00],
  '2': [0x42,0x61,0x51,0x49,0x46],
  '3': [0x21,0x41,0x45,0x4b,0x31],
  '4': [0x18,0x14,0x12,0x7f,0x10],
  '5': [0x27,0x45,0x45,0x45,0x39],
  '6': [0x3c,0x4a,0x49,0x49,0x30],
  '7': [0x01,0x71,0x09,0x05,0x03],
  '8': [0x36,0x49,0x49,0x49,0x36],
  '9': [0x06,0x49,0x49,0x29,0x1e],
  ':': [0x00,0x36,0x36,0x00,0x00],
  '-': [0x08,0x08,0x08,0x08,0x08],
  '.': [0x00,0x60,0x60,0x00,0x00],
  ',': [0x00,0x80,0x60,0x00,0x00],
  '/': [0x20,0x10,0x08,0x04,0x02],
  '#': [0x14,0x7f,0x14,0x7f,0x14],
  '₹': [0x7f,0x09,0x3f,0x09,0x4e],
  '|': [0x00,0x00,0x7f,0x00,0x00],
  '+': [0x08,0x08,0x3e,0x08,0x08],
  '!': [0x00,0x00,0x5f,0x00,0x00],
  '*': [0x14,0x08,0x3e,0x08,0x14],
  '(': [0x00,0x1c,0x22,0x41,0x00],
  ')': [0x00,0x41,0x22,0x1c,0x00]
};

/**
 * Generates an 800 x 500 PNG receipt preview card
 * @param {Object} invoice
 * @param {Object} tenant
 * @returns {Buffer} PNG image buffer
 */
function generateInvoiceImage(invoice, tenant = {}) {
  const shortId = invoice.short_id || invoice.shortId || 'INV-001';
  const receipt = invoice.receipt_json || invoice.receiptData || {};
  
  const storeName = (tenant.store_name || receipt.StoreName || receipt.storeName || 'RETAIL STORE').toUpperCase();
  const invoiceNumber = receipt.InvoiceNumber || receipt.invoiceNumber || receipt.InvoiceNo || shortId;
  const invoiceDate = receipt.Date || receipt.date || new Date().toLocaleDateString('en-IN');
  const customerName = (receipt.CustomerName || receipt.customerName || 'VALUED CUSTOMER').toUpperCase();
  const billTotal = parseFloat(receipt.BillTotal || receipt.billAmount || receipt.totalAmount || 0).toFixed(2);
  const items = receipt.Items || receipt.items || [];

  const width = 800;
  const height = 500;
  const scanlineLen = 1 + width * 3;
  const raw = Buffer.alloc(scanlineLen * height);

  // Helper to set pixel in RGB
  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const offset = y * scanlineLen + 1 + x * 3;
    raw[offset] = r;
    raw[offset + 1] = g;
    raw[offset + 2] = b;
  }

  // Helper to fill rectangle
  function fillRect(rx, ry, rw, rh, r, g, b) {
    for (let y = ry; y < ry + rh && y < height; y++) {
      for (let x = rx; x < rx + rw && x < width; x++) {
        setPixel(x, y, r, g, b);
      }
    }
  }

  // Draw bitmap text scaled by scale factor
  function drawText(text, startX, startY, scale = 2, r = 255, g = 255, b = 255) {
    const upper = String(text).toUpperCase();
    let curX = startX;
    for (let i = 0; i < upper.length; i++) {
      const ch = upper[i];
      const glyph = FONT_5X7[ch] || FONT_5X7[' '];
      for (let col = 0; col < 5; col++) {
        const bits = glyph[col] || 0;
        for (let row = 0; row < 7; row++) {
          if ((bits >> row) & 1) {
            fillRect(curX + col * scale, startY + row * scale, scale, scale, r, g, b);
          }
        }
      }
      curX += 6 * scale;
      if (curX >= width - 20) break;
    }
  }

  // 1. Background fill: Slate Deep Navy
  fillRect(0, 0, width, height, 15, 23, 42);

  // 2. White Card Container in center
  fillRect(24, 24, width - 48, height - 48, 255, 255, 255);

  // 3. Header Band: Royal Indigo Gradient simulation
  fillRect(24, 24, width - 48, 86, 30, 58, 138);

  // Header Store Title
  drawText(storeName.slice(0, 26), 48, 44, 3, 255, 255, 255);
  drawText('OFFICIAL TAX INVOICE RECEIPT', 48, 82, 2, 191, 219, 254);

  // Right-aligned "VERIFIED" badge
  fillRect(width - 200, 48, 150, 38, 22, 163, 74);
  drawText('VERIFIED BILL', width - 188, 60, 2, 255, 255, 255);

  // 4. Invoice & Customer Meta
  fillRect(48, 130, width - 96, 68, 241, 245, 249);
  drawText(`INVOICE: ${invoiceNumber}`, 68, 145, 2, 30, 41, 59);
  drawText(`DATE: ${invoiceDate}`, 68, 168, 2, 100, 116, 139);

  drawText(`BILLED TO: ${customerName.slice(0, 22)}`, 440, 145, 2, 30, 41, 59);
  drawText('STATUS: PAID & DELIVERED', 440, 168, 2, 22, 163, 74);

  // 5. Total Payable Highlight Box
  fillRect(48, 218, width - 96, 110, 238, 242, 255);
  fillRect(48, 218, 8, 110, 79, 70, 229); // Accent left border

  drawText('TOTAL AMOUNT PAYABLE', 80, 240, 2, 79, 70, 229);
  drawText(`INR ${billTotal}`, 80, 275, 5, 30, 41, 59);

  // Item preview count
  const itemsText = items.length > 0 
    ? `${items.length} ITEMS PURCHASED` 
    : 'COMPLETED STORE TRANSACTION';
  drawText(itemsText, 500, 275, 2, 100, 116, 139);

  // 6. Footer Digital Receipt Link Notice
  fillRect(48, 350, width - 96, 85, 248, 250, 252);
  drawText('VIEW INTERACTIVE DIGITAL BILL & EARN LOYALTY POINTS', 68, 368, 2, 15, 23, 42);
  drawText(`HTTPS://BILL.RETAILNODE.IN/T/${shortId}`, 68, 398, 2, 37, 99, 235);

  // Bottom brand watermarking
  drawText('POWERED BY RETAILNODE SAAS BILLING UTILITY', 48, 455, 1, 148, 163, 184);

  // PNG Construction
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = pngChunk('IHDR', ihdr);
  const idatChunk = pngChunk('IDAT', zlib.deflateSync(raw, { level: 6 }));
  const iendChunk = pngChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

module.exports = {
  generateInvoiceImage
};
