const express = require('express');
const { 
  register, 
  login, 
  forgotPassword, 
  verifyResetOtp,
  resetPassword, 
  sendCustomerOtp, 
  verifyCustomerOtp, 
  getMe 
} = require('../controllers/authController');
const { getAnalytics } = require('../controllers/analyticsController');
const { 
  getCustomers, 
  saveCustomerProfile, 
  getCustomerJourney, 
  getOptoutCustomers, 
  syncOptoutWithWaba,
  addOptoutCustomer, 
  removeOptoutCustomer 
} = require('../controllers/customerController');
const { getStoreInvoices, createQuickBill } = require('../controllers/invoiceController');
const { getSettings, updateSettings, getLoyaltyLedger } = require('../controllers/loyaltyController');
const { getActivePricingCampaign } = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Public Dynamic Pricing Campaign
router.get('/pricing/active', getActivePricingCampaign);

// Merchant & User Auth
router.post('/register', register);
router.post('/signup', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);


// Customer OTP-Only Authentication
router.post('/customer/send-otp', sendCustomerOtp);
router.post('/customer/verify-otp', verifyCustomerOtp);

router.get('/me', requireAuth, getMe);
router.get('/analytics', requireAuth, getAnalytics);

// Customer CRM, Profiles, Journey & Optout
router.get('/customers', requireAuth, getCustomers);
router.post('/customers/profile', requireAuth, saveCustomerProfile);
router.get('/customers/optout', requireAuth, getOptoutCustomers);
router.post('/customers/optout/sync', requireAuth, syncOptoutWithWaba);
router.post('/customers/optout', requireAuth, addOptoutCustomer);
router.delete('/customers/optout/:id', requireAuth, removeOptoutCustomer);
router.get('/customers/:phone/journey', requireAuth, getCustomerJourney);
router.get('/invoices', requireAuth, getStoreInvoices);
router.post('/invoices/quick-bill', requireAuth, createQuickBill);

router.get('/loyalty', requireAuth, getSettings);
router.post('/loyalty', requireAuth, updateSettings);
router.put('/loyalty', requireAuth, updateSettings);
router.get('/loyalty/ledger', requireAuth, getLoyaltyLedger);

const { 
  getWabaSettings, 
  updateWabaSettings, 
  getWabaLogs, 
  simulateWebhookStatus, 
  sendTestWhatsAppMessage,
  checkConversationWindowStatus,
  deployUtilityTemplates,
  getTemplateStatuses,
  createCustomTemplate
} = require('../controllers/wabaController');
router.get('/waba', requireAuth, getWabaSettings);
router.put('/waba', requireAuth, updateWabaSettings);
router.get('/waba/logs', requireAuth, getWabaLogs);
router.get('/waba/conversation-window', requireAuth, checkConversationWindowStatus);
router.post('/waba/test', requireAuth, sendTestWhatsAppMessage);
router.post('/waba/simulate-webhook', requireAuth, simulateWebhookStatus);
router.post('/waba/templates/deploy', requireAuth, deployUtilityTemplates);
router.post('/waba/templates/create-custom', requireAuth, createCustomTemplate);
router.get('/waba/templates/status', requireAuth, getTemplateStatuses);


// Resend Email Gateway Routes for Merchants
const {
  getMerchantEmailSettings,
  updateMerchantEmailSettings,
  testMerchantEmail,
  sendInvoiceEmail,
  getMerchantEmailLogs
} = require('../controllers/emailController');

router.get('/email/settings', requireAuth, getMerchantEmailSettings);
router.put('/email/settings', requireAuth, updateMerchantEmailSettings);
router.post('/email/settings', requireAuth, updateMerchantEmailSettings);
router.post('/email/test', requireAuth, testMerchantEmail);
router.post('/invoices/:shortId/send-email', requireAuth, sendInvoiceEmail);
router.get('/email/logs', requireAuth, getMerchantEmailLogs);

const { dispatchDailyReportForTenant } = require('../services/cronScheduler');
router.post('/email/daily-report/test', requireAuth, async (req, res) => {
  try {
    const result = await dispatchDailyReportForTenant(req.user.tenantId, req.body.recipient_email);
    if (result.success) {
      res.status(200).json({ success: true, message: 'Daily 11 PM report successfully dispatched to your email!', data: result });
    } else {
      res.status(400).json({ success: false, error: result.error || 'Failed to dispatch daily report' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const { getSettings: getRefSettings, updateSettings: updateRefSettings, getReport: getRefReport } = require('../controllers/referralController');
router.get('/referrals/settings', requireAuth, getRefSettings);
router.put('/referrals/settings', requireAuth, updateRefSettings);
router.get('/referrals/report', requireAuth, getRefReport);

const { getStoreProfile, updateStoreProfile } = require('../controllers/settingsController');
router.get('/profile', requireAuth, getStoreProfile);
router.put('/profile', requireAuth, updateStoreProfile);
router.post('/profile', requireAuth, updateStoreProfile);

const { getFeedbackSettings, updateFeedbackSettings, getFeedbackResponses, updateFeedbackResolution } = require('../controllers/feedbackController');
router.get('/feedback/settings', requireAuth, getFeedbackSettings);
router.put('/feedback/settings', requireAuth, updateFeedbackSettings);
router.get('/feedback/responses', requireAuth, getFeedbackResponses);
router.put('/feedback/responses/:id/resolution', requireAuth, updateFeedbackResolution);

// Coupons Engine
const { getCoupons, createCoupon, toggleCoupon } = require('../controllers/couponController');
router.get('/coupons', requireAuth, getCoupons);
router.post('/coupons', requireAuth, createCoupon);
router.put('/coupons/:id', requireAuth, toggleCoupon);

// Promotional Ad Banners
const { getBanners, createBanner, toggleBanner } = require('../controllers/bannerController');
router.get('/banners', requireAuth, getBanners);
router.post('/banners', requireAuth, createBanner);
router.put('/banners/:id', requireAuth, toggleBanner);

// WABA & SMS Campaigns Hub
const {
  createCampaign,
  sendSmsCampaign,
  getCampaignsList,
  getCampaignReport,
  getTemplates
} = require('../controllers/campaignController');

router.post('/campaigns/create', requireAuth, createCampaign);
router.post('/campaigns/send-sms', requireAuth, sendSmsCampaign);
router.get('/campaigns/list', requireAuth, getCampaignsList);
router.get('/campaigns/report/:campaignId', requireAuth, getCampaignReport);
router.get('/campaigns/templates', requireAuth, getTemplates);

module.exports = router;

