const express = require('express');
const {
  getPlatformAnalytics,
  getAllTenants,
  createTenant,
  updateTenant,
  topupQuota,
  getActionLogs,
  getGlobalGateways,
  updateGlobalGateways,
  getPricingCampaigns,
  createPricingCampaign,
  updatePricingCampaign,
  deletePricingCampaign,
  getEmailGateway,
  updateEmailGateway,
  testAdminEmailGateway,
  getAdminEmailLogs,
  getAdminWhatsAppLogs
} = require('../controllers/adminController');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

// Strict SuperAdmin security guard on all routes
router.use(requireAuth, requireSuperAdmin);

// Platform Analytics
router.get('/analytics', getPlatformAnalytics);

// Tenants Management
router.get('/tenants', getAllTenants);
router.post('/tenants', createTenant);
router.put('/tenants/:id', updateTenant);
router.post('/tenants/:id/quota', topupQuota);

// Action Logs & Audit Stream
router.get('/action-logs', getActionLogs);

// Global Gateway Configuration
router.get('/gateways', getGlobalGateways);
router.put('/gateways', updateGlobalGateways);

// WhatsApp Message Audit Logs
router.get('/whatsapp-logs', getAdminWhatsAppLogs);

// Global Email Gateway (Resend)
router.get('/email-gateway', getEmailGateway);
router.put('/email-gateway', updateEmailGateway);
router.post('/email-gateway/test', testAdminEmailGateway);
router.get('/email-logs', getAdminEmailLogs);

// Pricing & Promo Campaigns Management
router.get('/pricing-campaigns', getPricingCampaigns);
router.post('/pricing-campaigns', createPricingCampaign);
router.put('/pricing-campaigns/:id', updatePricingCampaign);
router.delete('/pricing-campaigns/:id', deletePricingCampaign);

// Razorpay Gateway Management
const { getRazorpayGateway, updateRazorpayGateway } = require('../controllers/paymentController');
router.get('/payments/gateway', getRazorpayGateway);
router.put('/payments/gateway', updateRazorpayGateway);

// Manual Cron Triggers for SuperAdmin
const { dispatchDailyReportForTenant, checkAndDispatchExpiryReminders } = require('../services/cronScheduler');
router.post('/cron/trigger-daily-reports', async (req, res) => {
  try {
    const [tenants] = await require('../config/database').query('SELECT id FROM tenants WHERE is_active = 1');
    const results = [];
    for (const t of tenants) {
      const r = await dispatchDailyReportForTenant(t.id);
      results.push({ tenant_id: t.id, success: r.success });
    }
    res.status(200).json({ success: true, count: results.length, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/cron/trigger-expiry-reminders', async (req, res) => {
  try {
    const result = await checkAndDispatchExpiryReminders();
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

