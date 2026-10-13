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
        created_at 
       FROM tenants WHERE id = ?`,
      [tenantId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant store not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
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
      fb_pixel_id, 
      feedback_enabled 
    } = req.body;

    if (!store_name) {
      return res.status(400).json({ success: false, error: 'Store name is required' });
    }

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
         feedback_enabled = ?
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
        tenantId
      ]
    );

    // Invalidate Redis profile cache so fresh details load instantly
    try {
      await redis.del(`tenant:profile:${tenantId}`);
    } catch (e) {}

    res.status(200).json({ 
      success: true, 
      message: 'Store and company details saved successfully' 
    });
  } catch (error) {
    console.error('Error updating store profile:', error);
    res.status(500).json({ success: false, error: 'Server error saving company details' });
  }
};

