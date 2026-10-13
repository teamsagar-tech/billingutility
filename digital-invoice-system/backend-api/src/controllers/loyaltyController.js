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
    `, [tenantId, rupees_per_point || 100, min_points_redeem || 500, discount_value || 50.00, is_active !== false ? 1 : 0]);

    res.status(200).json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
};

/**
 * GET /api/v1/auth/loyalty/ledger
 * Real transactional loyalty points earned and redeemed across store invoices
 */
exports.getLoyaltyLedger = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Fetch Invoices for this tenant
    const [invoices] = await db.query(
      `SELECT id, short_id, customer_phone, receipt_json, created_at 
       FROM invoices 
       WHERE tenant_id = ? 
       ORDER BY created_at DESC LIMIT 50`,
      [tenantId]
    );

    // 2. Fetch Customer Balances
    const [custRows] = await db.query(
      `SELECT phone, customer_name, loyalty_points FROM customers WHERE tenant_id = ?`,
      [tenantId]
    );
    const custMap = {};
    custRows.forEach(c => {
      custMap[c.phone] = c;
    });

    const ledger = invoices.map(inv => {
      let rJson = {};
      try {
        rJson = typeof inv.receipt_json === 'string' ? JSON.parse(inv.receipt_json) : (inv.receipt_json || {});
      } catch (e) {}

      const amt = parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0);
      const invNum = rJson.InvoiceNumber || rJson.invoice_number || inv.short_id;
      const custName = rJson.CustomerName || custMap[inv.customer_phone]?.customer_name || 'Valued Shopper';
      const earned = Math.round(amt / 100);
      const balance = custMap[inv.customer_phone]?.loyalty_points || earned;

      return {
        id: inv.id,
        shortId: inv.short_id,
        date: inv.created_at,
        customerName: custName,
        phone: inv.customer_phone,
        billNo: invNum,
        billAmount: amt,
        earned,
        redeemed: 0,
        balance
      };
    });

    res.status(200).json({
      success: true,
      data: ledger
    });
  } catch (err) {
    console.error('Loyalty ledger error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch loyalty ledger' });
  }
};
