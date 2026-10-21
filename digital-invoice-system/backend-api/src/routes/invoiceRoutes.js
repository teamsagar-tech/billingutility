const express = require('express');
const { 
  uploadInvoice, 
  getInvoice, 
  getInvoicePdf,
  getInvoiceImage,
  updateCustomerProfile,
  unlockInvoice, 
  sendWhatsAppOtp, 
  verifyWhatsAppOtp,
  trackAction,
  getActionStatus,
  lookupCustomerBills,
  getStoreInvoices,
  createQuickBill
} = require('../controllers/invoiceController');
const { requireApiToken, requireAuth, requireAuthOrApiToken } = require('../middleware/auth');
const { submitFeedback } = require('../controllers/feedbackController');

const router = express.Router();

// Merchant invoice listing & quick bill creation (authenticated)
router.get('/', requireAuth, getStoreInvoices);
router.post('/', requireAuthOrApiToken, (req, res, next) => {
  if (req.header('x-api-token') || req.header('X-API-Token') || req.body.receiptData) {
    return uploadInvoice(req, res, next);
  }
  return createQuickBill(req, res, next);
});

// Public customer bills lookup by phone
router.get('/public/lookup', lookupCustomerBills);

// Upload invoice from POS (Requires API Token or JWT)
router.post('/upload', requireAuthOrApiToken, uploadInvoice);

// Public PDF & Image receipt streams for WhatsApp and customer download
router.get('/:slug/pdf', getInvoicePdf);
router.get('/:slug/image', getInvoiceImage);

// Public customer profile update from digital receipt
router.put('/:slug/customer-profile', updateCustomerProfile);
router.post('/:slug/customer-profile', updateCustomerProfile);

// Fetch a single invoice by its short ID (Public URL with 72h check and Redis cache)
router.get('/:slug', getInvoice);

// Customer action tracking (Google review clicks, Instagram, YouTube)
router.post('/:slug/track', trackAction);
router.get('/:slug/track-status', getActionStatus);

// WhatsApp OTP verification for locked invoices (> 72 hours)
router.post('/:slug/send-otp', sendWhatsAppOtp);
router.post('/:slug/verify-otp', verifyWhatsAppOtp);

// Direct phone verification fallback
router.post('/:slug/unlock', unlockInvoice);

// Submit public feedback from receipt
router.post('/public/feedback', submitFeedback);

module.exports = router;
