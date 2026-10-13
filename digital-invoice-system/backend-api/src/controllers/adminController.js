const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const redis = require('../config/redis');

// 1. Platform-Wide Analytics
exports.getPlatformAnalytics = async (req, res) => {
  try {
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

    res.status(200).json({
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
    });
  } catch (error) {
    console.error('Error fetching SaaS platform analytics:', error);
    res.status(500).json({ success: false, error: 'Server error fetching platform analytics' });
  }
};

// 2. Tenants Directory
exports.getAllTenants = async (req, res) => {
  try {
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

    res.status(200).json({ success: true, data: rows });
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

    let targetExpiry = plan_valid_until !== undefined ? plan_valid_until : existing[0].plan_valid_until;
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

    await db.query(
      `UPDATE tenants SET 
        store_name = COALESCE(?, store_name),
        store_phone = COALESCE(?, store_phone),
        store_email = COALESCE(?, store_email),
        store_address = COALESCE(?, store_address),
        gstin = COALESCE(?, gstin),
        plan_tier = COALESCE(?, plan_tier),
        plan_valid_until = ?,
        message_quota = COALESCE(?, message_quota),
        is_active = COALESCE(?, is_active),
        google_place_id = COALESCE(?, google_place_id),
        google_review_url = COALESCE(?, google_review_url),
        instagram_url = COALESCE(?, instagram_url),
        youtube_url = COALESCE(?, youtube_url)
       WHERE id = ?`,
      [
        store_name, store_phone, store_email, store_address, gstin, 
        plan_tier, targetExpiry, message_quota, is_active, 
        google_place_id, google_review_url, instagram_url, youtube_url,
        id
      ]
    );

    // Invalidate Redis profile cache
    try {
      await redis.del(`tenant:profile:${id}`);
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
    const [rows] = await db.query(`
      SELECT 
        id, 
        campaign_name, 
        plan_tier, 
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
      ORDER BY id DESC 
      LIMIT 1
    `);

    if (rows.length > 0) {
      return res.status(200).json({ success: true, data: rows[0] });
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

    if (!campaign_name || !campaign_price) {
      return res.status(400).json({ success: false, error: 'Campaign name and price are required' });
    }

    const activeFlag = is_active ? 1 : 0;
    if (activeFlag === 1) {
      // Deactivate others
      await db.query('UPDATE pricing_campaigns SET is_active = 0');
    }

    const regPrice = regular_price ? parseFloat(regular_price) : 9000.00;
    const campPrice = parseFloat(campaign_price);
    const savings = Math.max(0, regPrice - campPrice);
    const percent = Math.round((savings / regPrice) * 100);
    const defaultBadge = badge_text || `SAVE ₹${savings.toLocaleString('en-IN')} TODAY (${percent}% OFF)`;

    const [result] = await db.query(
      `INSERT INTO pricing_campaigns (
        campaign_name, plan_tier, regular_price, campaign_price, trial_days,
        badge_text, headline, subheadline, is_active, start_date, end_date
      ) VALUES (?, 'growth', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaign_name,
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
      await db.query('UPDATE pricing_campaigns SET is_active = 0 WHERE id != ?', [id]);
    }

    await db.query(
      `UPDATE pricing_campaigns SET
        campaign_name = COALESCE(?, campaign_name),
        regular_price = COALESCE(?, regular_price),
        campaign_price = COALESCE(?, campaign_price),
        trial_days = COALESCE(?, trial_days),
        badge_text = COALESCE(?, badge_text),
        headline = COALESCE(?, headline),
        subheadline = COALESCE(?, subheadline),
        is_active = COALESCE(?, is_active),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date)
       WHERE id = ?`,
      [
        campaign_name,
        regular_price !== undefined ? parseFloat(regular_price) : null,
        campaign_price !== undefined ? parseFloat(campaign_price) : null,
        trial_days !== undefined ? parseInt(trial_days, 10) : null,
        badge_text,
        headline,
        subheadline,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        start_date,
        end_date,
        id
      ]
    );

    res.status(200).json({ success: true, message: 'Pricing campaign updated successfully' });
  } catch (error) {
    console.error('Error updating pricing campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to update pricing campaign' });
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
