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
  deletePricingCampaign
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

// Pricing & Promo Campaigns Management
router.get('/pricing-campaigns', getPricingCampaigns);
router.post('/pricing-campaigns', createPricingCampaign);
router.put('/pricing-campaigns/:id', updatePricingCampaign);
router.delete('/pricing-campaigns/:id', deletePricingCampaign);

module.exports = router;
