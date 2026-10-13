const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
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
const { getSettings, updateSettings } = require('../controllers/loyaltyController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
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
router.put('/loyalty', requireAuth, updateSettings);

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

module.exports = router;
