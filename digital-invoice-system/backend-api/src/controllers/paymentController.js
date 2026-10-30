const crypto = require('crypto');
const axios = require('axios');
const db = require('../config/database');
const logger = require('../utils/logger');
const { sendEmail, generatePaymentSuccessEmailHtml } = require('../services/emailClient');
const { sendWhatsAppMessage } = require('../services/wabaClient');

const RAZORPAY_API_URL = 'https://api.razorpay.com/v1';

/**
 * Resolves Razorpay credentials from global_configs or environment
 */
async function getRazorpayCredentials() {
  let keyId = process.env.RAZORPAY_KEY_ID || '';
  let keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  try {
    const [rows] = await db.query(
      `SELECT config_key, config_value FROM global_configs 
       WHERE config_key IN ('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET')`
    );
    rows.forEach(r => {
      if (r.config_key === 'RAZORPAY_KEY_ID' && r.config_value) keyId = r.config_value.trim();
      if (r.config_key === 'RAZORPAY_KEY_SECRET' && r.config_value) keySecret = r.config_value.trim();
    });
  } catch (e) {
    logger.warn(`[Payment] Failed to query Razorpay configs: ${e.message}`);
  }

  return {
    keyId: keyId.trim(),
    keySecret: keySecret.trim(),
    isConfigured: Boolean(keyId && keySecret && keyId.length > 5)
  };
}

/**
 * GET /api/v1/payments/config
 * Returns public Razorpay Key ID for frontend Checkout SDK
 */
exports.getPublicConfig = async (req, res) => {
  try {
    const creds = await getRazorpayCredentials();
    res.status(200).json({
      success: true,
      data: {
        is_configured: creds.isConfigured,
        key_id: creds.keyId,
        key_id_masked: creds.keyId ? `${creds.keyId.slice(0, 8)}••••••••` : '',
        standard_price: 6000,
        currency: 'INR'
      }
    });
  } catch (error) {
    logger.error('Error fetching Razorpay public config:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve payment configuration' });
  }
};

/**
 * POST /api/v1/payments/create-order
 * Creates a Razorpay Order for Annual Growth Plan or Quota Top-Up
 */
exports.createOrder = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.body.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required to create subscription order' });
    }

    const { amount = 6000, plan_tier = 'growth', currency = 'INR' } = req.body;
    const creds = await getRazorpayCredentials();

    const amountInPaise = Math.round(Number(amount) * 100);
    const receiptId = `sub_${tenantId}_${Date.now()}`;

    // If Razorpay API credentials are not yet entered by user, create a mock order
    if (!creds.isConfigured) {
      const mockOrderId = `order_mock_${Date.now()}`;
      await db.query(
        `INSERT INTO subscription_payments (
          tenant_id, order_id, amount, currency, plan_tier, status
        ) VALUES (?, ?, ?, ?, ?, 'created')`,
        [tenantId, mockOrderId, amount, currency, plan_tier]
      );

      return res.status(200).json({
        success: true,
        mock_mode: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency,
        keyId: 'rzp_test_placeholder',
        message: 'Razorpay keys not yet configured. Mock order generated for testing.'
      });
    }

    // Call Official Razorpay Orders API
    const authHeader = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
    const response = await axios.post(
      `${RAZORPAY_API_URL}/orders`,
      {
        amount: amountInPaise,
        currency,
        receipt: receiptId,
        notes: {
          tenant_id: String(tenantId),
          plan_tier,
          platform: 'RetailNode SaaS'
        }
      },
      {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const razorpayOrder = response.data;

    // Record order in database
    await db.query(
      `INSERT INTO subscription_payments (
        tenant_id, order_id, amount, currency, plan_tier, status
      ) VALUES (?, ?, ?, ?, ?, 'created')`,
      [tenantId, razorpayOrder.id, amount, currency, plan_tier]
    );

    res.status(200).json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: creds.keyId
    });
  } catch (error) {
    const errorMsg = error.response?.data?.error?.description || error.message;
    logger.error('Error creating Razorpay order:', errorMsg);
    res.status(500).json({ success: false, error: `Razorpay order creation failed: ${errorMsg}` });
  }
};

/**
 * POST /api/v1/payments/verify
 * Verifies Razorpay Signature, activates Growth Plan, and sends Payment Success Email
 */
exports.verifyPayment = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.body.tenant_id;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      mock_mode
    } = req.body;

    if (!razorpay_order_id) {
      return res.status(400).json({ success: false, error: 'razorpay_order_id is required' });
    }

    const creds = await getRazorpayCredentials();

    // Verify HMAC Signature (Skip if mock mode)
    if (!mock_mode && creds.keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', creds.keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        logger.warn(`[Payment] Invalid Razorpay signature for order ${razorpay_order_id}`);
        await db.query(
          `UPDATE subscription_payments 
           SET status = 'failed', error_message = 'HMAC signature verification failed' 
           WHERE order_id = ?`,
          [razorpay_order_id]
        );
        return res.status(400).json({ success: false, error: 'Payment signature verification failed' });
      }
    }

    // 1. Update Payment Record to Captured
    await db.query(
      `UPDATE subscription_payments 
       SET payment_id = ?, signature = ?, status = 'captured', paid_at = NOW(), updated_at = NOW() 
       WHERE order_id = ?`,
      [razorpay_payment_id || `pay_mock_${Date.now()}`, razorpay_signature || 'mock_sig', razorpay_order_id]
    );

    // 2. Activate Growth Plan (+365 days) on Tenant
    await db.query(
      `UPDATE tenants 
       SET plan_tier = 'growth',
           plan_valid_until = DATE_ADD(GREATEST(CURRENT_DATE, COALESCE(plan_valid_until, CURRENT_DATE)), INTERVAL 365 DAY),
           message_quota = message_quota + 5000,
           is_active = 1
       WHERE id = ?`,
      [tenantId]
    );

    // 3. Fetch Tenant & User Details to Dispatch Payment Confirmation Email & WhatsApp
    const [tenantRows] = await db.query(
      `SELECT t.store_name, t.plan_valid_until, t.store_email, t.store_phone, u.email as admin_email, u.phone as admin_phone 
       FROM tenants t 
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'merchant_admin'
       WHERE t.id = ? LIMIT 1`,
      [tenantId]
    );

    const tenant = tenantRows[0];
    const recipientEmail = tenant?.store_email || tenant?.admin_email;
    const recipientPhone = tenant?.store_phone || tenant?.admin_phone;
    const validUntilFormatted = tenant?.plan_valid_until 
      ? new Date(tenant.plan_valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '365 Days from today';

    // A. Send Resend Email Receipt
    if (recipientEmail && recipientEmail.includes('@')) {
      const emailHtml = generatePaymentSuccessEmailHtml({
        storeName: tenant.store_name || 'Retail Store',
        planName: 'Growth Annual Plan',
        amount: '6000.00',
        paymentId: razorpay_payment_id || `pay_mock_${Date.now()}`,
        orderId: razorpay_order_id,
        validUntil: validUntilFormatted
      });

      sendEmail({
        tenantId,
        to: recipientEmail,
        subject: `Payment Confirmed & Subscription Activated - ${tenant.store_name}`,
        html: emailHtml
      }).catch(err => logger.warn(`[Payment] Failed to send receipt email: ${err.message}`));
    }

    // B. Send Instant WhatsApp Confirmation Receipt via WABA
    if (recipientPhone) {
      const waReceiptText = 
        `🎉 *Payment Confirmed & Subscription Activated!*\n\n` +
        `🏪 *Store:* ${tenant.store_name || 'Retail Store'}\n` +
        `📦 *Plan:* Growth Annual Plan (₹6,000 / year)\n` +
        `🆔 *Payment ID:* ${razorpay_payment_id || `pay_${Date.now()}`}\n` +
        `📅 *Valid Until:* ${validUntilFormatted}\n` +
        `⚡ *Quota:* +5,000 WhatsApp Bills added\n` +
        `⭐ *Google Review Hub & Standee:* 100% Active\n\n` +
        `Thank you for growing with RetailNode! Access your command center anytime at https://bill.retailnode.in`;

      sendWhatsAppMessage({
        tenantId,
        to: recipientPhone,
        text: waReceiptText
      }).catch(err => logger.warn(`[Payment] Failed to send WhatsApp receipt: ${err.message}`));
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully! Your Annual Growth Plan is active.',
      data: {
        plan_tier: 'growth',
        valid_until: validUntilFormatted
      }
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({ success: false, error: 'Internal server error verifying payment' });
  }
};

/**
 * GET /api/v1/payments/history
 * Retrieves billing transaction history for merchant
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT id, order_id, payment_id, amount, currency, plan_tier, status, created_at 
       FROM subscription_payments 
       WHERE tenant_id = ? 
       ORDER BY id DESC LIMIT 50`,
      [tenantId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve payment history' });
  }
};

/**
 * GET /api/v1/admin/payments/gateway
 * SuperAdmin endpoint to get Razorpay configuration
 */
exports.getRazorpayGateway = async (req, res) => {
  try {
    const creds = await getRazorpayCredentials();
    res.status(200).json({
      success: true,
      data: {
        is_configured: creds.isConfigured,
        key_id: creds.keyId,
        key_secret_masked: creds.keySecret ? '••••••••' : ''
      }
    });
  } catch (error) {
    logger.error('Error fetching Razorpay gateway status:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve Razorpay credentials' });
  }
};

/**
 * PUT /api/v1/admin/payments/gateway
 * SuperAdmin endpoint to update Razorpay credentials
 */
exports.updateRazorpayGateway = async (req, res) => {
  try {
    const { key_id, key_secret } = req.body;
    if (key_id !== undefined) {
      await db.query(
        `INSERT INTO global_configs (config_key, config_value, is_secret) 
         VALUES ('RAZORPAY_KEY_ID', ?, 0) 
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [key_id.trim()]
      );
    }
    if (key_secret !== undefined) {
      await db.query(
        `INSERT INTO global_configs (config_key, config_value, is_secret) 
         VALUES ('RAZORPAY_KEY_SECRET', ?, 1) 
         ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
        [key_secret.trim()]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Razorpay Gateway credentials updated successfully!'
    });
  } catch (error) {
    logger.error('Error updating Razorpay configs:', error);
    res.status(500).json({ success: false, error: 'Failed to update Razorpay credentials' });
  }
};

/**
 * POST /api/v1/payments/test-receipt
 * Triggers test payment confirmation receipt to both Email and WhatsApp
 */
exports.testReceiptDispatch = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId || req.body?.tenant_id;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID required' });
    }

    const [tenantRows] = await db.query(
      `SELECT t.store_name, t.plan_valid_until, t.store_email, t.store_phone, u.email as admin_email, u.phone as admin_phone 
       FROM tenants t 
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'merchant_admin'
       WHERE t.id = ? LIMIT 1`,
      [tenantId]
    );

    if (tenantRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Store tenant not found' });
    }

    const tenant = tenantRows[0];
    const recipientEmail = tenant?.store_email || tenant?.admin_email;
    const recipientPhone = tenant?.store_phone || tenant?.admin_phone;
    const validUntilFormatted = tenant?.plan_valid_until 
      ? new Date(tenant.plan_valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '365 Days from today';

    const testPaymentId = `pay_test_${Date.now()}`;
    const testOrderId = `order_test_${Date.now()}`;
    const dispatchResults = { email: false, whatsapp: false };

    // 1. Dispatch Email Receipt
    if (recipientEmail && recipientEmail.includes('@')) {
      const emailHtml = generatePaymentSuccessEmailHtml({
        storeName: tenant.store_name || 'Retail Store',
        planName: 'Growth Annual Plan (Verified Active)',
        amount: '6000.00',
        paymentId: testPaymentId,
        orderId: testOrderId,
        validUntil: validUntilFormatted
      });

      sendEmail({
        tenantId,
        to: recipientEmail,
        subject: `[Verified Receipt] Payment Confirmed & Subscription Active - ${tenant.store_name}`,
        html: emailHtml
      }).then(() => {
        logger.info(`[Payment-Test] Email receipt sent to ${recipientEmail}`);
      }).catch(err => {
        logger.warn(`[Payment-Test] Email receipt failed: ${err.message}`);
      });
      dispatchResults.email = true;
    }

    // 2. Dispatch WhatsApp Receipt via WABA
    if (recipientPhone) {
      const waReceiptText = 
        `🎉 *[Verified Receipt] Payment Confirmed & Subscription Active!*\n\n` +
        `🏪 *Store:* ${tenant.store_name || 'Retail Store'}\n` +
        `📦 *Plan:* Growth Annual Plan (₹6,000 / year)\n` +
        `🆔 *Payment ID:* ${testPaymentId}\n` +
        `📅 *Valid Until:* ${validUntilFormatted}\n` +
        `⚡ *Quota:* +5,000 WhatsApp Bills Active\n` +
        `⭐ *Google Review Hub & Standee:* 100% Active\n\n` +
        `Thank you for choosing RetailNode. Access your merchant portal anytime at https://bill.retailnode.in`;

      sendWhatsAppMessage({
        tenantId,
        to: recipientPhone,
        text: waReceiptText
      }).then(() => {
        logger.info(`[Payment-Test] WhatsApp receipt sent to ${recipientPhone}`);
      }).catch(err => {
        logger.warn(`[Payment-Test] WhatsApp receipt failed: ${err.message}`);
      });
      dispatchResults.whatsapp = true;
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmation test receipt dispatched to Email & WhatsApp!',
      data: {
        recipient_email: recipientEmail || 'Not configured',
        recipient_phone: recipientPhone || 'Not configured',
        dispatched: dispatchResults
      }
    });
  } catch (error) {
    logger.error('Error testing receipt dispatch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

