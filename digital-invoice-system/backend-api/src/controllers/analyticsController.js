const db = require('../config/database');

exports.getAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // From requireAuth middleware

    // Total Invoices / Messages Sent
    const [totalRows] = await db.query(
      'SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ?',
      [tenantId]
    );
    const totalInvoices = totalRows[0].total;

    // Unique Customers (Total Customers)
    const [uniqueRows] = await db.query(
      'SELECT COUNT(DISTINCT customer_phone) as unique_customers FROM invoices WHERE tenant_id = ?',
      [tenantId]
    );
    const totalCustomers = uniqueRows[0].unique_customers;

    // Existing Customers (Customers who have > 1 invoice)
    const [existingRows] = await db.query(`
      SELECT COUNT(*) as existing_customers FROM (
        SELECT customer_phone FROM invoices 
        WHERE tenant_id = ? 
        GROUP BY customer_phone 
        HAVING COUNT(*) > 1
      ) as subquery
    `, [tenantId]);
    
    const existingCustomers = existingRows[0].existing_customers;
    const newCustomers = totalCustomers; // All unique customers are technically new at some point. Or we can define 'New' as total - existing.
    const purelyNewCustomers = totalCustomers - existingCustomers;

    // Recent Invoices (last 5)
    const [recentInvoices] = await db.query(
      'SELECT short_id, customer_phone, created_at FROM invoices WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5',
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: {
        totalMessages: totalInvoices,
        totalCustomers: totalCustomers,
        newCustomers: purelyNewCustomers,
        returningCustomers: existingCustomers,
        recentInvoices
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};
