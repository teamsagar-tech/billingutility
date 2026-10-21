const db = require('../config/database');
const redis = require('../config/redis');
const { getResendCredentials, generateInvoiceEmailHtml, sendEmail, testResendConnection } = require('../services/emailClient');

/**
 * GET /api/v1/auth/email/settings
 * Retrieves merchant's Resend configuration
 */
exports.getMerchantEmailSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [rows] = await db.query(
      `SELECT 
        resend_api_key, 
        resend_from_email, 
        resend_from_name, 
        email_billing_enabled, 
        store_name, 
        store_email 
       FROM tenants WHERE id = ?`,
      [tenantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    const tenant = rows[0];
    const hasCustomKey = Boolean(tenant.resend_api_key && tenant.resend_api_key.trim().length > 5);

    // Also check if SuperAdmin has configured platform default
    const [globalRows] = await db.query(
      "SELECT config_value FROM global_configs WHERE config_key = 'DEFAULT_RESEND_API_KEY'"
    );
    const hasPlatformFallback = Boolean(globalRows[0]?.config_value && globalRows[0].config_value.trim().length > 5);

    res.status(200).json({
      success: true,
      data: {
        has_custom_key: hasCustomKey,
        resend_api_key_masked: hasCustomKey ? `${tenant.resend_api_key.slice(0, 7)}••••••••${tenant.resend_api_key.slice(-4)}` : '',
        resend_from_email: tenant.resend_from_email || tenant.store_email || '',
        resend_from_name: tenant.resend_from_name || tenant.store_name || '',
        email_billing_enabled: Boolean(tenant.email_billing_enabled),
        has_platform_fallback: hasPlatformFallback
      }
    });
  } catch (error) {
    console.error('Error fetching merchant email settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email settings' });
  }
};

/**
 * PUT /api/v1/auth/email/settings
 * Updates merchant's Resend configuration
 */
exports.updateMerchantEmailSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      resend_api_key,
      resend_from_email,
      resend_from_name,
      email_billing_enabled
    } = req.body;

    const updates = [];
    const values = [];

    if (resend_api_key !== undefined) {
      // If user passed empty string, clear custom key (to revert to platform fallback)
      updates.push('resend_api_key = ?');
      values.push(resend_api_key.trim() === '' ? null : resend_api_key.trim());
    }

    if (resend_from_email !== undefined) {
      updates.push('resend_from_email = ?');
      values.push(resend_from_email.trim() || null);
    }

    if (resend_from_name !== undefined) {
      updates.push('resend_from_name = ?');
      values.push(resend_from_name.trim() || null);
    }

    if (email_billing_enabled !== undefined) {
      updates.push('email_billing_enabled = ?');
      values.push(email_billing_enabled ? 1 : 0);
    }

    if (updates.length > 0) {
      values.push(tenantId);
      await db.query(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, values);

      // Invalidate Redis profile cache
      try {
        await redis.del(`tenant:profile:${tenantId}`);
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: 'Email gateway settings updated successfully!'
    });
  } catch (error) {
    console.error('Error updating merchant email settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update email settings' });
  }
};

/**
 * POST /api/v1/auth/email/test
 * Sends a test email to verify credentials
 */
exports.testMerchantEmail = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { test_email, api_key, from_email, from_name } = req.body;

    if (!test_email || !test_email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please provide a valid test email address' });
    }

    let resolvedKey = api_key;
    let resolvedFrom = from_email;
    let resolvedName = from_name;

    // If specific test credentials not supplied in body, resolve from store or platform
    if (!resolvedKey) {
      const creds = await getResendCredentials(tenantId);
      resolvedKey = creds.apiKey;
      resolvedFrom = creds.fromEmail;
      resolvedName = creds.fromName;
    }

    if (!resolvedKey) {
      return res.status(400).json({
        success: false,
        error: 'No Resend API Key found. Please enter your Resend API Key or contact platform support.'
      });
    }

    const testResult = await testResendConnection({
      apiKey: resolvedKey,
      fromEmail: resolvedFrom,
      fromName: resolvedName || 'Store Invoices',
      toEmail: test_email
    });

    if (testResult.success) {
      // Log to email_logs
      try {
        await db.query(
          `INSERT INTO email_logs (
            tenant_id, recipient_email, sender_email, subject, resend_email_id, status
          ) VALUES (?, ?, ?, 'Resend Gateway Verification Test', ?, 'sent')`,
          [tenantId, test_email, resolvedFrom || 'onboarding@resend.dev', testResult.emailId || 'test']
        );
      } catch (e) {}

      return res.status(200).json(testResult);
    } else {
      return res.status(400).json(testResult);
    }
  } catch (error) {
    console.error('Error in test email dispatch:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch test email' });
  }
};

/**
 * POST /api/v1/auth/invoices/:shortId/send-email
 * Sends or resends digital bill to customer's email
 */
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { shortId } = req.params;
    const { recipient_email, customer_email } = req.body;

    const targetEmail = (recipient_email || customer_email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid customer recipient email address is required' });
    }

    // 1. Fetch invoice record
    const [invRows] = await db.query(
      'SELECT id, short_id, customer_phone, receipt_json FROM invoices WHERE short_id = ? AND tenant_id = ?',
      [shortId, tenantId]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const invoice = invRows[0];
    const receiptData = typeof invoice.receipt_json === 'string' ? JSON.parse(invoice.receipt_json) : invoice.receipt_json;

    // 2. Fetch customer loyalty points
    const [custRows] = await db.query(
      'SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?',
      [tenantId, invoice.customer_phone]
    );
    const loyaltyBalance = custRows[0]?.loyalty_points || 0;

    // 3. Fetch store profile
    const [storeRows] = await db.query(
      'SELECT store_name, store_address, store_phone FROM tenants WHERE id = ?',
      [tenantId]
    );
    const storeName = storeRows[0]?.store_name || receiptData.StoreName || 'Retail Store';

    // 4. Generate HTML email
    const emailHtml = generateInvoiceEmailHtml({
      receiptData,
      shortId,
      loyalty: { earned: Math.floor((receiptData.BillTotal || 0) / 100), balance: loyaltyBalance },
      storeName
    });

    const emailSubject = `Your Digital Invoice from ${storeName} (#${receiptData.InvoiceNumber || shortId})`;

    // 5. Send via Resend client
    const dispatchResult = await sendEmail({
      tenantId,
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml,
      invoiceId: invoice.id
    });

    if (dispatchResult.success) {
      res.status(200).json({
        success: true,
        message: `Digital invoice successfully emailed to ${targetEmail}!`,
        data: dispatchResult
      });
    } else {
      res.status(400).json({
        success: false,
        error: dispatchResult.error || 'Failed to dispatch email via Resend'
      });
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({ success: false, error: 'Server error dispatching invoice email' });
  }
};

/**
 * GET /api/v1/auth/email/logs
 * Retrieves email history for this merchant
 */
exports.getMerchantEmailLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [rows] = await db.query(
      `SELECT 
        id, 
        invoice_id, 
        recipient_email, 
        sender_email, 
        subject, 
        resend_email_id, 
        status, 
        error_reason, 
        is_default_gateway, 
        created_at 
       FROM email_logs 
       WHERE tenant_id = ? 
         AND invoice_id IS NOT NULL
         AND subject NOT LIKE '%Password%'
         AND subject NOT LIKE '%Reset%'
         AND subject NOT LIKE '%Trial%'
         AND subject NOT LIKE '%Verification Test%'
         AND subject NOT LIKE '%Security Alert%'
         AND subject NOT LIKE '%OTP%'
       ORDER BY id DESC 
       LIMIT 50`,
      [tenantId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching merchant email logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email logs' });
  }
};
