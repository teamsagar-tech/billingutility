const express = require('express');
const { uploadInvoice, getInvoice } = require('../controllers/invoiceController');
const { requireApiToken } = require('../middleware/auth');
const { submitFeedback } = require('../controllers/feedbackController');

const router = express.Router();

// Upload invoice from POS (Requires API Token)
router.post('/upload', requireApiToken, uploadInvoice);

// Fetch a single invoice by its short ID (Public URL)
router.get('/:slug', getInvoice);

// Submit public feedback from receipt
router.post('/public/feedback', submitFeedback);

module.exports = router;
