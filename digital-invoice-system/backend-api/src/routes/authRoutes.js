const express = require('express');
const { 
  register, 
  login, 
  forgotPassword, 
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
router.post('/customers/optout', requireAuth, addOptoutCustomer);
router.delete('/customers/optout/:id', requireAuth, removeOptoutCustomer);
router.get('/customers/:phone/journey', requireAuth, getCustomerJourney);
router.get('/invoices', requireAuth, getStoreInvoices);
router.post('/invoices/quick-bill', requireAuth, createQuickBill);

router.get('/loyalty', requireAuth, getSettings);
router.post('/loyalty', requireAuth, updateSettings);
router.put('/loyalty', requireAuth, updateSettings);
router.get('/loyalty/ledger', requireAuth, getLoyaltyLedger);

const { getWabaSettings, updateWabaSettings } = require('../controllers/wabaController');
router.get('/waba', requireAuth, getWabaSettings);
router.put('/waba', requireAuth, updateWabaSettings);

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

