/**
 * Universal Audit & Telemetry Logging Service
 * High-Throughput, Non-Blocking, Multi-Tenant Auditing
 */

const db = require('../config/database');
const redis = require('../config/redis');

/**
 * Logs an authentication, security, or administrative event
 */
async function logAuthEvent({
  tenantId = null,
  userId = null,
  eventCategory = 'auth',
  eventName,
  status = 'success',
  actorEmail = null,
  actorPhone = null,
  actorRole = null,
  ip = '127.0.0.1',
  userAgent = null,
  deviceType = 'desktop',
  failureReason = null,
  metadata = null
}) {
  setImmediate(async () => {
    try {
      await db.query(
        `INSERT INTO audit_logs (
          tenant_id, user_id, event_category, event_name, status,
          actor_email, actor_phone, actor_role, ip_address, user_agent,
          device_type, failure_reason, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId || null,
          userId || null,
          eventCategory,
          eventName,
          status,
          actorEmail || null,
          actorPhone || null,
          actorRole || null,
          ip,
          userAgent ? userAgent.slice(0, 500) : null,
          deviceType,
          failureReason || null,
          metadata ? JSON.stringify(metadata) : null
        ]
      );

      // Increment Redis real-time telemetry counters
      try {
        if (tenantId) {
          await redis.incr(`tenant:audit:${tenantId}:${eventName}`);
        }
        await redis.incr(`platform:audit:${eventName}`);
      } catch (redisErr) {}
    } catch (err) {
      console.error('[AuditService] Failed to record auth event:', err.message);
    }
  });
}

/**
 * Logs a panel navigation / page view event
 */
async function logPageView({
  tenantId = null,
  userId = null,
  sessionId = 'unknown_session',
  panelType = 'merchant_panel',
  path = '/',
  pageTitle = null,
  referrer = null,
  ip = '127.0.0.1',
  userAgent = null,
  deviceType = 'desktop',
  durationSeconds = 0
}) {
  setImmediate(async () => {
    try {
      await db.query(
        `INSERT INTO panel_page_views (
          tenant_id, user_id, session_id, panel_type, path,
          page_title, referrer, ip_address, user_agent, device_type, duration_seconds
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId || null,
          userId || null,
          sessionId,
          panelType,
          path.slice(0, 255),
          pageTitle ? pageTitle.slice(0, 150) : null,
          referrer ? referrer.slice(0, 255) : null,
          ip,
          userAgent ? userAgent.slice(0, 500) : null,
          deviceType,
          parseInt(durationSeconds, 10) || 0
        ]
      );

      // High-speed Redis counter for popular panel screens
      try {
        if (tenantId) {
          await redis.incr(`tenant:views:${tenantId}:${path}`);
        }
        await redis.incr(`platform:views:${path}`);
      } catch (redisErr) {}
    } catch (err) {
      console.error('[AuditService] Failed to record page view:', err.message);
    }
  });
}

/**
 * Logs an end-customer digital invoice view
 */
async function logInvoiceView({
  tenantId,
  invoiceId = null,
  shortId,
  customerPhone,
  ip = '127.0.0.1',
  userAgent = null,
  isWhatsApp = false,
  deviceType = 'mobile',
  referrer = null
}) {
  setImmediate(async () => {
    try {
      // 1. Check if this IP has already viewed this bill to flag unique vs repeat view
      let isUniqueIp = true;
      try {
        const ipKey = `inv_view_ip:${shortId}:${ip}`;
        const exists = await redis.get(ipKey);
        if (exists) {
          isUniqueIp = false;
        } else {
          await redis.setex(ipKey, 86400 * 30, '1'); // 30-day deduplication
        }
      } catch (redisErr) {}

      // 2. Fetch current view count for this invoice to calculate view_number
      let viewNumber = 1;
      try {
        const [cntRows] = await db.query(
          'SELECT COUNT(*) as cnt FROM invoice_views WHERE short_id = ?',
          [shortId]
        );
        viewNumber = (cntRows[0]?.cnt || 0) + 1;
      } catch (cntErr) {}

      // 3. Insert view event into invoice_views
      await db.query(
        `INSERT INTO invoice_views (
          tenant_id, invoice_id, short_id, customer_phone, view_number,
          is_unique_ip, ip_address, user_agent, is_whatsapp_webview, device_type, referrer
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          invoiceId || null,
          shortId,
          customerPhone || 'unknown',
          viewNumber,
          isUniqueIp ? 1 : 0,
          ip,
          userAgent ? userAgent.slice(0, 500) : null,
          isWhatsApp ? 1 : 0,
          deviceType,
          referrer ? referrer.slice(0, 255) : null
        ]
      );

      // 4. Increment the view_count on the invoices table
      await db.query(
        'UPDATE invoices SET view_count = view_count + 1 WHERE short_id = ?',
        [shortId]
      );

      // 5. Real-time Redis counters
      try {
        await redis.incr(`tenant:invoice_views:${tenantId}`);
        await redis.incr(`platform:invoice_views`);
        await redis.incr(`invoice:views:${shortId}`);
      } catch (redisErr) {}
    } catch (err) {
      console.error('[AuditService] Failed to record invoice view:', err.message);
    }
  });
}

module.exports = {
  logAuthEvent,
  logPageView,
  logInvoiceView
};
