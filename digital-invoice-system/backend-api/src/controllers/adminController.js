const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const redis = require('../config/redis');
const { sendEmail, generateWelcomeVerificationEmailHtml } = require('../services/emailClient');

// 1. Platform-Wide Analytics (Redis In-Memory Caching)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const cacheKey = 'admin:platform:analytics';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (e) {}

    const [tenantStats] = await db.query(`
      SELECT 
        COUNT(*) as total_stores,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_stores,
        SUM(message_quota) as total_quota_granted,
        SUM(messages_used) as total_messages_dispatched
      FROM tenants
    `);

    const [invoiceStats] = await db.query(`
      SELECT COUNT(*) as total_invoices FROM invoices
    `);

    const [customerStats] = await db.query(`
      SELECT COUNT(*) as total_shoppers FROM customers
    `);

    const [actionStats] = await db.query(`
      SELECT 
        COUNT(*) as total_actions,
        SUM(CASE WHEN action_type = 'google_review_click' THEN 1 ELSE 0 END) as google_reviews,
        SUM(CASE WHEN action_type = 'instagram_click' THEN 1 ELSE 0 END) as instagram_clicks,
        SUM(CASE WHEN action_type = 'youtube_click' THEN 1 ELSE 0 END) as youtube_clicks
      FROM action_logs
    `);

    // Real-time Redis stats if available
    let redisReviewClicks = 0;
    try {
      const cached = await redis.get('platform:stats:google_review_click');
      if (cached) redisReviewClicks = parseInt(cached, 10);
    } catch (e) {}

    const payload = {
      success: true,
      data: {
        stores: {
          total: tenantStats[0].total_stores || 0,
          active: tenantStats[0].active_stores || 0,
          suspended: (tenantStats[0].total_stores || 0) - (tenantStats[0].active_stores || 0)
        },
        invoices: {
          total: invoiceStats[0].total_invoices || 0
        },
        shoppers: {
          total: customerStats[0].total_shoppers || 0
        },
        messaging: {
          quotaGranted: tenantStats[0].total_quota_granted || 0,
          messagesSent: tenantStats[0].total_messages_dispatched || 0
        },
        engagement: {
          totalActions: actionStats[0].total_actions || 0,
          googleReviews: Math.max(actionStats[0].google_reviews || 0, redisReviewClicks),
          instagramClicks: actionStats[0].instagram_clicks || 0,
          youtubeClicks: actionStats[0].youtube_clicks || 0
        }
      }
    };

    try {
      await redis.setex(cacheKey, 15, JSON.stringify(payload));
    } catch (e) {}

    res.status(200).json(payload);
  } catch (error) {
    console.error('Error fetching SaaS platform analytics:', error);
    res.status(500).json({ success: false, error: 'Server error fetching platform analytics' });
  }
};

// 2. Tenants Directory (Redis In-Memory Caching)
exports.getAllTenants = async (req, res) => {
  try {
    const cacheKey = 'admin:tenants:list';
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (e) {}

    const [rows] = await db.query(`
      SELECT 
        t.id, 
        t.store_name, 
        t.store_phone, 
        t.store_email, 
        t.store_address, 
        t.gstin, 
        t.api_token, 
        t.plan_tier, 
        t.plan_valid_until,
        DATEDIFF(t.plan_valid_until, CURRENT_DATE) as days_remaining,
        CASE 
          WHEN t.plan_valid_until IS NULL THEN 'lifetime'
          WHEN t.plan_valid_until < CURRENT_DATE THEN 'expired'
          WHEN DATEDIFF(t.plan_valid_until, CURRENT_DATE) <= 15 THEN 'expiring_soon'
          ELSE 'active'
        END as plan_status,
        t.message_quota, 
        t.messages_used, 
        t.is_active, 
        t.waba_provider, 
        t.phone_number_id,
        t.google_place_id,
        t.google_review_url,
        t.instagram_url,
        t.youtube_url,
        t.created_at,
        (SELECT COUNT(*) FROM invoices WHERE tenant_id = t.id) as total_invoices,
        (SELECT COUNT(*) FROM customers WHERE tenant_id = t.id) as total_customers
      FROM tenants t
      ORDER BY t.id DESC
    `);

    const payload = { success: true, data: rows };
    try {
      await redis.setex(cacheKey, 30, JSON.stringify(payload));
    } catch (e) {}

    res.status(200).json(payload);
  } catch (error) {
    console.error('Error fetching tenants list:', error);
    res.status(500).json({ success: false, error: 'Server error fetching tenants directory' });
  }
};

// 3. Provision / Onboard New Tenant Store
exports.createTenant = async (req, res) => {
  try {
    const { 
      store_name, 
      store_phone, 
      store_email, 
      store_address, 
      gstin, 
      plan_tier, 
      plan_valid_until,
      message_quota,
      admin_email,
      admin_password
    } = req.body;

    if (!store_name) {
      return res.status(400).json({ success: false, error: 'Store name is required' });
    }

    const apiToken = 'sk_live_' + crypto.randomBytes(24).toString('hex');
    const defaultDays = plan_tier === 'trial' ? 3 : 365;
    const defaultExpiry = plan_valid_until || new Date(Date.now() + defaultDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [tenantResult] = await db.query(
      `INSERT INTO tenants (
        store_name, store_phone, store_email, store_address, gstin, 
        api_token, plan_tier, plan_valid_until, message_quota, messages_used, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
      [
        store_name,
        store_phone || null,
        store_email || null,
        store_address || null,
        gstin || null,
        apiToken,
        plan_tier || 'growth',
        defaultExpiry,
        message_quota ? parseInt(message_quota, 10) : 1000
      ]
    );

    const tenantId = tenantResult.insertId;

    // Optional: create initial merchant login account
    if (admin_email && admin_password) {
      const passwordHash = await bcrypt.hash(admin_password, 10);
      await db.query(
        'INSERT INTO users (tenant_id, email, password_hash, role) VALUES (?, ?, ?, "merchant_admin")',
        [tenantId, admin_email, passwordHash]
      );

      // Dispatch Welcome Email to store admin
      if (admin_email.includes('@')) {
        const welcomeHtml = generateWelcomeVerificationEmailHtml({
          storeName: store_name,
          ownerName: 'Store Administrator',
          userEmail: admin_email.trim().toLowerCase(),
          loginUrl: 'https://bill.retailnode.in/login',
          apiToken,
          planName: `${(plan_tier || 'trial').toUpperCase()} Plan`,
          role: 'Store Admin',
          temporaryPassword: admin_password
        });

        sendEmail({
          tenantId,
          to: admin_email.trim().toLowerCase(),
          subject: `Welcome to RetailNode - ${store_name}`,
          html: welcomeHtml,
          emailType: 'welcome'
        }).catch(err => console.warn('[Admin] Failed to send tenant welcome email:', err.message));
      }
    }

    // Default loyalty settings for this new store
    await db.query(
      'INSERT INTO loyalty_settings (tenant_id, rupees_per_point, min_points_redeem, discount_value, is_active) VALUES (?, 100, 500, 50.00, 1)',
      [tenantId]
    );

    // Audit log
    await db.query(
      `INSERT INTO action_logs (tenant_id, short_id, action_type, metadata)
       VALUES (?, 'SYSTEM', 'TENANT_ONBOARDED', ?)`,
      [tenantId, JSON.stringify({ store_name, apiToken, plan_tier: plan_tier || 'growth', plan_valid_until: defaultExpiry })]
    );

    try {
      await redis.del('admin:tenants:list');
      await redis.del('admin:platform:analytics');
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Retail store provisioned successfully',
      data: {
        tenantId,
        store_name,
        api_token: apiToken,
        plan_tier: plan_tier || 'growth',
        plan_valid_until: defaultExpiry,
        message_quota: message_quota || 1000
      }
    });
  } catch (error) {
    console.error('Error provisioning tenant store:', error);
    res.status(500).json({ success: false, error: 'Failed to provision tenant store' });
  }
};

// 4. Update Tenant / Status / Quota / Plan Validity
exports.updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      store_name, 
      store_phone, 
      store_email, 
      store_address, 
      gstin, 
      plan_tier, 
      plan_valid_until,
      extend_days,
      message_quota, 
      is_active,
      google_place_id,
      google_review_url,
      instagram_url,
      youtube_url
    } = req.body;

    const [existing] = await db.query('SELECT id, store_name, plan_valid_until FROM tenants WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant store not found' });
    }

    let targetExpiry = plan_valid_until !== undefined ? (plan_valid_until || null) : existing[0].plan_valid_until;
    if (extend_days && parseInt(extend_days, 10) > 0) {
      const days = parseInt(extend_days, 10);
      const [extendRes] = await db.query(
        'SELECT DATE_ADD(COALESCE(GREATEST(?, CURRENT_DATE), CURRENT_DATE), INTERVAL ? DAY) as new_expiry',
        [existing[0].plan_valid_until, days]
      );
      if (extendRes[0]?.new_expiry) {
        targetExpiry = extendRes[0].new_expiry;
      }
    }

    const updates = [];
    const values = [];

    if (store_name !== undefined) { updates.push('store_name = ?'); values.push(store_name); }
    if (store_phone !== undefined) { updates.push('store_phone = ?'); values.push(store_phone); }
    if (store_email !== undefined) { updates.push('store_email = ?'); values.push(store_email); }
    if (store_address !== undefined) { updates.push('store_address = ?'); values.push(store_address); }
    if (gstin !== undefined) { updates.push('gstin = ?'); values.push(gstin); }
    if (plan_tier !== undefined) { updates.push('plan_tier = ?'); values.push(plan_tier); }
    if (plan_valid_until !== undefined || extend_days !== undefined) { 
      updates.push('plan_valid_until = ?'); 
      values.push(targetExpiry ? targetExpiry : null); 
    }
    if (message_quota !== undefined) { updates.push('message_quota = ?'); values.push(message_quota); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (google_place_id !== undefined) { updates.push('google_place_id = ?'); values.push(google_place_id); }
    if (google_review_url !== undefined) { updates.push('google_review_url = ?'); values.push(google_review_url); }
    if (instagram_url !== undefined) { updates.push('instagram_url = ?'); values.push(instagram_url); }
    if (youtube_url !== undefined) { updates.push('youtube_url = ?'); values.push(youtube_url); }

    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // Invalidate Redis profile cache
    try {
      await redis.del(`tenant:profile:${id}`);
      await redis.del('admin:tenants:list');
      await redis.del('admin:platform:analytics');
    } catch (e) {}

    res.status(200).json({ 
      success: true, 
      message: 'Tenant updated successfully',
      data: { id, plan_valid_until: targetExpiry }
    });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ success: false, error: 'Failed to update tenant' });
  }
};

// 5. Message Quota Top-Up
exports.topupQuota = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const creditsToAdd = parseInt(amount, 10);
    if (!creditsToAdd || creditsToAdd <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive credit amount required' });
    }

    await db.query(
      'UPDATE tenants SET message_quota = message_quota + ? WHERE id = ?',
      [creditsToAdd, id]
    );

    // Invalidate profile cache
    try {
      await redis.del(`tenant:profile:${id}`);
      await redis.del('admin:tenants:list');
      await redis.del('admin:platform:analytics');
    } catch (e) {}

    // Audit log
    await db.query(
      `INSERT INTO action_logs (tenant_id, short_id, action_type, metadata)
       VALUES (?, 'SYSTEM', 'QUOTA_TOPUP', ?)`,
      [id, JSON.stringify({ creditsAdded: creditsToAdd, timestamp: new Date().toISOString() })]
    );

    const [updated] = await db.query('SELECT message_quota, messages_used FROM tenants WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: `Successfully added ${creditsToAdd} messaging credits!`,
      data: updated[0]
    });
  } catch (error) {
    console.error('Error topping up quota:', error);
    res.status(500).json({ success: false, error: 'Failed to top up messaging quota' });
  }
};

// 6. Centralized Platform Action Logs
exports.getActionLogs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        al.id, 
        al.tenant_id, 
        t.store_name, 
        al.short_id, 
        al.customer_phone, 
        al.action_type, 
        al.metadata, 
        al.created_at
      FROM action_logs al
      LEFT JOIN tenants t ON al.tenant_id = t.id
      ORDER BY al.id DESC
      LIMIT 100
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching action logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platform action logs' });
  }
};

// 7. Global Gateway Settings
exports.getGlobalGateways = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT config_key, config_value, is_secret FROM global_configs');
    const configs = {};
    rows.forEach(r => {
      configs[r.config_key] = r.is_secret ? '••••••••' : r.config_value;
    });

    res.status(200).json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching global gateways:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch global gateway settings' });
  }
};

exports.updateGlobalGateways = async (req, res) => {
  try {
    const { configs } = req.body;
    if (!configs || typeof configs !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid configuration payload' });
    }

    for (const [key, value] of Object.entries(configs)) {
      if (value !== '••••••••' && value !== undefined) {
        await db.query(`
          INSERT INTO global_configs (config_key, config_value) 
          VALUES (?, ?)
          ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        `, [key, String(value)]);
      }
    }

    res.status(200).json({ success: true, message: 'Global gateway configurations saved' });
  } catch (error) {
    console.error('Error updating global gateways:', error);
    res.status(500).json({ success: false, error: 'Failed to update global gateways' });
  }
};

// 8. Public Active Pricing Campaign Endpoint
exports.getActivePricingCampaign = async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT 
        id, 
        campaign_name, 
        plan_tier, 
        category,
        regular_price, 
        campaign_price, 
        trial_days, 
        badge_text, 
        headline, 
        subheadline, 
        is_active, 
        start_date, 
        end_date, 
        updated_at
      FROM pricing_campaigns 
      WHERE is_active = 1
    `;
    const params = [];
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY id DESC LIMIT 1';

    const [rows] = await db.query(query, params);
    const [allActive] = await db.query('SELECT * FROM pricing_campaigns WHERE is_active = 1 ORDER BY id DESC');

    if (rows.length > 0) {
      return res.status(200).json({ success: true, data: rows[0], all_active: allActive });
    }

    // Default fallback
    res.status(200).json({
      success: true,
      data: {
        id: 0,
        campaign_name: 'Retail Launch Offer',
        plan_tier: 'growth',
        regular_price: 9000.00,
        campaign_price: 6000.00,
        trial_days: 3,
        badge_text: 'SAVE ₹3,000 TODAY (33% OFF)',
        headline: 'One Simple Price. All Features Included.',
        subheadline: 'Complete Digital Billing & Smart CRM Utility for Retail Stores',
        is_active: 1
      }
    });
  } catch (error) {
    console.error('Error fetching active pricing campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pricing' });
  }
};

// 9. Admin List All Pricing Campaigns
exports.getPricingCampaigns = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pricing_campaigns ORDER BY is_active DESC, id DESC');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching pricing campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
};

// 10. Admin Create New Pricing Campaign
exports.createPricingCampaign = async (req, res) => {
  try {
    const {
      campaign_name,
      plan_tier,
      category,
      regular_price,
      campaign_price,
      trial_days,
      badge_text,
      headline,
      subheadline,
      is_active,
      start_date,
      end_date
    } = req.body;

    if (!campaign_name || campaign_price === undefined) {
      return res.status(400).json({ success: false, error: 'Campaign name and price are required' });
    }

    const activeFlag = is_active ? 1 : 0;
    if (activeFlag === 1) {
      // Deactivate other campaigns in the same product category so each category maintains its active offer
      const targetCategory = category || 'billing';
      await db.query('UPDATE pricing_campaigns SET is_active = 0 WHERE category = ?', [targetCategory]);
    }

    const regPrice = regular_price ? parseFloat(regular_price) : 9000.00;
    const campPrice = parseFloat(campaign_price);
    const savings = Math.max(0, regPrice - campPrice);
    const percent = Math.round((savings / regPrice) * 100);
    const defaultBadge = badge_text || `SAVE ₹${savings.toLocaleString('en-IN')} TODAY (${percent}% OFF)`;

    const [result] = await db.query(
      `INSERT INTO pricing_campaigns (
        campaign_name, plan_tier, category, regular_price, campaign_price, trial_days,
        badge_text, headline, subheadline, is_active, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaign_name,
        plan_tier || 'growth',
        category || 'billing',
        regPrice,
        campPrice,
        trial_days ? parseInt(trial_days, 10) : 3,
        defaultBadge,
        headline || 'One Simple Price. All Features Included.',
        subheadline || 'Complete Digital Billing & Smart CRM Utility for Retail Stores',
        activeFlag,
        start_date || null,
        end_date || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Pricing campaign created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating pricing campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to create pricing campaign' });
  }
};

// 11. Admin Update Pricing Campaign
exports.updatePricingCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      campaign_name,
      plan_tier,
      category,
      regular_price,
      campaign_price,
      trial_days,
      badge_text,
      headline,
      subheadline,
      is_active,
      start_date,
      end_date
    } = req.body;

    if (is_active === 1 || is_active === true) {
      // Scope deactivation to the same category
      const [currRows] = await db.query('SELECT category FROM pricing_campaigns WHERE id = ?', [id]);
      const targetCategory = category || (currRows.length > 0 ? currRows[0].category : 'billing');
      await db.query('UPDATE pricing_campaigns SET is_active = 0 WHERE category = ? AND id != ?', [targetCategory, id]);
    }

    const updates = [];
    const values = [];

    if (campaign_name !== undefined) { updates.push('campaign_name = ?'); values.push(campaign_name); }
    if (plan_tier !== undefined) { updates.push('plan_tier = ?'); values.push(plan_tier); }
    if (category !== undefined) { updates.push('category = ?'); values.push(category); }
    if (regular_price !== undefined) { updates.push('regular_price = ?'); values.push(parseFloat(regular_price)); }
    if (campaign_price !== undefined) { updates.push('campaign_price = ?'); values.push(parseFloat(campaign_price)); }
    if (trial_days !== undefined) { updates.push('trial_days = ?'); values.push(parseInt(trial_days, 10)); }
    if (badge_text !== undefined) { updates.push('badge_text = ?'); values.push(badge_text); }
    if (headline !== undefined) { updates.push('headline = ?'); values.push(headline); }
    if (subheadline !== undefined) { updates.push('subheadline = ?'); values.push(subheadline); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (start_date !== undefined) { updates.push('start_date = ?'); values.push(start_date ? start_date : null); }
    if (end_date !== undefined) { updates.push('end_date = ?'); values.push(end_date ? end_date : null); }

    if (updates.length > 0) {
      values.push(id);
      await db.query(`UPDATE pricing_campaigns SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    res.status(200).json({ success: true, message: 'Pricing campaign updated successfully' });
  } catch (error) {
    console.error('Error updating pricing campaign:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update pricing campaign' });
  }
};

// 12. Admin Delete Pricing Campaign
exports.deletePricingCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const [count] = await db.query('SELECT COUNT(*) as total FROM pricing_campaigns');
    if (count[0].total <= 1) {
      return res.status(400).json({ success: false, error: 'Cannot delete the only campaign in the system.' });
    }

    await db.query('DELETE FROM pricing_campaigns WHERE id = ?', [id]);
    
    // Ensure at least one is active
    const [active] = await db.query('SELECT id FROM pricing_campaigns WHERE is_active = 1 LIMIT 1');
    if (active.length === 0) {
      await db.query('UPDATE pricing_campaigns SET is_active = 1 ORDER BY id DESC LIMIT 1');
    }

    res.status(200).json({ success: true, message: 'Pricing campaign deleted' });
  } catch (error) {
    console.error('Error deleting pricing campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
};

// 13. SuperAdmin Global Email Gateway (Resend)
const { testResendConnection } = require('../services/emailClient');

exports.getEmailGateway = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT config_key, config_value, is_secret FROM global_configs 
       WHERE config_key IN ('DEFAULT_RESEND_API_KEY', 'DEFAULT_RESEND_FROM_EMAIL', 'DEFAULT_RESEND_FROM_NAME')`
    );

    let apiKey = '';
    let fromEmail = 'billing@retailnode.in';
    let fromName = 'RetailNode Digital Invoices';

    rows.forEach(r => {
      if (r.config_key === 'DEFAULT_RESEND_API_KEY') apiKey = r.config_value;
      if (r.config_key === 'DEFAULT_RESEND_FROM_EMAIL') fromEmail = r.config_value;
      if (r.config_key === 'DEFAULT_RESEND_FROM_NAME') fromName = r.config_value;
    });

    // Email stats
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_emails,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
      FROM email_logs
    `);

    const hasKey = Boolean(apiKey && apiKey.trim().length > 5);

    res.status(200).json({
      success: true,
      data: {
        is_configured: hasKey,
        resend_api_key_masked: hasKey ? `${apiKey.slice(0, 7)}••••••••${apiKey.slice(-4)}` : '',
        resend_from_email: fromEmail,
        resend_from_name: fromName,
        stats: {
          total_emails: stats[0]?.total_emails || 0,
          sent_count: stats[0]?.sent_count || 0,
          failed_count: stats[0]?.failed_count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching global email gateway:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email gateway settings' });
  }
};

exports.updateEmailGateway = async (req, res) => {
  try {
    const { resend_api_key, resend_from_email, resend_from_name } = req.body;

    if (resend_api_key !== undefined && !resend_api_key.includes('••••')) {
      await db.query(`
        INSERT INTO global_configs (config_key, config_value, is_secret)
        VALUES ('DEFAULT_RESEND_API_KEY', ?, 1)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `, [resend_api_key.trim()]);
    }

    if (resend_from_email !== undefined) {
      await db.query(`
        INSERT INTO global_configs (config_key, config_value, is_secret)
        VALUES ('DEFAULT_RESEND_FROM_EMAIL', ?, 0)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `, [resend_from_email.trim()]);
    }

    if (resend_from_name !== undefined) {
      await db.query(`
        INSERT INTO global_configs (config_key, config_value, is_secret)
        VALUES ('DEFAULT_RESEND_FROM_NAME', ?, 0)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
      `, [resend_from_name.trim()]);
    }

    res.status(200).json({ success: true, message: 'Global Resend Email settings saved successfully!' });
  } catch (error) {
    console.error('Error updating global email gateway:', error);
    res.status(500).json({ success: false, error: 'Failed to save email settings' });
  }
};

exports.testAdminEmailGateway = async (req, res) => {
  try {
    const { test_email, api_key, from_email, from_name } = req.body;

    if (!test_email || !test_email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid test recipient email address' });
    }

    let key = api_key;
    let from = from_email;
    let name = from_name;

    if (!key || key.includes('••••')) {
      const [rows] = await db.query(
        "SELECT config_value FROM global_configs WHERE config_key = 'DEFAULT_RESEND_API_KEY'"
      );
      key = rows[0]?.config_value;
    }

    if (!from) {
      const [rows] = await db.query(
        "SELECT config_value FROM global_configs WHERE config_key = 'DEFAULT_RESEND_FROM_EMAIL'"
      );
      from = rows[0]?.config_value || 'billing@retailnode.in';
    }

    if (!name) {
      const [rows] = await db.query(
        "SELECT config_value FROM global_configs WHERE config_key = 'DEFAULT_RESEND_FROM_NAME'"
      );
      name = rows[0]?.config_value || 'RetailNode SuperAdmin Test';
    }

    if (!key) {
      return res.status(400).json({ success: false, error: 'No Resend API Key configured to test with.' });
    }

    const testRes = await testResendConnection({
      apiKey: key,
      fromEmail: from,
      fromName: name,
      toEmail: test_email
    });

    if (testRes.success) {
      // Log to email_logs
      try {
        await db.query(
          `INSERT INTO email_logs (
            tenant_id, recipient_email, sender_email, subject, resend_email_id, status, is_default_gateway
          ) VALUES (1, ?, ?, 'SuperAdmin Resend Test Verification', ?, 'sent', 1)`,
          [test_email, from, testRes.emailId || 'admin_test']
        );
      } catch (e) {}

      return res.status(200).json(testRes);
    } else {
      return res.status(400).json(testRes);
    }
  } catch (error) {
    console.error('Error testing admin email gateway:', error);
    res.status(500).json({ success: false, error: 'Failed to test email gateway' });
  }
};

exports.getAdminEmailLogs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        el.id,
        el.tenant_id,
        t.store_name,
        el.invoice_id,
        el.recipient_email,
        el.sender_email,
        el.subject,
        el.resend_email_id,
        el.status,
        el.error_reason,
        el.is_default_gateway,
        el.created_at
      FROM email_logs el
      LEFT JOIN tenants t ON el.tenant_id = t.id
      ORDER BY el.id DESC
      LIMIT 100
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching admin email logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch email logs' });
  }
};

// 14. SuperAdmin WhatsApp Message Audit Logs
exports.getAdminWhatsAppLogs = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        bm.id,
        bm.tenant_id,
        t.store_name,
        bm.invoice_id,
        i.short_id,
        bm.customer_phone,
        bm.gateway,
        bm.template_name,
        bm.message_id,
        bm.status,
        bm.error_reason,
        bm.sent_at
      FROM billing_messages bm
      LEFT JOIN tenants t ON bm.tenant_id = t.id
      LEFT JOIN invoices i ON bm.invoice_id = i.id
      ORDER BY bm.id DESC
      LIMIT 150
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching admin WhatsApp logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch WhatsApp logs' });
  }
};

// ==========================================
// 15. GMB & GOOGLE REVIEW SAAS MANAGEMENT
// ==========================================

exports.getAllGmbLocations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        l.id,
        l.tenant_id,
        l.slug,
        l.title,
        l.primary_category,
        l.address,
        l.phone,
        l.website_url,
        l.whatsapp_number,
        l.place_id,
        l.google_review_url,
        l.selected_theme,
        l.logo_url,
        l.cover_url,
        l.funnel_views,
        l.funnel_positive_redirects,
        l.funnel_private_feedbacks,
        l.total_reviews,
        l.average_rating,
        l.profile_score,
        l.is_active,
        l.created_at,
        l.updated_at,
        t.store_name as tenant_store_name,
        t.store_email as tenant_email,
        t.store_phone as tenant_phone,
        t.plan_tier as tenant_plan
      FROM gmb_locations l
      LEFT JOIN tenants t ON l.tenant_id = t.id
      ORDER BY l.id DESC
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching GMB locations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch GMB locations' });
  }
};

exports.createGmbLocation = async (req, res) => {
  try {
    const {
      title,
      slug,
      tenant_id,
      place_id,
      phone,
      whatsapp_number,
      website_url,
      google_review_url,
      selected_theme = 'pearl-light',
      address,
      primary_category = 'Retail Store'
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, error: 'Location title is required' });
    }

    const cleanSlug = (slug || title).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    // Check if slug is unique
    const [existing] = await db.query('SELECT id FROM gmb_locations WHERE slug = ?', [cleanSlug]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: `Slug "${cleanSlug}" is already taken` });
    }

    const [result] = await db.query(
      `INSERT INTO gmb_locations (
        tenant_id, slug, title, primary_category, address, phone,
        website_url, whatsapp_number, place_id, google_review_url, selected_theme, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        tenant_id || null,
        cleanSlug,
        title.trim(),
        primary_category,
        address || '',
        phone || '',
        website_url || '',
        whatsapp_number || phone || '',
        place_id || '',
        google_review_url || '',
        selected_theme
      ]
    );

    // If tenant_id was linked, synchronize tenant record
    if (tenant_id) {
      await db.query(
        `UPDATE tenants SET 
          google_place_id = COALESCE(NULLIF(?, ''), google_place_id),
          google_review_url = COALESCE(NULLIF(?, ''), google_review_url),
          selected_theme = ?
         WHERE id = ?`,
        [place_id || '', google_review_url || '', selected_theme, tenant_id]
      ).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'GMB Location created successfully',
      data: { id: result.insertId, slug: cleanSlug }
    });
  } catch (error) {
    console.error('Error creating GMB location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateGmbLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    const {
      title,
      slug,
      tenant_id,
      place_id,
      phone,
      whatsapp_number,
      website_url,
      google_review_url,
      selected_theme,
      address,
      primary_category,
      is_active
    } = req.body;

    const [loc] = await db.query('SELECT id, slug FROM gmb_locations WHERE id = ?', [locationId]);
    if (loc.length === 0) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }

    let finalSlug = loc[0].slug;
    if (slug && slug.trim() !== loc[0].slug) {
      finalSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const [duplicate] = await db.query('SELECT id FROM gmb_locations WHERE slug = ? AND id != ?', [finalSlug, locationId]);
      if (duplicate.length > 0) {
        return res.status(400).json({ success: false, error: `Slug "${finalSlug}" is already taken` });
      }
    }

    await db.query(
      `UPDATE gmb_locations SET
        title = COALESCE(?, title),
        slug = ?,
        tenant_id = ?,
        place_id = COALESCE(?, place_id),
        phone = COALESCE(?, phone),
        whatsapp_number = COALESCE(?, whatsapp_number),
        website_url = COALESCE(?, website_url),
        google_review_url = COALESCE(?, google_review_url),
        selected_theme = COALESCE(?, selected_theme),
        address = COALESCE(?, address),
        primary_category = COALESCE(?, primary_category),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        finalSlug,
        tenant_id !== undefined ? (tenant_id || null) : null,
        place_id !== undefined ? place_id : null,
        phone !== undefined ? phone : null,
        whatsapp_number !== undefined ? whatsapp_number : null,
        website_url !== undefined ? website_url : null,
        google_review_url !== undefined ? google_review_url : null,
        selected_theme || null,
        address !== undefined ? address : null,
        primary_category || null,
        is_active !== undefined ? is_active : null,
        locationId
      ]
    );

    // If linked to tenant, sync tenant record
    if (tenant_id) {
      await db.query(
        `UPDATE tenants SET 
          google_place_id = COALESCE(NULLIF(?, ''), google_place_id),
          google_review_url = COALESCE(NULLIF(?, ''), google_review_url),
          selected_theme = COALESCE(NULLIF(?, ''), selected_theme)
         WHERE id = ?`,
        [place_id || '', google_review_url || '', selected_theme || '', tenant_id]
      ).catch(() => {});
    }

    res.status(200).json({ success: true, message: 'GMB Location updated successfully' });
  } catch (error) {
    console.error('Error updating GMB location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteGmbLocation = async (req, res) => {
  try {
    const locationId = req.params.id;
    await db.query('DELETE FROM gmb_locations WHERE id = ?', [locationId]);
    res.status(200).json({ success: true, message: 'GMB Location removed successfully' });
  } catch (error) {
    console.error('Error deleting GMB location:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getGmbReviews = async (req, res) => {
  try {
    const { location_id, star_rating, limit = 150 } = req.query;
    let query = `
      SELECT 
        r.id,
        r.location_id,
        r.reviewer_name,
        r.reviewer_photo_url,
        r.star_rating,
        r.comment,
        r.reply_comment,
        r.reply_updated_at,
        r.sentiment,
        r.review_created_at,
        r.created_at,
        l.title as location_title,
        l.slug as location_slug
      FROM gmb_reviews r
      LEFT JOIN gmb_locations l ON r.location_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (location_id) {
      query += ' AND r.location_id = ?';
      params.push(location_id);
    }
    if (star_rating) {
      query += ' AND r.star_rating = ?';
      params.push(star_rating);
    }

    query += ' ORDER BY r.id DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await db.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching GMB reviews:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
};

exports.replyGmbReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { reply_comment } = req.body;
    if (!reply_comment) {
      return res.status(400).json({ success: false, error: 'Reply comment is required' });
    }

    await db.query(
      `UPDATE gmb_reviews SET reply_comment = ?, reply_updated_at = NOW() WHERE id = ?`,
      [reply_comment.trim(), reviewId]
    );

    res.status(200).json({ success: true, message: 'Review reply saved successfully' });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getGmbFeedbacks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        f.id,
        f.location_id,
        f.rating,
        f.feedback,
        f.customer_name,
        f.customer_phone,
        f.is_resolved,
        f.resolution_notes,
        f.created_at,
        l.title as location_title,
        l.slug as location_slug
      FROM gmb_feedback f
      LEFT JOIN gmb_locations l ON f.location_id = l.id
      ORDER BY f.id DESC
      LIMIT 150
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching GMB feedbacks:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feedbacks' });
  }
};

// ==========================================
// 16. USERS & STORE ACCESS MANAGEMENT
// ==========================================

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id,
        u.tenant_id,
        u.email,
        u.phone,
        u.first_name,
        u.last_name,
        u.role,
        u.created_at,
        t.store_name,
        t.plan_tier,
        l.id as gmb_location_id,
        l.title as gmb_location_title,
        l.slug as gmb_slug
      FROM users u
      LEFT JOIN tenants t ON u.tenant_id = t.id
      LEFT JOIN gmb_locations l ON l.tenant_id = t.id
      ORDER BY u.id DESC
    `);

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, phone, first_name, last_name, role = 'merchant_admin', tenant_id } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO users (email, password_hash, phone, first_name, last_name, role, tenant_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email.trim().toLowerCase(),
        passwordHash,
        phone || null,
        first_name || null,
        last_name || null,
        role,
        tenant_id || null
      ]
    );

    // Dispatch branded RetailNode Welcome Email
    if (email && email.includes('@')) {
      (async () => {
        try {
          let storeName = 'RetailNode Store';
          let planName = 'Merchant Access Plan';
          if (tenant_id) {
            const [tRows] = await db.query('SELECT store_name, plan_tier FROM tenants WHERE id = ?', [tenant_id]);
            if (tRows.length > 0) {
              storeName = tRows[0].store_name || storeName;
              planName = `${(tRows[0].plan_tier || 'trial').toUpperCase()} Plan`;
            }
          }

          const welcomeHtml = generateWelcomeVerificationEmailHtml({
            storeName,
            ownerName: `${first_name || ''} ${last_name || ''}`.trim() || 'Store User',
            userEmail: email.trim().toLowerCase(),
            loginUrl: 'https://bill.retailnode.in/login',
            planName,
            role: role || 'merchant_admin',
            temporaryPassword: password || null
          });

          await sendEmail({
            tenantId: tenant_id || null,
            to: email.trim().toLowerCase(),
            subject: `Welcome to RetailNode - ${storeName}`,
            html: welcomeHtml,
            emailType: 'welcome'
          });
        } catch (mailErr) {
          console.warn('[Admin] Failed to send user welcome email:', mailErr.message);
        }
      })();
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, phone, first_name, last_name, role, tenant_id, password } = req.body;

    const [user] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let passwordHash = null;
    if (password && password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password.trim(), salt);
    }

    let updateFields = [
      'phone = COALESCE(?, phone)',
      'first_name = COALESCE(?, first_name)',
      'last_name = COALESCE(?, last_name)',
      'role = COALESCE(?, role)',
      'tenant_id = ?'
    ];
    let updateParams = [
      phone !== undefined ? phone : null,
      first_name !== undefined ? first_name : null,
      last_name !== undefined ? last_name : null,
      role || null,
      tenant_id !== undefined ? (tenant_id || null) : null
    ];

    if (email) {
      updateFields.push('email = ?');
      updateParams.push(email.trim().toLowerCase());
    }

    if (passwordHash) {
      updateFields.push('password_hash = ?');
      updateParams.push(passwordHash);
    }

    updateParams.push(userId);

    await db.query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);

    res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (Number(userId) === 1) {
      return res.status(400).json({ success: false, error: 'Root SuperAdmin account cannot be deleted' });
    }
    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};



