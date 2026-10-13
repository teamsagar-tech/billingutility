const db = require('../config/database');

exports.getFeedbackSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query('SELECT feedback_enabled FROM tenants WHERE id = ?', [tenantId]);
    res.status(200).json({ success: true, feedback_enabled: !!rows[0]?.feedback_enabled });
  } catch (error) {
    console.error('Error fetching feedback settings:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.updateFeedbackSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { feedback_enabled } = req.body;
    
    await db.query('UPDATE tenants SET feedback_enabled = ? WHERE id = ?', [feedback_enabled, tenantId]);
    res.status(200).json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Error updating feedback settings:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.getFeedbackResponses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT customer_phone, rating, comment, created_at FROM customer_feedback WHERE tenant_id = ? ORDER BY created_at DESC',
      [tenantId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.submitFeedback = async (req, res) => {
  try {
    // This is a public route accessed via the digital receipt
    const { shortId, rating, comment } = req.body;
    if (!shortId || !rating) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Lookup the tenant and customer phone via the invoice shortId
    const [invRows] = await db.query('SELECT tenant_id, customer_phone FROM invoices WHERE short_id = ?', [shortId]);
    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { tenant_id, customer_phone } = invRows[0];

    await db.query(
      'INSERT INTO customer_feedback (tenant_id, customer_phone, rating, comment) VALUES (?, ?, ?, ?)',
      [tenant_id, customer_phone, rating, comment]
    );

    res.status(201).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
