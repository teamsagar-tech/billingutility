const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const redis = require('../config/redis');
const { sendWhatsAppMessage, getWabaCredentials } = require('../services/wabaClient');

// Normalize phone numbers to 10 digits for accurate matching
const normalizePhone = (p) => {
  if (!p) return '';
  const digits = String(p).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
};

// Generate a random 8-character base62 string
const generateShortId = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

exports.uploadInvoice = async (req, res) => {
  try {
    const { receiptData } = req.body; 
    const tenantId = req.tenantId; // Injected by requireApiToken middleware

    if (!receiptData || !receiptData.customerPhone) {
      return res.status(400).json({ success: false, error: 'Missing receipt data or customer phone' });
    }

    const shortId = generateShortId();
    const customerPhone = receiptData.customerPhone;
    const referralCode = req.body.referralCode || receiptData.referralCode; // The phone number of the referrer
    const billAmountRaw = receiptData.billAmount || receiptData.BillTotal || 0;
    const billAmount = parseFloat(billAmountRaw);
    
    // Check if customer is new
    const [existingCust] = await db.query('SELECT id FROM customers WHERE tenant_id = ? AND phone = ?', [tenantId, customerPhone]);
    const isNewCustomer = existingCust.length === 0;

    // Fetch Dynamic Loyalty Settings
    const [loyaltyRows] = await db.query('SELECT rupees_per_point, is_active FROM loyalty_settings WHERE tenant_id = ?', [tenantId]);
    const rpp = loyaltyRows.length > 0 ? loyaltyRows[0].rupees_per_point : 100;
    const isLoyaltyActive = loyaltyRows.length > 0 ? loyaltyRows[0].is_active : true;

    // Loyalty Engine
    let pointsEarned = isLoyaltyActive ? Math.floor(billAmount / rpp) : 0;

    // Referral Engine Logic
    if (isNewCustomer && referralCode && referralCode !== customerPhone) {
      const [refSettings] = await db.query('SELECT * FROM referral_settings WHERE tenant_id = ? AND is_active = 1', [tenantId]);
      if (refSettings.length > 0) {
         const rewardPoints = refSettings[0].referrer_reward_points || 500;
         
         // Insert referral record
         await db.query(
            'INSERT INTO referrals (tenant_id, referrer_phone, referee_phone, status) VALUES (?, ?, ?, ?)',
            [tenantId, referralCode, customerPhone, 'converted']
         );

         // Reward the referrer (add loyalty points)
         await db.query(
            'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE tenant_id = ? AND phone = ?',
            [rewardPoints, tenantId, referralCode]
         );
      }
    }

    // 1. Save metadata to MySQL linked to Tenant
    await db.query(
      'INSERT INTO invoices (tenant_id, short_id, customer_phone, receipt_json) VALUES (?, ?, ?, ?)',
      [tenantId, shortId, customerPhone, JSON.stringify(receiptData)]
    );

    // 2. Upsert Customer Profile (CRM)
    await db.query(
      `INSERT INTO customers (tenant_id, phone, total_spent, loyalty_points) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       total_spent = total_spent + VALUES(total_spent), 
       loyalty_points = loyalty_points + VALUES(loyalty_points), 
       last_visit = CURRENT_TIMESTAMP`,
      [tenantId, customerPhone, billAmount, pointsEarned]
    );

    // 3. Get updated loyalty balance
    const [custRows] = await db.query('SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?', [tenantId, customerPhone]);
    const totalPoints = custRows[0]?.loyalty_points || pointsEarned;

    const invoicePayload = {
      shortId,
      receiptData,
      loyalty: {
        earned: pointsEarned,
        balance: totalPoints
      },
      createdAt: new Date().toISOString()
    };

    // Cache the data in Redis for fast retrieval
    await redis.setex(`invoice:${shortId}`, 86400, JSON.stringify(invoicePayload));

    // 2. Fetch Tenant WABA Credentials
    const [tenants] = await db.query('SELECT waba_access_token, phone_number_id, waba_provider FROM tenants WHERE id = ?', [tenantId]);
    const baseUrl = process.env.APP_URL || 'https://bill.retailnode.in';
    const receiptUrl = `${baseUrl}/t/${shortId}`;

    // Send WhatsApp digital bill strictly via WABA (waba.mpocket.in)
    try {
      await sendWhatsAppMessage({
        tenantId,
        to: customerPhone,
        text: `Thank you for shopping at *${receiptData.StoreName || 'RetailNode'}*!\n\nYour digital bill for *₹${billAmount.toFixed(2)}* is ready.\n\nView and download your receipt here:\n${receiptUrl}`
      });
    } catch (waErr) {
      console.error('Failed to send WhatsApp via WABA:', waErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: { shortId, url: receiptUrl }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// High-Performance In-Memory Redis Caching for Tenant Profiles (1 Hour TTL)
async function getCachedTenantProfile(tenantId) {
  const cacheKey = `tenant:profile:${tenantId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {}

  const [tenantRows] = await db.query(
    `SELECT 
      id, store_name, store_address, store_phone, store_email, gstin, 
      logo_url, website_url, instagram_url, facebook_url, youtube_url, google_review_url, google_place_id, 
      fb_pixel_id, feedback_enabled, waba_provider, phone_number_id, waba_template_name 
     FROM tenants WHERE id = ?`,
    [tenantId]
  );
  const profile = tenantRows[0] || {};
  try {
    await redis.setex(cacheKey, 3600, JSON.stringify(profile));
  } catch (e) {}
  return profile;
}

// Enterprise WhatsApp Message Dispatcher strictly via WABA (waba.mpocket.in)
async function sendWhatsAppOtpMessage({ to, otp, invoiceNo, storeName, tenant }) {
  const normPhone = normalizePhone(to);
  const waPhone = normPhone.length === 10 ? `91${normPhone}` : normPhone;
  const messageText = `🔒 *RetailNode Security Code*\n\nYour OTP to verify invoice *#${invoiceNo}* at *${storeName}* is: *${otp}*\n\nThis code is valid for 10 minutes. Do not share it with anyone.`;

  const res = await sendWhatsAppMessage({
    tenantId: tenant?.id,
    to: waPhone,
    text: messageText
  });

  const sent = res.success;
  console.log(`[WhatsApp-OTP] OTP for ${waPhone} (Inv #${invoiceNo}): ${otp} (Dispatched via WABA: ${sent})`);
  return { sent, waPhone };
}

// Ultra-fast Public Invoice Retrieval (Targeting 50k-100k daily views via Redis + Indexes)
exports.getInvoice = async (req, res) => {
  try {
    const { slug } = req.params;
    const authHeader = req.headers['x-invoice-token'] || req.headers['authorization'];
    const sessionHeader = req.headers['x-customer-session'];
    const sessionAuthTime = req.headers['x-customer-authtime'];
    const authPhone = req.headers['x-customer-phone'] || req.query.phone;

    // 1. High-Performance Redis Cache Lookup
    const cacheKey = `invoice:pub:${slug}`;
    let cachedPayload = null;
    try {
      const cachedStr = await redis.get(cacheKey);
      if (cachedStr) {
        cachedPayload = JSON.parse(cachedStr);
      }
    } catch (cacheErr) {}

    let primaryInvoice = null;
    let customerPhone = '';
    let tenantId = null;
    let ageHours = 0;

    if (cachedPayload) {
      customerPhone = cachedPayload.customerPhone;
      tenantId = cachedPayload.tenantId;
      const createdAtMs = new Date(cachedPayload.createdAt).getTime();
      ageHours = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60));
    } else {
      // 2. Optimized Indexed MySQL Lookup
      const [invRows] = await db.query(
        'SELECT tenant_id, customer_phone, receipt_json, created_at, TIMESTAMPDIFF(HOUR, created_at, NOW()) as age_hours FROM invoices WHERE short_id = ?',
        [slug]
      );

      if (invRows.length === 0) {
        return res.status(404).json({ success: false, error: 'Invoice not found' });
      }

      primaryInvoice = invRows[0];
      tenantId = primaryInvoice.tenant_id;
      customerPhone = primaryInvoice.customer_phone;
      ageHours = Number(primaryInvoice.age_hours || 0);
    }

    const isOver72Hours = ageHours >= 72;
    const tenantProfile = await getCachedTenantProfile(tenantId);
    const platformPixelId = process.env.PLATFORM_FB_PIXEL_ID || '101582739485721';

    // 3. 72-Hour Security Gate & Customer Mobile Session Verification
    if (isOver72Hours) {
      let authorized = false;

      // Check Active 72-Hour Mobile Customer Session
      if (sessionHeader) {
        try {
          const sToken = sessionHeader.replace(/^Bearer\s+/i, '');
          const decoded = jwt.verify(sToken, process.env.JWT_SECRET || 'supersecret_production_key_123!');
          if (decoded && normalizePhone(decoded.phone) === normalizePhone(customerPhone)) {
            authorized = true;
          }
        } catch (sErr) {}
      }

      // Check Active Auth Time within 72 Hours on Client
      if (!authorized && authPhone && sessionAuthTime) {
        const timeDiff = Date.now() - Number(sessionAuthTime);
        if (timeDiff >= 0 && timeDiff < 72 * 60 * 60 * 1000) {
          if (normalizePhone(authPhone) === normalizePhone(customerPhone)) {
            authorized = true;
          }
        }
      }

      // Check Specific Invoice JWT Token
      if (!authorized && authHeader) {
        try {
          const token = authHeader.replace(/^Bearer\s+/i, '');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_production_key_123!');
          if (decoded && decoded.slug === slug && normalizePhone(decoded.phone) === normalizePhone(customerPhone)) {
            authorized = true;
          }
        } catch (tokenErr) {}
      }

      // Direct Phone Match
      if (!authorized && authPhone) {
        if (normalizePhone(authPhone) === normalizePhone(customerPhone)) {
          authorized = true;
        }
      }

      // If not authorized after 72 hours, withhold sensitive data and present OTP verification screen
      if (!authorized) {
        const rawDigits = String(customerPhone).replace(/\D/g, '');
        const last4 = rawDigits.slice(-4);
        const masked = last4 ? `••••••${last4}` : '••••••••••';

        return res.status(200).json({
          success: true,
          requiresAuth: true,
          isLocked: true,
          ageHours,
          storeName: tenantProfile.store_name || 'Store Receipt',
          logoUrl: tenantProfile.logo_url || null,
          maskedPhone: masked,
          message: 'This invoice is older than 72 hours. For recipient privacy, please verify using WhatsApp OTP.'
        });
      }
    }

    // Check Redis for customer engagement actions (Google review, Instagram, YouTube)
    let hasGoogleReview = false;
    let hasInstagram = false;
    let hasYoutube = false;
    try {
      const [gCached, iCached, yCached] = await Promise.all([
        redis.get(`action:${slug}:google_review_click`),
        redis.get(`action:${slug}:instagram_click`),
        redis.get(`action:${slug}:youtube_click`)
      ]);
      if (gCached) hasGoogleReview = true;
      if (iCached) hasInstagram = true;
      if (yCached) hasYoutube = true;
    } catch (e) {}

    const userActions = {
      googleReviewClicked: hasGoogleReview,
      instagramClicked: hasInstagram,
      youtubeClicked: hasYoutube
    };

    // 4. Return Full Invoice Data (from Cache if available, or build and cache)
    if (cachedPayload) {
      return res.status(200).json({
        success: true,
        data: {
          ...cachedPayload.data,
          tenantProfile,
          platformPixelId,
          userActions
        }
      });
    }

    // Parse receipt json
    let receiptData = {};
    try {
      receiptData = typeof primaryInvoice.receipt_json === 'string' 
        ? JSON.parse(primaryInvoice.receipt_json) 
        : primaryInvoice.receipt_json;
    } catch (e) {}

    // Fetch customer loyalty balance
    const [custRows] = await db.query(
      'SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?',
      [tenantId, customerPhone]
    );
    const totalPoints = custRows[0]?.loyalty_points || 0;

    // Fast indexed query for purchase history (last 5 bills)
    const [historyRows] = await db.query(
      'SELECT short_id, created_at FROM invoices WHERE tenant_id = ? AND customer_phone = ? AND short_id != ? ORDER BY created_at DESC LIMIT 5',
      [tenantId, customerPhone, slug]
    );

    const history = historyRows.map(row => ({
      shortId: row.short_id,
      date: row.created_at
    }));

    const responseData = {
      shortId: slug,
      receiptData,
      loyalty: { balance: totalPoints },
      createdAt: primaryInvoice.created_at,
      ageHours,
      history,
      tenantProfile,
      platformPixelId,
      userActions
    };

    // Cache the invoice payload in Redis for 24 hours (86,400s) to handle 100k daily loads
    try {
      await redis.setex(cacheKey, 86400, JSON.stringify({
        customerPhone,
        tenantId,
        createdAt: primaryInvoice.created_at,
        data: responseData
      }));
    } catch (e) {}

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Retrieval Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Dispatch WhatsApp OTP to Customer Mobile
exports.sendWhatsAppOtp = async (req, res) => {
  try {
    const { slug } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Customer mobile number is required' });
    }

    const [invRows] = await db.query(
      'SELECT tenant_id, customer_phone, receipt_json, created_at FROM invoices WHERE short_id = ?',
      [slug]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const primaryInvoice = invRows[0];
    const customerPhone = primaryInvoice.customer_phone;
    const normPhone = normalizePhone(customerPhone);

    if (normalizePhone(phone) !== normPhone) {
      return res.status(401).json({
        success: false,
        error: 'Access denied: The entered mobile number is not registered for this bill.'
      });
    }

    // Rate Limiting: 45 seconds between OTP requests per invoice
    const rateLimitKey = `otp_rate:${slug}:${normPhone}`;
    const isRateLimited = await redis.get(rateLimitKey);
    if (isRateLimited) {
      return res.status(429).json({
        success: false,
        error: 'Please wait 45 seconds before requesting another WhatsApp OTP.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Cache in Redis: 10 minutes TTL
    const otpKey = `otp:${slug}:${normPhone}`;
    await redis.setex(otpKey, 600, otp);
    await redis.setex(rateLimitKey, 45, '1');

    // Fetch tenant profile from Redis
    const tenant = await getCachedTenantProfile(primaryInvoice.tenant_id);

    let receiptData = {};
    try {
      receiptData = typeof primaryInvoice.receipt_json === 'string'
        ? JSON.parse(primaryInvoice.receipt_json)
        : primaryInvoice.receipt_json;
    } catch (e) {}

    const invoiceNo = receiptData.InvoiceNumber || receiptData.invoiceNumber || slug;
    const storeName = tenant.store_name || receiptData.StoreName || 'RetailNode';

    // Dispatch WhatsApp OTP
    const { sent, waPhone } = await sendWhatsAppOtpMessage({
      to: customerPhone,
      otp,
      invoiceNo,
      storeName,
      tenant
    });

    const rawDigits = customerPhone.replace(/\D/g, '');
    const last4 = rawDigits.slice(-4);

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to your WhatsApp number (+91 •••••• ${last4}).`,
      sent,
      devOtp: !tenant.waba_access_token ? otp : undefined
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Verify WhatsApp OTP & Issue 72-Hour Authenticated Session
exports.verifyWhatsAppOtp = async (req, res) => {
  try {
    const { slug } = req.params;
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: 'Mobile number and OTP code are required' });
    }

    const [invRows] = await db.query(
      'SELECT tenant_id, customer_phone, receipt_json, created_at, TIMESTAMPDIFF(HOUR, created_at, NOW()) as age_hours FROM invoices WHERE short_id = ?',
      [slug]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const primaryInvoice = invRows[0];
    const customerPhone = primaryInvoice.customer_phone;
    const normPhone = normalizePhone(customerPhone);

    if (normalizePhone(phone) !== normPhone) {
      return res.status(401).json({
        success: false,
        error: 'Access denied: The entered mobile number does not match this invoice recipient.'
      });
    }

    // Verify OTP from Redis
    const otpKey = `otp:${slug}:${normPhone}`;
    const storedOtp = await redis.get(otpKey);

    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        error: 'OTP expired or not found. Please click "Resend OTP".'
      });
    }

    if (String(storedOtp).trim() !== String(otp).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP code. Please check your WhatsApp message and try again.'
      });
    }

    // Consume OTP from Redis
    await redis.del(otpKey);

    // Issue 72-HOUR CUSTOMER SESSION (Seamless cross-bill access without login prompts)
    const authTime = Date.now();
    const customerSessionToken = jwt.sign(
      { phone: customerPhone, authTime },
      process.env.JWT_SECRET || 'supersecret_production_key_123!',
      { expiresIn: '72h' }
    );

    const invoiceUnlockToken = jwt.sign(
      { slug, phone: customerPhone, authTime },
      process.env.JWT_SECRET || 'supersecret_production_key_123!',
      { expiresIn: '72h' }
    );

    const tenant = await getCachedTenantProfile(primaryInvoice.tenant_id);

    let receiptData = {};
    try {
      receiptData = typeof primaryInvoice.receipt_json === 'string' 
        ? JSON.parse(primaryInvoice.receipt_json) 
        : primaryInvoice.receipt_json;
    } catch (e) {}

    const [custRows] = await db.query(
      'SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?',
      [primaryInvoice.tenant_id, customerPhone]
    );
    const totalPoints = custRows[0]?.loyalty_points || 0;

    const [historyRows] = await db.query(
      'SELECT short_id, created_at FROM invoices WHERE tenant_id = ? AND customer_phone = ? AND short_id != ? ORDER BY created_at DESC LIMIT 5',
      [primaryInvoice.tenant_id, customerPhone, slug]
    );

    const history = historyRows.map(row => ({
      shortId: row.short_id,
      date: row.created_at
    }));

    const platformPixelId = process.env.PLATFORM_FB_PIXEL_ID || '101582739485721';

    return res.status(200).json({
      success: true,
      message: 'Mobile verified! 72-hour session active.',
      token: invoiceUnlockToken,
      customerSessionToken,
      customerPhone,
      authTime,
      expiresIn: 259200, // 72 hours
      data: {
        shortId: slug,
        receiptData,
        loyalty: { balance: totalPoints },
        createdAt: primaryInvoice.created_at,
        ageHours: Number(primaryInvoice.age_hours || 0),
        history,
        tenantProfile: tenant,
        platformPixelId
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Direct phone verification fallback
exports.unlockInvoice = async (req, res) => {
  try {
    const { slug } = req.params;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    const [invRows] = await db.query(
      'SELECT tenant_id, customer_phone, receipt_json, created_at, TIMESTAMPDIFF(HOUR, created_at, NOW()) as age_hours FROM invoices WHERE short_id = ?',
      [slug]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const primaryInvoice = invRows[0];
    const customerPhone = primaryInvoice.customer_phone;

    if (normalizePhone(phone) !== normalizePhone(customerPhone)) {
      return res.status(401).json({
        success: false,
        error: 'Access denied: The entered mobile number does not match the invoice recipient.'
      });
    }

    const authTime = Date.now();
    const customerSessionToken = jwt.sign(
      { phone: customerPhone, authTime },
      process.env.JWT_SECRET || 'supersecret_production_key_123!',
      { expiresIn: '72h' }
    );

    const unlockToken = jwt.sign(
      { slug, phone: customerPhone, authTime },
      process.env.JWT_SECRET || 'supersecret_production_key_123!',
      { expiresIn: '72h' }
    );

    const tenant = await getCachedTenantProfile(primaryInvoice.tenant_id);

    let receiptData = {};
    try {
      receiptData = typeof primaryInvoice.receipt_json === 'string' 
        ? JSON.parse(primaryInvoice.receipt_json) 
        : primaryInvoice.receipt_json;
    } catch (e) {}

    const [custRows] = await db.query(
      'SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?',
      [primaryInvoice.tenant_id, customerPhone]
    );
    const totalPoints = custRows[0]?.loyalty_points || 0;

    const [historyRows] = await db.query(
      'SELECT short_id, created_at FROM invoices WHERE tenant_id = ? AND customer_phone = ? AND short_id != ? ORDER BY created_at DESC LIMIT 5',
      [primaryInvoice.tenant_id, customerPhone, slug]
    );

    const history = historyRows.map(row => ({
      shortId: row.short_id,
      date: row.created_at
    }));

    const platformPixelId = process.env.PLATFORM_FB_PIXEL_ID || '101582739485721';

    return res.status(200).json({
      success: true,
      message: 'Mobile verified! 72-hour session active.',
      token: unlockToken,
      customerSessionToken,
      customerPhone,
      authTime,
      expiresIn: 259200,
      data: {
        shortId: slug,
        receiptData,
        loyalty: { balance: totalPoints },
        createdAt: primaryInvoice.created_at,
        ageHours: Number(primaryInvoice.age_hours || 0),
        history,
        tenantProfile: tenant,
        platformPixelId
      }
    });
  } catch (error) {
    console.error('Unlock Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Track public customer engagement actions (Google review clicks, social clicks, etc.)
exports.trackAction = async (req, res) => {
  try {
    const { slug } = req.params;
    const { action, source, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action type is required' });
    }

    const [invRows] = await db.query(
      'SELECT tenant_id, customer_phone FROM invoices WHERE short_id = ?',
      [slug]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { tenant_id, customer_phone } = invRows[0];

    const metaObj = {
      source: source || 'direct',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
      ...(metadata || {})
    };

    // 1. Audit trail in action_logs table
    await db.query(
      `INSERT INTO action_logs (tenant_id, short_id, customer_phone, action_type, metadata)
       VALUES (?, ?, ?, ?, ?)`,
      [tenant_id, slug, customer_phone, action, JSON.stringify(metaObj)]
    );

    // 2. High-speed Redis increment & cached status flag (90 days)
    try {
      await redis.incr(`tenant:stats:${tenant_id}:${action}`);
      await redis.incr(`platform:stats:${action}`);
      await redis.setex(`action:${slug}:${action}`, 7776000, '1');
    } catch (e) {}

    return res.status(200).json({
      success: true,
      message: `Action ${action} tracked successfully`,
      action,
      shortId: slug
    });
  } catch (error) {
    console.error('Track Action Error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.getActionStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    let hasGoogleReview = false;
    let hasInstagram = false;
    let hasYoutube = false;

    try {
      const [gCached, iCached, yCached] = await Promise.all([
        redis.get(`action:${slug}:google_review_click`),
        redis.get(`action:${slug}:instagram_click`),
        redis.get(`action:${slug}:youtube_click`)
      ]);
      if (gCached) hasGoogleReview = true;
      if (iCached) hasInstagram = true;
      if (yCached) hasYoutube = true;
    } catch (e) {}

    if (!hasGoogleReview || !hasInstagram || !hasYoutube) {
      const [rows] = await db.query(
        'SELECT action_type FROM action_logs WHERE short_id = ? GROUP BY action_type',
        [slug]
      );
      const actions = rows.map(r => r.action_type);
      if (actions.includes('google_review_click')) hasGoogleReview = true;
      if (actions.includes('instagram_click')) hasInstagram = true;
      if (actions.includes('youtube_click')) hasYoutube = true;
    }

    return res.status(200).json({
      success: true,
      googleReviewClicked: hasGoogleReview,
      instagramClicked: hasInstagram,
      youtubeClicked: hasYoutube
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

// Fetch store invoices for merchant dashboard
exports.getStoreInvoices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Merchant tenant ID missing' });
    }

    const [rows] = await db.query(
      `SELECT 
        i.id, 
        i.short_id, 
        i.customer_phone, 
        i.receipt_json, 
        i.created_at,
        (SELECT status FROM billing_messages WHERE invoice_id = i.id ORDER BY id DESC LIMIT 1) as whatsapp_status,
        (SELECT COUNT(*) FROM action_logs WHERE short_id = i.short_id AND action_type = 'google_review_click') as review_clicks
       FROM invoices i 
       WHERE i.tenant_id = ? 
       ORDER BY i.created_at DESC 
       LIMIT 100`,
      [tenantId]
    );

    const invoices = rows.map(r => {
      let receipt = {};
      try {
        receipt = typeof r.receipt_json === 'string' ? JSON.parse(r.receipt_json) : (r.receipt_json || {});
      } catch (e) {}

      return {
        id: r.id,
        shortId: r.short_id,
        customerPhone: r.customer_phone,
        invoiceNumber: receipt.InvoiceNumber || receipt.invoiceNumber || r.short_id,
        billTotal: receipt.BillTotal || receipt.billAmount || receipt.totalAmount || '0.00',
        customerName: receipt.CustomerName || receipt.customerName || '',
        createdAt: r.created_at,
        whatsappStatus: r.whatsapp_status || 'sent',
        hasReviewed: r.review_clicks > 0
      };
    });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching store invoices:', error);
    res.status(500).json({ success: false, error: 'Server error fetching invoices' });
  }
};

exports.createQuickBill = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Merchant tenant ID missing' });
    }

    const { customerPhone, customerName, billAmount, invoiceNumber, items, sendWhatsApp } = req.body;

    const actualPhone = customerPhone || req.body.customer_phone || req.body.phone;
    const actualAmount = parseFloat(billAmount || req.body.bill_amount || req.body.receipt_data?.GrandTotal || req.body.amount || 0);
    const actualName = customerName || req.body.customer_name || req.body.name || req.body.receipt_data?.CustomerName || 'Valued Customer';
    const actualInvNo = invoiceNumber || req.body.invoice_number || req.body.receipt_data?.InvoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
    const actualSendWa = sendWhatsApp !== false && req.body.send_whatsapp !== false;

    if (!actualPhone || !actualAmount) {
      return res.status(400).json({ success: false, error: 'Customer phone and bill amount are required' });
    }

    const normalizedPhone = normalizePhone(actualPhone);
    const shortId = generateShortId();
    const amount = actualAmount;

    // Fetch store profile
    const [storeRows] = await db.query('SELECT store_name, store_address, store_phone FROM tenants WHERE id = ?', [tenantId]);
    const storeName = storeRows[0]?.store_name || 'RetailNode Store';

    // Build structured receipt JSON
    const receiptData = {
      StoreName: storeName,
      Address: storeRows[0]?.store_address || '',
      Phone: storeRows[0]?.store_phone || '',
      InvoiceNumber: actualInvNo,
      Date: new Date().toISOString(),
      CustomerName: actualName,
      customerPhone: normalizedPhone,
      BillTotal: amount.toFixed(2),
      Items: Array.isArray(items) && items.length > 0 ? items : (
        req.body.receipt_data?.Items || [
          { Name: 'Retail Store Purchase', Qty: 1, Rate: amount, Amount: amount }
        ]
      )
    };

    // Dynamic loyalty rules
    const [loyaltyRows] = await db.query('SELECT rupees_per_point, is_active FROM loyalty_settings WHERE tenant_id = ?', [tenantId]);
    const rpp = loyaltyRows.length > 0 ? loyaltyRows[0].rupees_per_point : 100;
    const isLoyaltyActive = loyaltyRows.length > 0 ? loyaltyRows[0].is_active : true;
    const pointsEarned = isLoyaltyActive ? Math.floor(amount / rpp) : 0;

    // 1. Save metadata to MySQL
    const [insertResult] = await db.query(
      'INSERT INTO invoices (tenant_id, short_id, customer_phone, receipt_json) VALUES (?, ?, ?, ?)',
      [tenantId, shortId, normalizedPhone, JSON.stringify(receiptData)]
    );
    const newInvoiceId = insertResult.insertId;

    // 2. Upsert Customer Profile
    await db.query(
      `INSERT INTO customers (tenant_id, phone, total_spent, loyalty_points) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       total_spent = total_spent + VALUES(total_spent), 
       loyalty_points = loyalty_points + VALUES(loyalty_points), 
       last_visit = CURRENT_TIMESTAMP`,
      [tenantId, normalizedPhone, amount, pointsEarned]
    );

    // 3. Get updated balance
    const [custRows] = await db.query('SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?', [tenantId, normalizedPhone]);
    const totalPoints = custRows[0]?.loyalty_points || pointsEarned;

    // 4. Redis cache for < 20ms receipt rendering
    const invoicePayload = {
      shortId,
      receiptData,
      loyalty: {
        earned: pointsEarned,
        balance: totalPoints
      },
      createdAt: new Date().toISOString()
    };
    await redis.setex(`invoice:${shortId}`, 86400, JSON.stringify(invoicePayload));

    // 5. WhatsApp dispatch if enabled
    const baseUrl = process.env.APP_URL || 'https://bill.retailnode.in';
    const receiptUrl = `${baseUrl}/t/${shortId}`;

    if (sendWhatsApp !== false) {
      try {
        await sendWhatsAppMessage({
          tenantId,
          to: normalizedPhone,
          text: `Thank you for shopping at *${storeName}*!\n\nYour digital bill for *₹${amount.toFixed(2)}* is ready.\n\nView and download your receipt here:\n${receiptUrl}`
        });
      } catch (e) {
        console.error('Quick bill WhatsApp error:', e.message);
      }
    }

    res.status(201).json({
      success: true,
      short_url: receiptUrl,
      url: receiptUrl,
      message: 'Quick digital bill generated and WhatsApp dispatched successfully',
      data: {
        id: newInvoiceId,
        shortId,
        short_id: shortId,
        receiptUrl,
        short_url: receiptUrl,
        url: receiptUrl,
        invoiceNumber: receiptData.InvoiceNumber,
        customerPhone: normalizedPhone,
        customerName: receiptData.CustomerName,
        billTotal: amount,
        loyaltyEarned: pointsEarned,
        loyaltyBalance: totalPoints
      }
    });
  } catch (error) {
    console.error('Error generating quick bill:', error);
    res.status(500).json({ success: false, error: 'Failed to generate quick bill' });
  }
};

/**
 * Public customer lookup by phone number
 * GET /api/v1/invoices/public/lookup?phone=9876543210
 */
exports.lookupCustomerBills = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    if (cleanDigits.length < 10) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
    }

    // Find invoices matching this mobile suffix
    const [rows] = await db.query(
      `SELECT i.id, i.short_id, i.customer_phone, i.receipt_json, i.created_at, t.store_name, t.logo_url
       FROM invoices i
       LEFT JOIN tenants t ON i.tenant_id = t.id
       WHERE i.customer_phone LIKE ?
       ORDER BY i.created_at DESC
       LIMIT 50`,
      [`%${cleanDigits}`]
    );

    const bills = rows.map(r => {
      let rJson = {};
      try {
        rJson = typeof r.receipt_json === 'string' ? JSON.parse(r.receipt_json) : (r.receipt_json || {});
      } catch (e) {}

      const amt = parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0);
      const invNum = rJson.InvoiceNumber || rJson.invoice_number || rJson.InvoiceNo || r.short_id;
      const custName = rJson.CustomerName || rJson.customerName || '';

      return {
        id: r.id,
        shortId: r.short_id,
        storeName: r.store_name || 'Retail Store',
        logoUrl: r.logo_url || null,
        invoiceNumber: invNum,
        customerName: custName,
        billTotal: amt,
        itemsCount: (rJson.items || []).length || 1,
        createdAt: r.created_at,
        receiptUrl: `https://bill.retailnode.in/t/${r.short_id}`
      };
    });

    res.status(200).json({
      success: true,
      phone: cleanDigits,
      totalBills: bills.length,
      bills
    });
  } catch (error) {
    console.error('Customer Bills Lookup Error:', error);
    res.status(500).json({ success: false, error: 'Failed to lookup bills' });
  }
};



