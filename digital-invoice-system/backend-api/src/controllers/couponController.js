const db = require('../config/database');
const redis = require('../config/redis');

// GET all coupons for tenant (Redis In-Memory Caching)
exports.getCoupons = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const cacheKey = `store:coupons:${tenantId}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch (e) {}

    const [rows] = await db.query(
      `SELECT id, code, title, discount_type, discount_value, min_bill_amount, 
              total_coupons, redeemed_count, valid_until, is_active, created_at 
       FROM coupons 
       WHERE tenant_id = ? 
       ORDER BY id DESC`,
      [tenantId]
    );

    // Compute metrics
    const totalAll = rows.reduce((acc, c) => acc + (c.total_coupons || 0), 0);
    const totalRedeemed = rows.reduce((acc, c) => acc + (c.redeemed_count || 0), 0);
    const totalAvailable = Math.max(0, totalAll - totalRedeemed);

    const payload = {
      success: true,
      data: rows,
      summary: {
        totalCoupons: totalAll,
        redeemedCoupons: totalRedeemed,
        availableCoupons: totalAvailable,
        activeCampaigns: rows.filter(c => c.is_active).length
      }
    };

    try {
      await redis.setex(cacheKey, 60, JSON.stringify(payload));
    } catch (e) {}

    res.status(200).json(payload);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ success: false, error: 'Server error fetching coupons' });
  }
};

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { code, title, discount_type, discount_value, min_bill_amount, total_coupons, valid_until } = req.body;

    if (!code || !title || !discount_value) {
      return res.status(400).json({ success: false, error: 'Code, title, and discount value are required' });
    }

    const [result] = await db.query(
      `INSERT INTO coupons (tenant_id, code, title, discount_type, discount_value, min_bill_amount, total_coupons, redeemed_count, valid_until, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 1)`,
      [
        tenantId,
        code.toUpperCase().trim(),
        title.trim(),
        discount_type || 'flat',
        parseFloat(discount_value),
        parseFloat(min_bill_amount || 0),
        parseInt(total_coupons || 100, 10),
        valid_until || null
      ]
    );

    try {
      await redis.del(`store:coupons:${tenantId}`);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: { id: result.insertId, code }
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ success: false, error: 'Server error creating coupon' });
  }
};

// Toggle or Delete Coupon
exports.toggleCoupon = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { is_active } = req.body;

    await db.query(
      'UPDATE coupons SET is_active = ? WHERE id = ? AND tenant_id = ?',
      [is_active ? 1 : 0, id, tenantId]
    );

    try {
      await redis.del(`store:coupons:${tenantId}`);
    } catch (e) {}

    res.status(200).json({ success: true, message: 'Coupon status updated' });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ success: false, error: 'Server error updating coupon' });
  }
};
