const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');

// Public Razorpay config for frontend
router.get('/config', paymentController.getPublicConfig);

// Authenticated Merchant Payment Endpoints
router.post('/create-order', requireAuth, paymentController.createOrder);
router.post('/verify', requireAuth, paymentController.verifyPayment);
router.post('/test-receipt', requireAuth, paymentController.testReceiptDispatch);
router.get('/history', requireAuth, paymentController.getPaymentHistory);

module.exports = router;
