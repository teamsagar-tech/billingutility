const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { getAnalytics } = require('../controllers/analyticsController');
const { getCustomers } = require('../controllers/customerController');
const { getSettings, updateSettings } = require('../controllers/loyaltyController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.get('/analytics', requireAuth, getAnalytics);
router.get('/customers', requireAuth, getCustomers);

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

const { getFeedbackSettings, updateFeedbackSettings, getFeedbackResponses } = require('../controllers/feedbackController');
router.get('/feedback/settings', requireAuth, getFeedbackSettings);
router.put('/feedback/settings', requireAuth, updateFeedbackSettings);
router.get('/feedback/responses', requireAuth, getFeedbackResponses);

module.exports = router;
