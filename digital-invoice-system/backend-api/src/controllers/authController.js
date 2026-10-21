const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const {
  sendEmail,
  generateForgotPasswordEmailHtml,
  generateWelcomeVerificationEmailHtml
} = require('../services/emailClient');
const { extractClientInfo } = require('../utils/requestHelper');
const { logAuthEvent } = require('../services/auditService');

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

    // 6. Send Welcome & Account Verification Email
    if (actualEmail && actualEmail.includes('@')) {
      const verifyOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const welcomeHtml = generateWelcomeVerificationEmailHtml({
        storeName: actualStoreName,
        ownerName: actualOwner,
        userEmail: actualEmail,
        verifyOtp,
        loginUrl: 'https://bill.retailnode.in/login',
        apiToken
      });

      sendEmail({
        tenantId,
        to: actualEmail,
        subject: `Welcome to RetailNode - ${actualStoreName}`,
        html: welcomeHtml
      }).catch(err => console.warn('[Auth] Failed to send welcome email:', err.message));
    }

    // 7. Audit Log: User Sign-Up
    const { ip, userAgent, deviceType } = extractClientInfo(req);
    logAuthEvent({
      tenantId,
      userId,
      eventCategory: 'auth',
      eventName: 'user_signup',
      status: 'success',
      actorEmail: actualEmail,
      actorPhone: rawPhone || null,
      actorRole: 'merchant_admin',
      ip,
      userAgent,
      deviceType,
      metadata: {
        storeName: actualStoreName,
        planTier: 'trial',
        city: city || null
      }
    });

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
    const { ip, userAgent, deviceType } = extractClientInfo(req);

    const [users] = await db.query(
      'SELECT id, tenant_id, email, phone, password_hash, role FROM users WHERE email = ? OR phone = ?',
      [email, email]
    );

    if (users.length === 0) {
      logAuthEvent({
        eventCategory: 'auth',
        eventName: 'login_failed',
        status: 'failed',
        actorEmail: email,
        failureReason: 'user_not_found',
        ip,
        userAgent,
        deviceType,
        metadata: { loginType: loginType || 'merchant' }
      });
      return res.status(401).json({ success: false, error: 'Invalid email/phone or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      logAuthEvent({
        tenantId: user.tenant_id,
        userId: user.id,
        eventCategory: 'auth',
        eventName: 'login_failed',
        status: 'failed',
        actorEmail: user.email,
        actorPhone: user.phone,
        actorRole: user.role,
        failureReason: 'invalid_password',
        ip,
        userAgent,
        deviceType,
        metadata: { loginType: loginType || 'merchant' }
      });
      return res.status(401).json({ success: false, error: 'Invalid email/phone or password' });
    }

    // Role safety check if specific loginType is requested
    if (loginType === 'superadmin' && user.role !== 'superadmin') {
      logAuthEvent({
        tenantId: user.tenant_id,
        userId: user.id,
        eventCategory: 'security',
        eventName: 'login_failed',
        status: 'failed',
        actorEmail: user.email,
        actorRole: user.role,
        failureReason: 'superadmin_role_required',
        ip,
        userAgent,
        deviceType
      });
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

    // Audit Log: Login Success
    logAuthEvent({
      tenantId: user.tenant_id,
      userId: user.id,
      eventCategory: 'auth',
      eventName: 'login_success',
      status: 'success',
      actorEmail: user.email,
      actorPhone: user.phone,
      actorRole: user.role,
      ip,
      userAgent,
      deviceType,
      metadata: { storeName, loginType: loginType || user.role }
    });

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
    const rawInput = req.body.emailOrPhone || req.body.email || req.body.phone;
    if (!rawInput) {
      return res.status(400).json({ success: false, error: 'Please enter your registered email or mobile number.' });
    }

    const cleanInput = String(rawInput).trim();
    const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);

    const [users] = await db.query(
      `SELECT u.id, u.email, u.phone, u.first_name, u.tenant_id, t.store_name 
       FROM users u 
       LEFT JOIN tenants t ON t.id = u.tenant_id 
       WHERE u.email = ? OR u.phone = ? OR u.phone = ? 
       LIMIT 1`,
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

    // Send Forgot Password OTP Email via RetailNode Resend Gateway
    if (user.email && user.email.includes('@')) {
      const resetLink = `https://bill.retailnode.in/forgot-password?email=${encodeURIComponent(user.email)}&otp=${otp}`;
      const emailHtml = generateForgotPasswordEmailHtml({
        userName: user.first_name || 'Store Admin',
        otp,
        resetLink,
        storeName: user.store_name || 'RetailNode Store'
      });

      sendEmail({
        tenantId: null, // Platform System Auth Email (excluded from merchant billing logs)
        to: user.email,
        subject: `Reset Your RetailNode Account Password (OTP: ${otp})`,
        html: emailHtml
      }).catch(err => console.warn('[Auth] Failed to dispatch password reset email:', err.message));
    }

    res.status(200).json({
      success: true,
      message: `Password reset verification OTP sent to your registered email address.`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error processing password reset request' });
  }
};

/**
 * POST /api/v1/auth/verify-reset-otp
 * Step 2: Verify OTP and issue temporary resetToken
 */
exports.verifyResetOtp = async (req, res) => {
  try {
    const rawInput = req.body.emailOrPhone || req.body.email || req.body.phone;
    const otp = req.body.otp;
    if (!rawInput || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email/Phone and verification OTP are required.'
      });
    }

    const cleanInput = String(rawInput).trim();
    const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);

    const [users] = await db.query(
      `SELECT id, email, phone, password_reset_otp, password_reset_expires 
       FROM users 
       WHERE (email = ? OR phone = ? OR phone = ?) AND password_reset_otp = ? AND password_reset_expires > NOW()
       LIMIT 1`,
      [cleanInput, cleanDigits, `91${cleanDigits}`, otp.trim()]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired 6-digit OTP code. Please request a new code.'
      });
    }

    const user = users[0];
    // Issue secure 15-minute reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, purpose: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully! You may now set your new password.',
      resetToken
    });
  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ success: false, error: 'Server error verifying OTP' });
  }
};

/**
 * POST /api/v1/auth/reset-password
 * Step 3: Update password using verified resetToken (or direct OTP verification)
 */
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, emailOrPhone, otp, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long.'
      });
    }

    let targetUserId = null;

    // Method A: Via verified resetToken from Step 2
    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, JWT_SECRET);
        if (decoded.purpose !== 'password_reset' || !decoded.userId) {
          return res.status(400).json({ success: false, error: 'Invalid reset authorization token.' });
        }
        targetUserId = decoded.userId;
      } catch (tokenErr) {
        return res.status(400).json({ success: false, error: 'Reset session has expired. Please verify OTP again.' });
      }
    } 
    // Method B: Fallback via direct OTP verification
    else if (emailOrPhone && otp) {
      const cleanInput = emailOrPhone.trim();
      const cleanDigits = cleanInput.replace(/\D/g, '').slice(-10);

      const [users] = await db.query(
        `SELECT id FROM users 
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
      targetUserId = users[0].id;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Verified reset token or verification code is required.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users 
       SET password_hash = ?, 
           password_reset_otp = NULL, 
           password_reset_expires = NULL 
       WHERE id = ?`,
      [newHash, targetUserId]
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

    // Audit Log: Customer OTP Request
    const { ip, userAgent, deviceType } = extractClientInfo(req);
    logAuthEvent({
      eventCategory: 'customer',
      eventName: 'customer_otp_requested',
      status: 'success',
      actorPhone: cleanDigits,
      actorRole: 'customer',
      ip,
      userAgent,
      deviceType
    });

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
    const { ip, userAgent, deviceType } = extractClientInfo(req);

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
      logAuthEvent({
        eventCategory: 'customer',
        eventName: 'customer_login_failed',
        status: 'failed',
        actorPhone: cleanDigits,
        actorRole: 'customer',
        failureReason: 'invalid_or_expired_otp',
        ip,
        userAgent,
        deviceType
      });
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

    // Audit Log: Customer Login Success
    logAuthEvent({
      eventCategory: 'customer',
      eventName: 'customer_login_success',
      status: 'success',
      actorPhone: cleanDigits,
      actorRole: 'customer',
      ip,
      userAgent,
      deviceType
    });

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
