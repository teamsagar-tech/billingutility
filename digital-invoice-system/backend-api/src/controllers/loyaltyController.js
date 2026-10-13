const db = require('../config/database');

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query('SELECT * FROM loyalty_settings WHERE tenant_id = ?', [tenantId]);
    
    if (rows.length === 0) {
      // Return defaults
      return res.status(200).json({
        success: true,
        data: {
          rupees_per_point: 100,
          min_points_redeem: 500,
          discount_value: 50.00,
          is_active: true
        }
      });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { rupees_per_point, min_points_redeem, discount_value, is_active } = req.body;

    await db.query(`
      INSERT INTO loyalty_settings (tenant_id, rupees_per_point, min_points_redeem, discount_value, is_active)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      rupees_per_point = VALUES(rupees_per_point),
      min_points_redeem = VALUES(min_points_redeem),
      discount_value = VALUES(discount_value),
      is_active = VALUES(is_active)
    `, [tenantId, rupees_per_point, min_points_redeem, discount_value, is_active]);

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};
