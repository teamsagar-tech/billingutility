const db = require('../config/database');

exports.getStoreProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT store_name, logo_url, instagram_url, facebook_url, google_review_url FROM tenants WHERE id = ?',
      [tenantId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching store profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateStoreProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { store_name, logo_url, instagram_url, facebook_url, google_review_url } = req.body;

    if (!store_name) {
      return res.status(400).json({ success: false, error: 'Store name is required' });
    }

    await db.query(
      `UPDATE tenants 
       SET store_name = ?, logo_url = ?, instagram_url = ?, facebook_url = ?, google_review_url = ? 
       WHERE id = ?`,
      [store_name, logo_url, instagram_url, facebook_url, google_review_url, tenantId]
    );

    res.status(200).json({ success: true, message: 'Store profile updated successfully' });
  } catch (error) {
    console.error('Error updating store profile:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
