const express = require('express');
const {
  getPlatformAnalytics,
  getAllTenants,
  createTenant,
  updateTenant,
  topupQuota,
  getActionLogs,
  getGlobalGateways,
  updateGlobalGateways
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

module.exports = router;
