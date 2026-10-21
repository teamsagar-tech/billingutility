const express = require('express');
const { 
  verifyWebhook, 
  handleWebhook, 
  updateMessageStatus 
} = require('../controllers/webhookController');

const router = express.Router();

// Meta / WABA Webhook verification handshake
router.get('/', verifyWebhook);
router.get('/webhook', verifyWebhook);
router.get('/waba', verifyWebhook);
router.get('/waba/webhook', verifyWebhook);

// Meta / WABA Webhook event listener (sent, delivered, read, failed)
router.post('/', handleWebhook);
router.post('/webhook', handleWebhook);
router.post('/waba', handleWebhook);
router.post('/waba/webhook', handleWebhook);

// Explicit REST Status Update API for waba.mpocket.in
router.post('/status-update', updateMessageStatus);
router.post('/waba/status-update', updateMessageStatus);

module.exports = router;

