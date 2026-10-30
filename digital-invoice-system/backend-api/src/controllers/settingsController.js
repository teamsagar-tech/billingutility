const db = require('../config/database');
const redis = require('../config/redis');

exports.getStoreProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT 
        id, 
        store_name, 
        store_address, 
        store_phone, 
        store_email, 
        gstin, 
        logo_url, 
        website_url, 
        instagram_url, 
        facebook_url, 
        youtube_url,
        google_review_url, 
        google_place_id,
        fb_pixel_id, 
        feedback_enabled, 
        api_token, 
        waba_provider, 
        phone_number_id, 
        waba_template_name, 
        bill_dispatch_format,
        pdf_template_name,
        image_template_name,
        custom_bill_image_url,
        plan_tier, 
        plan_valid_until,
        DATEDIFF(plan_valid_until, CURRENT_DATE) as plan_days_remaining,
        CASE 
          WHEN plan_valid_until IS NULL THEN 'lifetime'
          WHEN plan_valid_until < CURRENT_DATE THEN 'expired'
          WHEN DATEDIFF(plan_valid_until, CURRENT_DATE) <= 15 THEN 'expiring_soon'
          ELSE 'active'
        END as plan_status,
        message_quota, 
        messages_used, 
        is_active, 
        resend_api_key,
        resend_from_email,
        resend_from_name,
        email_billing_enabled,
        created_at 
       FROM tenants WHERE id = ?`,
      [tenantId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant store not found' });
    }

    const tenantStore = rows[0];

    // Fetch linked GMB Location(s) from gmb_locations table
    let [gmbRows] = await db.query(
      `SELECT 
        id as gmb_location_id,
        slug as gmb_slug,
        title as gmb_title,
        place_id as gmb_place_id,
        google_review_url as gmb_review_url,
        selected_theme,
        funnel_views,
        funnel_positive_redirects,
        funnel_private_feedbacks,
        total_reviews,
        average_rating,
        profile_score,
        whatsapp_number,
        phone as gmb_phone,
        address as gmb_address,
        social_links
       FROM gmb_locations 
       WHERE tenant_id = ? 
       ORDER BY id ASC`,
      [tenantId]
    );

    // If no location exists yet for this tenant, auto-create one
    if (gmbRows.length === 0) {
      let baseSlug = (tenantStore.store_name || 'store')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `store-${tenantId}`;

      const [existingSlug] = await db.query('SELECT id FROM gmb_locations WHERE slug = ?', [baseSlug]);
      const finalSlug = existingSlug.length > 0 ? `${baseSlug}-${tenantId}` : baseSlug;

      try {
        const [insertRes] = await db.query(
          `INSERT INTO gmb_locations (
            tenant_id, slug, title, address, phone, website_url,
            whatsapp_number, place_id, google_review_url, selected_theme, logo_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pearl-light', ?)`,
          [
            tenantId,
            finalSlug,
            tenantStore.store_name,
            tenantStore.store_address,
            tenantStore.store_phone,
            tenantStore.website_url,
            tenantStore.store_phone,
            tenantStore.google_place_id,
            tenantStore.google_review_url,
            tenantStore.logo_url
          ]
        );

        gmbRows = [{
          gmb_location_id: insertRes.insertId,
          gmb_slug: finalSlug,
          gmb_title: tenantStore.store_name,
          gmb_place_id: tenantStore.google_place_id,
          gmb_review_url: tenantStore.google_review_url,
          selected_theme: 'pearl-light',
          funnel_views: 0,
          funnel_positive_redirects: 0,
          funnel_private_feedbacks: 0,
          total_reviews: 0,
          average_rating: 0,
          profile_score: 65,
          whatsapp_number: tenantStore.store_phone,
          gmb_phone: tenantStore.store_phone,
          gmb_address: tenantStore.store_address,
          social_links: {}
        }];
      } catch (insertErr) {
        console.warn('[getStoreProfile] Could not auto-create gmb_locations row:', insertErr.message);
      }
    }

    const primaryGmb = gmbRows[0] || {};

    const profileData = {
      ...tenantStore,
      ...primaryGmb,
      gmb_locations: gmbRows
    };

    res.status(200).json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error fetching store profile:', error);
    res.status(500).json({ success: false, error: 'Server error fetching company details' });
  }
};

exports.updateStoreProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { 
      store_name, 
      store_address, 
      store_phone, 
      store_email, 
      gstin, 
      logo_url, 
      website_url, 
      instagram_url, 
      facebook_url, 
      youtube_url,
      google_review_url, 
      google_place_id,
      selected_theme,
      gmb_slug,
      whatsapp_number,
      fb_pixel_id, 
      feedback_enabled,
      resend_api_key,
      resend_from_email,
      resend_from_name,
      email_billing_enabled
    } = req.body;

    if (!store_name) {
      return res.status(400).json({ success: false, error: 'Store name is required' });
    }

    // 1. Update tenants table
    await db.query(
      `UPDATE tenants 
       SET 
         store_name = ?, 
         store_address = ?, 
         store_phone = ?, 
         store_email = ?, 
         gstin = ?, 
         logo_url = ?, 
         website_url = ?, 
         instagram_url = ?, 
         facebook_url = ?, 
         youtube_url = ?,
         google_review_url = ?, 
         google_place_id = ?,
         fb_pixel_id = ?, 
         feedback_enabled = ?,
         resend_api_key = COALESCE(?, resend_api_key),
         resend_from_email = COALESCE(?, resend_from_email),
         resend_from_name = COALESCE(?, resend_from_name),
         email_billing_enabled = COALESCE(?, email_billing_enabled)
       WHERE id = ?`,
      [
        store_name, 
        store_address || null, 
        store_phone || null, 
        store_email || null, 
        gstin || null, 
        logo_url || null, 
        website_url || null, 
        instagram_url || null, 
        facebook_url || null, 
        youtube_url || null,
        google_review_url || null, 
        google_place_id || null,
        fb_pixel_id || null, 
        feedback_enabled !== undefined ? (feedback_enabled ? 1 : 0) : 1,
        resend_api_key !== undefined ? (resend_api_key.trim() === '' ? null : resend_api_key.trim()) : null,
        resend_from_email !== undefined ? (resend_from_email.trim() || null) : null,
        resend_from_name !== undefined ? (resend_from_name.trim() || null) : null,
        email_billing_enabled !== undefined ? (email_billing_enabled ? 1 : 0) : null,
        tenantId
      ]
    );

    // 2. Synchronize gmb_locations table for this tenant
    const socialLinks = JSON.stringify({
      instagram: instagram_url || '',
      facebook: facebook_url || '',
      website: website_url || '',
      whatsapp: whatsapp_number || store_phone || ''
    });

    const [existingLoc] = await db.query(
      'SELECT id, slug FROM gmb_locations WHERE tenant_id = ? ORDER BY id ASC LIMIT 1',
      [tenantId]
    );

    if (existingLoc.length > 0) {
      await db.query(
        `UPDATE gmb_locations 
         SET 
           title = ?,
           address = ?,
           phone = ?,
           website_url = ?,
           whatsapp_number = ?,
           place_id = ?,
           google_review_url = ?,
           selected_theme = COALESCE(?, selected_theme),
           slug = COALESCE(?, slug),
           logo_url = ?,
           social_links = ?
         WHERE id = ?`,
        [
          store_name,
          store_address || '',
          store_phone || '',
          website_url || '',
          whatsapp_number || store_phone || '',
          google_place_id || '',
          google_review_url || '',
          selected_theme || null,
          gmb_slug ? gmb_slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : null,
          logo_url || '',
          socialLinks,
          existingLoc[0].id
        ]
      );
    } else {
      let baseSlug = gmb_slug ? gmb_slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') : 
        (store_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `store-${tenantId}`);

      await db.query(
        `INSERT INTO gmb_locations (
          tenant_id, slug, title, address, phone, website_url,
          whatsapp_number, place_id, google_review_url, selected_theme, logo_url, social_links
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tenantId,
          baseSlug,
          store_name,
          store_address || '',
          store_phone || '',
          website_url || '',
          whatsapp_number || store_phone || '',
          google_place_id || '',
          google_review_url || '',
          selected_theme || 'pearl-light',
          logo_url || '',
          socialLinks
        ]
      );
    }

    // Invalidate Redis profile cache so fresh details load instantly
    try {
      await redis.del(`tenant:profile:${tenantId}`);
    } catch (e) {}

    res.status(200).json({ 
      success: true, 
      message: 'Store profile and Google Review Hub settings saved successfully' 
    });
  } catch (error) {
    console.error('Error updating store profile:', error);
    res.status(500).json({ success: false, error: 'Server error saving company details' });
  }
};

exports.regenerateApiToken = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const crypto = require('crypto');
    const newToken = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    await db.query(`UPDATE tenants SET api_token = ? WHERE id = ?`, [newToken, tenantId]);
    res.status(200).json({ success: true, api_token: newToken });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStoreDevices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(`SELECT * FROM store_devices WHERE tenant_id = ?`, [tenantId]).catch(() => [[]]);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(200).json({ success: true, data: [] });
  }
};

exports.deleteStoreDevice = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const deviceId = req.params.id;
    await db.query(`DELETE FROM store_devices WHERE id = ? AND tenant_id = ?`, [deviceId, tenantId]).catch(() => {});
    res.status(200).json({ success: true, message: 'Device removed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.resetStoreDevices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    await db.query(`DELETE FROM store_devices WHERE tenant_id = ?`, [tenantId]).catch(() => {});
    res.status(200).json({ success: true, message: 'Devices reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

