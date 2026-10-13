const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');

/**
 * POST /api/v1/auth/register
 * Merchant / Store Owner Self-Serve Onboarding
 */
exports.register = async (req, res) => {
  try {
    const {
      storeName,
      store_name,
      ownerName,
      name,
      phone,
      email,
      password,
      address,
      city,
      pincode
    } = req.body;

    const actualStoreName = (storeName || store_name || '').trim();
    const actualEmail = (email || '').trim().toLowerCase();
    const rawPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    const actualOwner = (ownerName || name || '').trim() || 'Store Admin';

    if (!actualStoreName || !actualEmail || !password) {
      return res.status(400).json({
        success: false,
        error: 'Store name, email address, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long.'
      });
    }

    // Check if user already exists with this email
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [actualEmail]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email address already exists. Please login instead.'
      });
    }

    // Check if phone is already used by another merchant user if provided
    if (rawPhone) {
      const [existingPhone] = await db.query('SELECT id FROM users WHERE phone = ?', [rawPhone]);
      if (existingPhone.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'An account with this mobile number already exists. Please login or reset your password.'
        });
      }
    }

    // Generate unique API Token for the tenant
    const apiToken = 'sk_live_' + crypto.randomBytes(24).toString('hex');
    const storeAddress = [address, city, pincode].filter(Boolean).join(', ') || 'Main Store Address';

    // 1. Create Tenant
    const [tenantResult] = await db.query(
      `INSERT INTO tenants (
        store_name, 
        store_phone, 
        store_address, 
        api_token, 
        waba_provider, 
        waba_template_name, 
        plan_tier, 
        plan_valid_until,
        message_quota, 
        messages_used, 
        is_active
      ) VALUES (?, ?, ?, ?, 'waba_custom', 'billing_receipt', 'trial', DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY), 500, 0, 1)`,
      [actualStoreName, rawPhone ? `+91 ${rawPhone}` : null, storeAddress, apiToken]
    );
    const tenantId = tenantResult.insertId;

    // 2. Create Merchant Admin User
    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(
      `INSERT INTO users (tenant_id, email, phone, first_name, password_hash, role) 
       VALUES (?, ?, ?, ?, ?, 'merchant_admin')`,
      [tenantId, actualEmail, rawPhone || null, actualOwner, passwordHash]
    );
    const userId = userResult.insertId;

    // 3. Initialize Default Loyalty Settings
    try {
      await db.query(
        `INSERT INTO loyalty_settings (
          tenant_id, 
          points_per_rupee, 
          rupees_per_point, 
          min_redeem_points, 
          is_active
        ) VALUES (?, 1.00, 0.50, 50, 1)
        ON DUPLICATE KEY UPDATE is_active = 1`,
        [tenantId]
      );
    } catch (e) {
      console.warn('Could not insert default loyalty settings:', e.message);
    }

    // 4. Initialize Default Referral Settings
    try {
      await db.query(
        `INSERT INTO referral_settings (
          tenant_id, 
          referrer_reward_points, 
          referee_discount_pct, 
          is_active
        ) VALUES (?, 50, 10.00, 1)
        ON DUPLICATE KEY UPDATE is_active = 1`,
        [tenantId]
      );
    } catch (e) {
      console.warn('Could not insert default referral settings:', e.message);
    }

    // 5. Generate Instant Auth Token for Frictionless Onboarding
    const token = jwt.sign(
      { userId, tenantId, role: 'merchant_admin', email: actualEmail },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Store account created successfully!',
      token,
      role: 'merchant_admin',
      tenantId,
      storeName: actualStoreName,
      apiToken,
      email: actualEmail
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

/**
 * POST /api/v1/auth/login
 * User & Merchant Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    const [users] = await db.query(
      'SELECT id, tenant_id, email, phone, password_hash, role FROM users WHERE email = ? OR phone = ?',
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email/phone or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email/phone or password' });
    }

    // Role safety check if specific loginType is requested
    if (loginType === 'superadmin' && user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: 'Access denied: SuperAdmin privileges required' });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    let storeName = 'RetailNode SaaS Platform';
    let apiToken = '';
    if (user.tenant_id) {
      const [tenants] = await db.query('SELECT store_name, api_token FROM tenants WHERE id = ?', [user.tenant_id]);
      if (tenants.length > 0) {
        storeName = tenants[0].store_name;
        apiToken = tenants[0].api_token;
      }
    }

    res.status(200).json({
      success: true,
      token,
      role: user.role,
      tenantId: user.tenant_id,
      storeName,
      apiToken,
      email: user.email
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

/**
 * POST /api/v1/auth/forgot-password
 * Step 1: Request Password Reset OTP
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, error: 'Please enter your registered email or mobile number.' });
    }

    const cleanInput = emailOrPhone.trim();
    const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);

    const [users] = await db.query(
      'SELECT id, email, phone, first_name FROM users WHERE email = ? OR phone = ? OR phone = ? LIMIT 1',
      [cleanInput, cleanDigits, `91${cleanDigits}`]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No account registered with this email or mobile number.'
      });
    }

    const user = users[0];
    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in users table with 15-minute expiration
    await db.query(
      `UPDATE users 
       SET password_reset_otp = ?, 
           password_reset_expires = DATE_ADD(NOW(), INTERVAL 15 MINUTE) 
       WHERE id = ?`,
      [otp, user.id]
    );

    res.status(200).json({
      success: true,
      message: `Password reset verification OTP generated successfully. Valid for 15 minutes.`,
      devOtp: otp // Returned for direct UI autofill / testing convenience
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error processing password reset request' });
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Step 2: Verify OTP and update password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;
    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email/Phone, verification OTP, and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    const cleanInput = emailOrPhone.trim();
    const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);

    const [users] = await db.query(
      `SELECT id, email, password_reset_otp, password_reset_expires 
       FROM users 
       WHERE (email = ? OR phone = ? OR phone = ?) AND password_reset_otp = ? AND password_reset_expires > NOW()
       LIMIT 1`,
      [cleanInput, cleanDigits, `91${cleanDigits}`, otp.trim()]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please request a new verification code.'
      });
    }

    const user = users[0];
    const newHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users 
       SET password_hash = ?, 
           password_reset_otp = NULL, 
           password_reset_expires = NULL 
       WHERE id = ?`,
      [newHash, user.id]
    );

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully! You can now sign in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Server error resetting password' });
  }
};

/**
 * POST /api/v1/auth/customer/send-otp
 * Customer OTP-Only Login: Step 1 Send OTP
 */
exports.sendCustomerOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    const cleanDigits = String(phone || '').replace(/\D/g, '').slice(-10);

    if (cleanDigits.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid 10-digit mobile number.'
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to customer_otps table with 10-minute expiry
    await db.query(
      `INSERT INTO customer_otps (phone, otp, expires_at) 
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [cleanDigits, otp]
    );

    res.status(200).json({
      success: true,
      message: `OTP sent to +91 ${cleanDigits}`,
      devOtp: otp // Returned for testing / immediate access
    });
  } catch (error) {
    console.error('Customer send OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP' });
  }
};

/**
 * POST /api/v1/auth/customer/verify-otp
 * Customer OTP-Only Login: Step 2 Verify OTP & Return Digital Bills
 */
exports.verifyCustomerOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const cleanDigits = String(phone || '').replace(/\D/g, '').slice(-10);

    if (!cleanDigits || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number and 6-digit OTP are required.'
      });
    }

    const [rows] = await db.query(
      `SELECT id FROM customer_otps 
       WHERE phone = ? AND otp = ? AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanDigits, otp.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP. Please request a new code.'
      });
    }

    // Clean up used OTP
    await db.query('DELETE FROM customer_otps WHERE phone = ?', [cleanDigits]);

    // Issue Customer JWT
    const token = jwt.sign(
      { phone: cleanDigits, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '90d' }
    );

    // Retrieve all bills across all stores for this customer
    const [bills] = await db.query(
      `SELECT i.short_id, i.receipt_json, i.file_url, i.created_at, t.store_name, t.logo_url
       FROM invoices i
       LEFT JOIN tenants t ON i.tenant_id = t.id
       WHERE i.customer_phone = ? OR i.customer_phone = ? OR i.customer_phone LIKE ?
       ORDER BY i.created_at DESC`,
      [cleanDigits, `91${cleanDigits}`, `%${cleanDigits}`]
    );

    // Retrieve cumulative customer loyalty points
    const [custRows] = await db.query(
      `SELECT customer_name, SUM(loyalty_points) as total_points, SUM(total_spent) as lifetime_spent 
       FROM customers 
       WHERE phone = ? OR phone = ? OR phone LIKE ? 
       GROUP BY customer_name`,
      [cleanDigits, `91${cleanDigits}`, `%${cleanDigits}`]
    );

    const formattedBills = bills.map((b) => {
      let rJson = {};
      try {
        rJson = typeof b.receipt_json === 'string' ? JSON.parse(b.receipt_json) : (b.receipt_json || {});
      } catch (e) {}

      return {
        shortId: b.short_id,
        invoiceNumber: rJson.InvoiceNumber || rJson.invoice_number || b.short_id,
        billTotal: parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0),
        itemsCount: (rJson.items || []).length || 1,
        storeName: b.store_name || rJson.StoreName || 'Retail Store',
        logoUrl: b.logo_url || null,
        fileUrl: b.file_url || null,
        createdAt: b.created_at,
        receiptUrl: `https://bill.retailnode.in/t/${b.short_id}`
      };
    });

    res.status(200).json({
      success: true,
      token,
      phone: cleanDigits,
      customerName: custRows[0]?.customer_name || 'Valued Shopper',
      totalLoyaltyPoints: custRows[0]?.total_points || 0,
      lifetimeSpent: custRows[0]?.lifetime_spent || 0,
      bills: formattedBills
    });
  } catch (error) {
    console.error('Customer verify OTP error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

/**
 * GET /api/v1/auth/me
 * Profile details of currently logged-in user
 */
exports.getMe = async (req, res) => {
  try {
    if (req.user.role === 'superadmin') {
      return res.status(200).json({
        success: true,
        data: {
          role: 'superadmin',
          store_name: 'RetailNode SaaS Command Center',
          email: req.user.email
        }
      });
    }

    const [tenants] = await db.query(
      'SELECT store_name, api_token, plan_tier, message_quota, messages_used FROM tenants WHERE id = ?',
      [req.user.tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...tenants[0],
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
