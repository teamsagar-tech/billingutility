const express = require('express');
const { 
  uploadInvoice, 
  getInvoice, 
  unlockInvoice, 
  sendWhatsAppOtp, 
  verifyWhatsAppOtp,
  trackAction,
  getActionStatus,
  lookupCustomerBills,
  getStoreInvoices,
  createQuickBill
} = require('../controllers/invoiceController');
const { requireApiToken, requireAuth } = require('../middleware/auth');
const { submitFeedback } = require('../controllers/feedbackController');

const router = express.Router();

// Merchant invoice listing & quick bill creation (authenticated)
router.get('/', requireAuth, getStoreInvoices);
router.post('/', requireAuth, createQuickBill);

// Public customer bills lookup by phone
router.get('/public/lookup', lookupCustomerBills);

// Upload invoice from POS (Requires API Token)
router.post('/upload', requireApiToken, uploadInvoice);

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
