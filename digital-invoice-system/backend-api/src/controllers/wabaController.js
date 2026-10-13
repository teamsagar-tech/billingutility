const db = require('../config/database');

exports.getWabaSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query('SELECT waba_access_token, phone_number_id FROM tenants WHERE id = ?', [tenantId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch WABA settings' });
  }
};

exports.updateWabaSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { waba_access_token, phone_number_id } = req.body;

    await db.query(
      'UPDATE tenants SET waba_access_token = ?, phone_number_id = ? WHERE id = ?',
      [waba_access_token, phone_number_id, tenantId]
    );

    res.status(200).json({ success: true, message: 'WABA Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update WABA settings' });
  }
};
