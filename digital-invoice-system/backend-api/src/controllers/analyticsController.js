const db = require('../config/database');

exports.getAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Total Invoices
    const [totalRows] = await db.query(
      'SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ?',
      [tenantId]
    );
    const totalInvoices = totalRows[0].total;

    // 2. Fetch all invoices for revenue and new vs repeat split
    const [invoiceRows] = await db.query(
      'SELECT receipt_json, customer_phone, created_at FROM invoices WHERE tenant_id = ? ORDER BY created_at ASC',
      [tenantId]
    );

    let totalRevenue = 0;
    let newRevenue = 0;
    let repeatRevenue = 0;
    const phoneCounts = {};

    invoiceRows.forEach(r => {
      let rJson = {};
      try {
        rJson = typeof r.receipt_json === 'string' ? JSON.parse(r.receipt_json) : (r.receipt_json || {});
      } catch (e) {}
      const amt = parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0);
      totalRevenue += amt;
      phoneCounts[r.customer_phone] = (phoneCounts[r.customer_phone] || 0) + 1;
    });

    let newBillsCount = 0;
    let repeatBillsCount = 0;
    invoiceRows.forEach(r => {
      let rJson = {};
      try {
        rJson = typeof r.receipt_json === 'string' ? JSON.parse(r.receipt_json) : (r.receipt_json || {});
      } catch (e) {}
      const amt = parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0);
      if (phoneCounts[r.customer_phone] > 1) {
        repeatBillsCount++;
        repeatRevenue += amt;
      } else {
        newBillsCount++;
        newRevenue += amt;
      }
    });

    // 3. Unique Customers
    const uniqueCustomers = Object.keys(phoneCounts).length;
    const existingCustomers = Object.values(phoneCounts).filter(c => c > 1).length;
    const purelyNewCustomers = Math.max(0, uniqueCustomers - existingCustomers);

    // 4. Google Review Clicks (Google Page Visited)
    const [reviewStats] = await db.query(
      'SELECT COUNT(*) as count FROM action_logs WHERE tenant_id = ? AND action_type = "google_review_click"',
      [tenantId]
    );
    const googleReviewsVisited = reviewStats[0]?.count || 0;

    // 5. Feedback Received
    let feedbackReceived = 0;
    let avgFeedbackRating = '5.0';
    try {
      const [feedbackStats] = await db.query(
        'SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM customer_feedback WHERE tenant_id = ?',
        [tenantId]
      );
      feedbackReceived = feedbackStats[0]?.count || 0;
      if (feedbackStats[0]?.avg_rating) {
        avgFeedbackRating = parseFloat(feedbackStats[0].avg_rating).toFixed(1);
      }
    } catch (e) {}

    // 6. Loyalty stats
    const [loyaltyStats] = await db.query(
      'SELECT SUM(loyalty_points) as total_earned FROM customers WHERE tenant_id = ?',
      [tenantId]
    );
    const loyaltyPointsEarned = loyaltyStats[0]?.total_earned || 0;

    // 7. Recent Invoices with parsed details
    const [recentRows] = await db.query(
      'SELECT id, short_id, customer_phone, receipt_json, created_at FROM invoices WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5',
      [tenantId]
    );

    const recentInvoices = recentRows.map(r => {
      let rJson = {};
      try {
        rJson = typeof r.receipt_json === 'string' ? JSON.parse(r.receipt_json) : (r.receipt_json || {});
      } catch (e) {}
      return {
        id: r.id,
        short_id: r.short_id,
        shortId: r.short_id,
        customer_phone: r.customer_phone,
        customerPhone: r.customer_phone,
        customer_name: rJson.CustomerName || rJson.customerName || 'Customer',
        customerName: rJson.CustomerName || rJson.customerName || 'Customer',
        invoice_number: rJson.InvoiceNumber || rJson.invoice_number || r.short_id,
        invoiceNumber: rJson.InvoiceNumber || rJson.invoice_number || r.short_id,
        bill_total: parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0),
        billTotal: parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || 0),
        created_at: r.created_at,
        createdAt: r.created_at,
        whatsapp_status: 'delivered',
        whatsappStatus: 'delivered'
      };
    });

    const roundedRevenue = Math.round(totalRevenue);

    res.status(200).json({
      success: true,
      data: {
        totalInvoices,
        totalRevenue: roundedRevenue,
        newRevenue: Math.round(newRevenue),
        repeatRevenue: Math.round(repeatRevenue),
        newBillsCount,
        repeatBillsCount,
        avgOrderValue: totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0,
        totalCustomers: uniqueCustomers,
        newCustomers: purelyNewCustomers,
        returningCustomers: existingCustomers,
        googleReviewsVisited,
        feedbackReceived,
        avgFeedbackRating,
        loyaltyPointsEarned,
        loyaltyPointsRedeemed: 0,
        recentInvoices,
        recent_invoices: recentInvoices,
        metrics: {
          total_invoices: totalInvoices,
          total_revenue: roundedRevenue,
          new_revenue: Math.round(newRevenue),
          repeat_revenue: Math.round(repeatRevenue),
          total_customers: uniqueCustomers,
          returning_customers: existingCustomers
        }
      }
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
};
