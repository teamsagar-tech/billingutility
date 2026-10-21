/**
 * Ultra-Fast Native Vector PDF Generator for Retail Tax Invoices
 * Zero external binary dependencies, zero Chromium/Puppeteer overhead.
 * Generates standards-compliant PDF 1.4 with crisp typography, tables, and borders.
 */

function escapePdfString(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]+/g, ' ');
}

/**
 * Generates a complete PDF 1.4 Buffer for an invoice
 * @param {Object} invoice
 * @param {Object} tenant
 * @returns {Buffer} PDF binary buffer
 */
function generateInvoicePdf(invoice, tenant = {}) {
  const shortId = invoice.short_id || invoice.shortId || 'INV-001';
  const receipt = invoice.receipt_json || invoice.receiptData || {};
  
  const storeName = tenant.store_name || receipt.StoreName || receipt.storeName || 'RetailNode Store';
  const storeAddress = tenant.store_address || receipt.StoreAddress || '';
  const storePhone = tenant.store_phone || receipt.StorePhone || '';
  const storeGst = tenant.gstin || receipt.GSTIN || receipt.gstin || '';
  
  const invoiceNumber = receipt.InvoiceNumber || receipt.invoiceNumber || receipt.InvoiceNo || shortId;
  const invoiceDate = receipt.Date || receipt.date || (invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'));
  const customerName = receipt.CustomerName || receipt.customerName || invoice.customer_name || 'Valued Customer';
  const customerPhone = invoice.customer_phone || receipt.CustomerPhone || receipt.customerPhone || '';
  const paymentMode = receipt.PaymentMode || receipt.paymentMode || 'Cash / Digital';
  
  const items = receipt.Items || receipt.items || [];
  const billTotal = parseFloat(receipt.BillTotal || receipt.billAmount || receipt.totalAmount || receipt.grandTotal || 0).toFixed(2);
  const taxAmount = parseFloat(receipt.TaxAmount || receipt.taxAmount || 0).toFixed(2);
  const discountAmount = parseFloat(receipt.Discount || receipt.discount || 0).toFixed(2);
  const subTotal = (parseFloat(billTotal) - parseFloat(taxAmount) + parseFloat(discountAmount)).toFixed(2);
  
  const loyaltyPoints = invoice.loyalty_points || receipt.LoyaltyPoints || 0;
  const baseUrl = process.env.APP_URL || 'https://bill.retailnode.in';
  const receiptUrl = `${baseUrl}/t/${shortId}`;

  // Page dimensions: A4 portrait (595 x 842 points)
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 40;
  const contentWidth = pageWidth - (margin * 2);

  // Buffer stream collector
  const streamCommands = [];

  function drawText(font, size, x, y, text, color = [0.1, 0.1, 0.1]) {
    streamCommands.push(
      `${color[0]} ${color[1]} ${color[2]} rg`,
      'BT',
      `/${font} ${size} Tf`,
      `1 0 0 1 ${x} ${y} Tm`,
      `(${escapePdfString(text)}) Tj`,
      'ET'
    );
  }

  function drawRect(x, y, w, h, fillColor = null, strokeColor = null) {
    if (fillColor) {
      streamCommands.push(
        `${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`,
        `${x} ${y} ${w} ${h} re`,
        'f'
      );
    }
    if (strokeColor) {
      streamCommands.push(
        `${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`,
        '0.75 w',
        `${x} ${y} ${w} ${h} re`,
        'S'
      );
    }
  }

  function drawLine(x1, y1, x2, y2, color = [0.8, 0.8, 0.8], width = 0.5) {
    streamCommands.push(
      `${color[0]} ${color[1]} ${color[2]} RG`,
      `${width} w`,
      `${x1} ${y1} m`,
      `${x2} ${y2} l`,
      'S'
    );
  }

  // --- Background Canvas ---
  drawRect(0, 0, pageWidth, pageHeight, [0.98, 0.99, 1.0], null); // Subtle warm background
  drawRect(margin, margin, contentWidth, pageHeight - (margin * 2), [1.0, 1.0, 1.0], [0.88, 0.90, 0.93]); // White paper card

  // --- Top Branding Banner ---
  let cursorY = pageHeight - margin - 35;
  drawRect(margin, pageHeight - margin - 75, contentWidth, 75, [0.11, 0.20, 0.36], null); // Slate navy header

  drawText('F2', 18, margin + 20, cursorY, storeName, [1.0, 1.0, 1.0]);
  cursorY -= 16;
  const storeSub = [storeAddress, storePhone ? `Tel: ${storePhone}` : '', storeGst ? `GSTIN: ${storeGst}` : '']
    .filter(Boolean).join(' | ');
  drawText('F1', 8.5, margin + 20, cursorY, storeSub || 'Official Tax Invoice Receipt', [0.80, 0.85, 0.95]);

  // Tax Invoice Badge
  drawRect(pageWidth - margin - 140, pageHeight - margin - 55, 120, 24, [0.16, 0.38, 0.85], null);
  drawText('F2', 10, pageWidth - margin - 128, pageHeight - margin - 43, 'TAX INVOICE', [1.0, 1.0, 1.0]);

  // --- Invoice & Customer Meta Grid ---
  cursorY = pageHeight - margin - 95;
  drawRect(margin + 10, cursorY - 55, contentWidth - 20, 60, [0.96, 0.97, 0.99], [0.88, 0.91, 0.94]);

  // Left column: Invoice Details
  drawText('F2', 9, margin + 25, cursorY - 18, 'INVOICE NUMBER:', [0.4, 0.45, 0.55]);
  drawText('F2', 10, margin + 115, cursorY - 18, invoiceNumber, [0.1, 0.15, 0.25]);

  drawText('F2', 9, margin + 25, cursorY - 34, 'INVOICE DATE:', [0.4, 0.45, 0.55]);
  drawText('F1', 9.5, margin + 115, cursorY - 34, invoiceDate, [0.1, 0.15, 0.25]);

  drawText('F2', 9, margin + 25, cursorY - 49, 'PAYMENT MODE:', [0.4, 0.45, 0.55]);
  drawText('F1', 9.5, margin + 115, cursorY - 49, paymentMode, [0.1, 0.15, 0.25]);

  // Right column: Customer Details
  const midX = margin + (contentWidth / 2) + 10;
  drawText('F2', 9, midX, cursorY - 18, 'CUSTOMER NAME:', [0.4, 0.45, 0.55]);
  drawText('F2', 10, midX + 95, cursorY - 18, customerName, [0.1, 0.15, 0.25]);

  drawText('F2', 9, midX, cursorY - 34, 'MOBILE NUMBER:', [0.4, 0.45, 0.55]);
  drawText('F1', 9.5, midX + 95, cursorY - 34, customerPhone || 'N/A', [0.1, 0.15, 0.25]);

  drawText('F2', 9, midX, cursorY - 49, 'LOYALTY REWARD:', [0.4, 0.45, 0.55]);
  drawText('F2', 9.5, midX + 95, cursorY - 49, `${loyaltyPoints} Points Earned`, [0.05, 0.6, 0.3]);

  // --- Line Items Table ---
  cursorY -= 80;
  const tableHeaderY = cursorY;
  drawRect(margin + 10, tableHeaderY - 22, contentWidth - 20, 22, [0.15, 0.23, 0.38], null);

  // Column Headers
  drawText('F2', 8.5, margin + 20, tableHeaderY - 15, '#', [1.0, 1.0, 1.0]);
  drawText('F2', 8.5, margin + 50, tableHeaderY - 15, 'ITEM DESCRIPTION', [1.0, 1.0, 1.0]);
  drawText('F2', 8.5, margin + 310, tableHeaderY - 15, 'QTY', [1.0, 1.0, 1.0]);
  drawText('F2', 8.5, margin + 370, tableHeaderY - 15, 'RATE (INR)', [1.0, 1.0, 1.0]);
  drawText('F2', 8.5, margin + 450, tableHeaderY - 15, 'AMOUNT (INR)', [1.0, 1.0, 1.0]);

  cursorY = tableHeaderY - 24;
  const rowHeight = 22;
  const maxRows = Math.min(items.length, 18);

  for (let i = 0; i < maxRows; i++) {
    const itm = items[i] || {};
    const name = itm.name || itm.ItemName || itm.description || itm.title || `Item ${i + 1}`;
    const qty = itm.qty || itm.quantity || itm.Qty || 1;
    const rate = parseFloat(itm.rate || itm.price || itm.mrp || 0).toFixed(2);
    const amt = parseFloat(itm.amount || itm.total || (qty * rate) || 0).toFixed(2);

    const isEven = i % 2 === 0;
    if (isEven) {
      drawRect(margin + 10, cursorY - rowHeight + 4, contentWidth - 20, rowHeight, [0.98, 0.98, 0.99], null);
    }
    drawLine(margin + 10, cursorY - rowHeight + 4, margin + contentWidth - 10, cursorY - rowHeight + 4, [0.90, 0.92, 0.95]);

    drawText('F1', 9, margin + 20, cursorY - 11, String(i + 1), [0.3, 0.35, 0.4]);
    drawText('F1', 9, margin + 50, cursorY - 11, name.slice(0, 38), [0.15, 0.2, 0.25]);
    drawText('F1', 9, margin + 315, cursorY - 11, String(qty), [0.2, 0.25, 0.3]);
    drawText('F1', 9, margin + 375, cursorY - 11, rate, [0.2, 0.25, 0.3]);
    drawText('F2', 9, margin + 455, cursorY - 11, amt, [0.1, 0.15, 0.2]);

    cursorY -= rowHeight;
  }

  // If no items were passed, render single default row
  if (items.length === 0) {
    drawText('F1', 9, margin + 20, cursorY - 11, '1', [0.3, 0.35, 0.4]);
    drawText('F1', 9, margin + 50, cursorY - 11, 'Retail Store Purchase', [0.15, 0.2, 0.25]);
    drawText('F1', 9, margin + 315, cursorY - 11, '1', [0.2, 0.25, 0.3]);
    drawText('F1', 9, margin + 375, cursorY - 11, billTotal, [0.2, 0.25, 0.3]);
    drawText('F2', 9, margin + 455, cursorY - 11, billTotal, [0.1, 0.15, 0.2]);
    cursorY -= rowHeight;
  }

  // --- Subtotal & Summary Box ---
  cursorY -= 15;
  const summaryX = margin + contentWidth - 230;

  drawText('F1', 9.5, summaryX, cursorY, 'Sub Total:', [0.4, 0.45, 0.5]);
  drawText('F2', 9.5, margin + contentWidth - 65, cursorY, `INR ${subTotal}`, [0.2, 0.25, 0.3]);
  cursorY -= 16;

  if (parseFloat(taxAmount) > 0) {
    drawText('F1', 9.5, summaryX, cursorY, 'Total GST Tax:', [0.4, 0.45, 0.5]);
    drawText('F2', 9.5, margin + contentWidth - 65, cursorY, `INR ${taxAmount}`, [0.2, 0.25, 0.3]);
    cursorY -= 16;
  }

  if (parseFloat(discountAmount) > 0) {
    drawText('F1', 9.5, summaryX, cursorY, 'Store Discount:', [0.05, 0.55, 0.3]);
    drawText('F2', 9.5, margin + contentWidth - 65, cursorY, `-INR ${discountAmount}`, [0.05, 0.55, 0.3]);
    cursorY -= 16;
  }

  // Grand Total Highlight Bar
  cursorY -= 8;
  drawRect(summaryX - 10, cursorY - 26, 230, 26, [0.10, 0.45, 0.90], null);
  drawText('F2', 12, summaryX + 5, cursorY - 18, 'TOTAL PAYABLE:', [1.0, 1.0, 1.0]);
  drawText('F2', 13, margin + contentWidth - 75, cursorY - 18, `INR ${billTotal}`, [1.0, 1.0, 1.0]);

  // --- Digital Invoice & QR Footer Bar ---
  const footerY = margin + 35;
  drawRect(margin + 10, footerY - 15, contentWidth - 20, 60, [0.95, 0.97, 1.0], [0.85, 0.90, 0.96]);

  drawText('F2', 10, margin + 25, footerY + 28, 'Live Interactive Digital Receipt & History', [0.12, 0.25, 0.55]);
  drawText('F1', 8.5, margin + 25, footerY + 12, `View item warranties, rate your experience, and earn bonus loyalty points at:`, [0.35, 0.4, 0.5]);
  drawText('F2', 9.5, margin + 25, footerY - 4, receiptUrl, [0.12, 0.45, 0.90]);

  drawText('F1', 7.5, margin + 20, margin + 8, 'This is an authentic computer-generated digital tax receipt powered by RetailNode Billing SaaS.', [0.6, 0.65, 0.7]);

  // --- Build PDF Document Objects ---
  const streamContent = streamCommands.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const objects = [];
  function addObj(str) {
    objects.push(str);
    return objects.length;
  }

  // 1: Catalog
  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  // 2: Pages
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  // 3: Page
  addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`);
  // 4: Regular Font (Helvetica)
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  // 5: Bold Font (Helvetica-Bold)
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  // 6: Contents Stream
  addObj(`<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`);

  // Assemble cross-reference table
  let pdf = '%PDF-1.4\n';
  const xref = [0];
  for (let i = 0; i < objects.length; i++) {
    xref.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    pdf += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}

module.exports = {
  generateInvoicePdf
};
