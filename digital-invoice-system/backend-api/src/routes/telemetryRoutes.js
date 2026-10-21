const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');
const { requireAuth } = require('../middleware/auth');

// Public Telemetry Ingestion (Extracts auth header if present)
router.post('/page-view', telemetryController.recordPageView);

// Authenticated Audit Stream Endpoints (Multi-tenant isolated for merchants, global for superadmin)
router.get('/audit-logs', requireAuth, telemetryController.getAuditLogs);
router.get('/page-views', requireAuth, telemetryController.getPageViewLogs);
router.get('/invoice-views', requireAuth, telemetryController.getInvoiceViewLogs);

module.exports = router;
