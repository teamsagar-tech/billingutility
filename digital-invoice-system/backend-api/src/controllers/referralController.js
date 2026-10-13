const db = require('../config/database');

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    let [rows] = await db.query('SELECT * FROM referral_settings WHERE tenant_id = ?', [tenantId]);
    
    // If no settings exist yet, return defaults
    if (rows.length === 0) {
      const defaultSettings = {
        referrer_reward_points: 500,
        referee_discount_value: 50.00,
        is_active: false
      };
      return res.status(200).json({ success: true, data: defaultSettings });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching referral settings:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { referrer_reward_points, referee_discount_value, is_active } = req.body;

    const [existing] = await db.query('SELECT id FROM referral_settings WHERE tenant_id = ?', [tenantId]);

    if (existing.length === 0) {
      await db.query(
        'INSERT INTO referral_settings (tenant_id, referrer_reward_points, referee_discount_value, is_active) VALUES (?, ?, ?, ?)',
        [tenantId, referrer_reward_points, referee_discount_value, is_active]
      );
    } else {
      await db.query(
        'UPDATE referral_settings SET referrer_reward_points = ?, referee_discount_value = ?, is_active = ? WHERE tenant_id = ?',
        [referrer_reward_points, referee_discount_value, is_active, tenantId]
      );
    }

    res.status(200).json({ success: true, message: 'Referral settings updated successfully' });
  } catch (error) {
    console.error('Error updating referral settings:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getReport = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT referrer_phone, referee_phone, status, created_at FROM referrals WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 50',
      [tenantId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching referral report:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
