const db = require('../config/database');

exports.getCustomers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [customers] = await db.query(
      'SELECT id, phone, total_spent, loyalty_points, last_visit, created_at FROM customers WHERE tenant_id = ? ORDER BY last_visit DESC',
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('CRM Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};
