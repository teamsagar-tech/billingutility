/**
 * Telemetry & Audit Logs Controller
 * Serves universal page-view ingestion and audit logs for Merchant & SaaS SuperAdmin panels
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { extractClientInfo } = require('../utils/requestHelper');
const { logPageView } = require('../services/auditService');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_production_key_123!';

/**
 * POST /api/v1/telemetry/page-view
 * Ingestion beacon for frontend navigation telemetry
 */
exports.recordPageView = async (req, res) => {
  try {
    const {
      path,
      pageTitle,
      referrer,
      sessionId,
      durationSeconds,
      panelType
    } = req.body;

    if (!path) {
      return res.status(400).json({ success: false, error: 'Path is required' });
    }

    // Attempt to extract user/tenant identity from JWT if client is authenticated
    let tenantId = null;
    let userId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '');
        const decoded = jwt.verify(token, JWT_SECRET);
        tenantId = decoded.tenantId || null;
        userId = decoded.userId || null;
      } catch (tokenErr) {}
    }

    // Determine panel type if not explicitly passed
    let determinedPanel = panelType || 'public';
    if (path.startsWith('/dashboard')) {
      determinedPanel = 'merchant_panel';
    } else if (path.startsWith('/saas-admin')) {
      determinedPanel = 'saas_admin';
    } else if (path.startsWith('/my-bills') || path.startsWith('/i/lookup')) {
      determinedPanel = 'customer_portal';
    }

    const { ip, userAgent, deviceType } = extractClientInfo(req);

    // Asynchronously log to MySQL and Redis
    logPageView({
      tenantId,
      userId,
      sessionId: sessionId || 'anon_session',
      panelType: determinedPanel,
      path,
      pageTitle,
      referrer,
      ip,
      userAgent,
      deviceType,
      durationSeconds: parseInt(durationSeconds, 10) || 0
    });

    // Return instant lightweight response
    return res.status(200).json({ success: true, recorded: true });
  } catch (error) {
    console.error('Record Page View Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

/**
 * GET /api/v1/telemetry/audit-logs
 * Retrieves security, auth, and action audit trail
 * - SuperAdmin: Accesses platform-wide logs across all tenants
 * - Merchant Admin: Accesses only their tenant_id logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userTenantId = req.user?.tenantId;
    const isSuperAdmin = userRole === 'superadmin';

    const {
      page = 1,
      limit = 50,
      search = '',
      eventCategory = '',
      status = '',
      tenantId = ''
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereClauses = [];

    // Tenant Isolation
    if (!isSuperAdmin) {
      whereClauses.push('al.tenant_id = ?');
      params.push(userTenantId);
    } else if (tenantId) {
      whereClauses.push('al.tenant_id = ?');
      params.push(tenantId);
    }

    // Filter by Event Category
    if (eventCategory) {
      whereClauses.push('al.event_category = ?');
      params.push(eventCategory);
    }

    // Filter by Status
    if (status) {
      whereClauses.push('al.status = ?');
      params.push(status);
    }

    // Search query
    if (search) {
      whereClauses.push(`(
        al.event_name LIKE ? OR 
        al.actor_email LIKE ? OR 
        al.actor_phone LIKE ? OR 
        al.ip_address LIKE ? OR
        t.store_name LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count Total Matching
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total 
       FROM audit_logs al
       LEFT JOIN tenants t ON al.tenant_id = t.id
       ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Fetch Records
    const [rows] = await db.query(
      `SELECT 
        al.id,
        al.tenant_id,
        t.store_name,
        al.user_id,
        al.event_category,
        al.event_name,
        al.status,
        al.actor_email,
        al.actor_phone,
        al.actor_role,
        al.ip_address,
        al.user_agent,
        al.device_type,
        al.failure_reason,
        al.metadata,
        al.created_at
       FROM audit_logs al
       LEFT JOIN tenants t ON al.tenant_id = t.id
       ${whereSql}
       ORDER BY al.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Fetch Audit Logs Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
  }
};

/**
 * GET /api/v1/telemetry/page-views
 * Retrieves panel navigation stream
 */
exports.getPageViewLogs = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userTenantId = req.user?.tenantId;
    const isSuperAdmin = userRole === 'superadmin';

    const {
      page = 1,
      limit = 50,
      search = '',
      panelType = '',
      tenantId = ''
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereClauses = [];

    if (!isSuperAdmin) {
      whereClauses.push('pv.tenant_id = ?');
      params.push(userTenantId);
    } else if (tenantId) {
      whereClauses.push('pv.tenant_id = ?');
      params.push(tenantId);
    }

    if (panelType) {
      whereClauses.push('pv.panel_type = ?');
      params.push(panelType);
    }

    if (search) {
      whereClauses.push(`(
        pv.path LIKE ? OR 
        pv.page_title LIKE ? OR 
        pv.ip_address LIKE ? OR
        t.store_name LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total 
       FROM panel_page_views pv
       LEFT JOIN tenants t ON pv.tenant_id = t.id
       ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const [rows] = await db.query(
      `SELECT 
        pv.id,
        pv.tenant_id,
        t.store_name,
        pv.user_id,
        u.email as user_email,
        u.first_name as user_name,
        pv.session_id,
        pv.panel_type,
        pv.path,
        pv.page_title,
        pv.referrer,
        pv.ip_address,
        pv.user_agent,
        pv.device_type,
        pv.duration_seconds,
        pv.created_at
       FROM panel_page_views pv
       LEFT JOIN tenants t ON pv.tenant_id = t.id
       LEFT JOIN users u ON pv.user_id = u.id
       ${whereSql}
       ORDER BY pv.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Fetch Page View Logs Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve page view logs' });
  }
};

/**
 * GET /api/v1/telemetry/invoice-views
 * Retrieves end-customer digital invoice view history
 */
exports.getInvoiceViewLogs = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userTenantId = req.user?.tenantId;
    const isSuperAdmin = userRole === 'superadmin';

    const {
      page = 1,
      limit = 50,
      search = '',
      shortId = '',
      tenantId = ''
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const params = [];
    let whereClauses = [];

    if (!isSuperAdmin) {
      whereClauses.push('iv.tenant_id = ?');
      params.push(userTenantId);
    } else if (tenantId) {
      whereClauses.push('iv.tenant_id = ?');
      params.push(tenantId);
    }

    if (shortId) {
      whereClauses.push('iv.short_id = ?');
      params.push(shortId);
    }

    if (search) {
      whereClauses.push(`(
        iv.short_id LIKE ? OR 
        iv.customer_phone LIKE ? OR 
        iv.ip_address LIKE ? OR
        t.store_name LIKE ?
      )`);
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total 
       FROM invoice_views iv
       LEFT JOIN tenants t ON iv.tenant_id = t.id
       ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    const [rows] = await db.query(
      `SELECT 
        iv.id,
        iv.tenant_id,
        t.store_name,
        iv.invoice_id,
        iv.short_id,
        iv.customer_phone,
        iv.view_number,
        iv.is_unique_ip,
        iv.ip_address,
        iv.user_agent,
        iv.is_whatsapp_webview,
        iv.device_type,
        iv.referrer,
        iv.created_at
       FROM invoice_views iv
       LEFT JOIN tenants t ON iv.tenant_id = t.id
       ${whereSql}
       ORDER BY iv.id DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit, 10), parseInt(offset, 10)]
    );

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    console.error('Fetch Invoice View Logs Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve invoice view logs' });
  }
};
