const db = require('../config/database');

// GET all promotional banners for tenant
exports.getBanners = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT id, title, image_url, target_url, is_active, created_at FROM ad_banners WHERE tenant_id = ? ORDER BY id DESC',
      [tenantId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ success: false, error: 'Server error fetching banners' });
  }
};

// Create a new banner
exports.createBanner = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { title, image_url, target_url } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({ success: false, error: 'Title and image URL are required' });
    }

    const [result] = await db.query(
      'INSERT INTO ad_banners (tenant_id, title, image_url, target_url, is_active) VALUES (?, ?, ?, ?, 1)',
      [tenantId, title, image_url, target_url || null]
    );

    res.status(201).json({
      success: true,
      message: 'Promotional banner added successfully',
      data: { id: result.insertId, title, image_url }
    });
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({ success: false, error: 'Server error adding banner' });
  }
};

// Toggle banner status
exports.toggleBanner = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query(
      'UPDATE ad_banners SET is_active = ? WHERE id = ? AND tenant_id = ?',
      [is_active ? 1 : 0, id, tenantId]
    );

    res.status(200).json({ success: true, message: 'Banner status updated' });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ success: false, error: 'Server error updating banner' });
  }
};
