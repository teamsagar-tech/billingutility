const db = require('../config/database');

/**
 * GET /api/v1/auth/customers
 * Returns all customers for the tenant with full demographics, dormancy, visits, and RFM intelligence
 */
exports.getCustomers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    // 1. Fetch all customer records from customers table
    const [customerRows] = await db.query(
      `SELECT * FROM customers WHERE tenant_id = ?`,
      [tenantId]
    );

    // 2. Fetch invoices for this tenant to aggregate rich customer metrics
    const [invoiceRows] = await db.query(
      `SELECT id, short_id, customer_phone, receipt_json, created_at 
       FROM invoices 
       WHERE tenant_id = ? AND customer_phone IS NOT NULL AND customer_phone != ''
       ORDER BY created_at DESC`,
      [tenantId]
    );

    const invoiceMap = {};
    invoiceRows.forEach(inv => {
      const phone = inv.customer_phone;
      let rJson = {};
      try {
        rJson = typeof inv.receipt_json === 'string' ? JSON.parse(inv.receipt_json) : (inv.receipt_json || {});
      } catch (e) {}

      const amt = parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || rJson.grandTotal || 0);
      const invNum = rJson.InvoiceNumber || rJson.invoice_number || rJson.InvoiceNo || inv.short_id;
      const custName = rJson.CustomerName || rJson.customerName || rJson.customer_name || '';

      if (!invoiceMap[phone]) {
        invoiceMap[phone] = {
          visit_count: 1,
          total_spent: amt,
          max_bill_amount: amt,
          last_bill_date: inv.created_at,
          last_bill_value: amt,
          customer_name: custName
        };
      } else {
        invoiceMap[phone].visit_count += 1;
        invoiceMap[phone].total_spent += amt;
        if (amt > invoiceMap[phone].max_bill_amount) {
          invoiceMap[phone].max_bill_amount = amt;
        }
        if (!invoiceMap[phone].customer_name && custName) {
          invoiceMap[phone].customer_name = custName;
        }
      }
    });

    // 3. Create merged customer profiles
    const customerMap = {};

    // First populate from customers table
    customerRows.forEach(c => {
      const inv = invoiceMap[c.phone] || {
        visit_count: 0,
        total_spent: parseFloat(c.total_spent) || 0,
        max_bill_amount: 0,
        last_bill_date: c.last_visit,
        last_bill_value: 0
      };

      customerMap[c.phone] = {
        id: c.id,
        phone: c.phone,
        customer_name: c.customer_name || 'Valued Customer',
        email: c.email || '',
        dob: c.dob || null,
        anniversary_date: c.anniversary_date || null,
        gender: c.gender || 'm',
        marital_status: c.marital_status || 'u',
        profession: c.profession || '',
        shopping_frequency: c.shopping_frequency || '',
        state: c.state || '',
        city: c.city || '',
        spouse_name: c.spouse_name || '',
        spouse_mobile: c.spouse_mobile || '',
        spouse_dob: c.spouse_dob || null,
        child_name: c.child_name || '',
        child_dob: c.child_dob || null,
        profile_status: c.profile_status || (c.dob || c.email ? 'complete' : 'incomplete'),
        opted_out_whatsapp: Boolean(c.opted_out_whatsapp),
        opted_out_sms: Boolean(c.opted_out_sms),
        consent_given: Boolean(c.consent_given),
        loyalty_points: parseInt(c.loyalty_points) || 0,
        points_earned: Math.round((inv.total_spent || c.total_spent || 0) / 100),
        points_redeemed: 0,
        no_of_visits: Math.max(inv.visit_count, 1),
        lifetime_value: Math.max(inv.total_spent, parseFloat(c.total_spent) || 0),
        last_bill_value: inv.last_bill_value || inv.total_spent || 0,
        last_bill_date: inv.last_bill_date || c.last_visit || c.created_at,
        max_bill_amount: inv.max_bill_amount || inv.last_bill_value || 0
      };
    });

    // Also include any phones from invoices that weren't in customers table yet
    Object.keys(invoiceMap).forEach(phone => {
      if (!customerMap[phone]) {
        const inv = invoiceMap[phone];
        customerMap[phone] = {
          id: null,
          phone: phone,
          customer_name: 'Valued Customer',
          email: '',
          dob: null,
          anniversary_date: null,
          gender: 'm',
          marital_status: 'u',
          profession: '',
          shopping_frequency: '',
          state: '',
          city: '',
          spouse_name: '',
          spouse_mobile: '',
          spouse_dob: null,
          child_name: '',
          child_dob: null,
          profile_status: 'not_exist',
          opted_out_whatsapp: false,
          opted_out_sms: false,
          consent_given: true,
          loyalty_points: 0,
          points_earned: Math.round(inv.total_spent / 100),
          points_redeemed: 0,
          no_of_visits: inv.visit_count,
          lifetime_value: inv.total_spent,
          last_bill_value: inv.last_bill_value,
          last_bill_date: inv.last_bill_date,
          max_bill_amount: inv.max_bill_amount
        };
      }
    });

    const now = Date.now();
    const today = new Date();

    // Insight Counters
    const insights = {
      all: 0,
      active_3m: 0,
      dormant_3_6m: 0,
      dormant_6_12m: 0,
      dormant_12p_m: 0,
      visits: {
        v1: 0,
        v2: 0,
        v3: 0,
        v4: 0,
        v5_plus: 0,
        v10_plus: 0
      },
      upcoming_birthdays: 0,
      upcoming_anniversaries: 0,
      rfm: {
        vip: 0,
        loyal: 0,
        promising: 0,
        atRisk: 0,
        dormant: 0
      }
    };

    const customerList = Object.values(customerMap).map((c, idx) => {
      const avgTrx = c.no_of_visits > 0 ? (c.lifetime_value / c.no_of_visits) : 0;
      const lastDate = c.last_bill_date ? new Date(c.last_bill_date).getTime() : now;
      const recencyDays = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));

      // Dormancy Calculation
      let dormancy = 'active_3m';
      if (recencyDays <= 90) {
        dormancy = 'active_3m';
        insights.active_3m += 1;
      } else if (recencyDays <= 180) {
        dormancy = 'dormant_3_6m';
        insights.dormant_3_6m += 1;
      } else if (recencyDays <= 365) {
        dormancy = 'dormant_6_12m';
        insights.dormant_6_12m += 1;
      } else {
        dormancy = 'dormant_12p_m';
        insights.dormant_12p_m += 1;
      }
      insights.all += 1;

      // Visit Frequency Buckets
      if (c.no_of_visits === 1) insights.visits.v1 += 1;
      else if (c.no_of_visits === 2) insights.visits.v2 += 1;
      else if (c.no_of_visits === 3) insights.visits.v3 += 1;
      else if (c.no_of_visits === 4) insights.visits.v4 += 1;
      else if (c.no_of_visits >= 10) insights.visits.v10_plus += 1;
      else if (c.no_of_visits >= 5) insights.visits.v5_plus += 1;

      // Birthday / Anniversary checks (within next 30 days)
      let isBirthdayUpcoming = false;
      if (c.dob) {
        const bDate = new Date(c.dob);
        const nextBday = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
        if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
        const daysDiff = Math.ceil((nextBday - today) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 30) {
          isBirthdayUpcoming = true;
          insights.upcoming_birthdays += 1;
        }
      }

      let isAnniversaryUpcoming = false;
      if (c.anniversary_date) {
        const aDate = new Date(c.anniversary_date);
        const nextAnniv = new Date(today.getFullYear(), aDate.getMonth(), aDate.getDate());
        if (nextAnniv < today) nextAnniv.setFullYear(today.getFullYear() + 1);
        const daysDiff = Math.ceil((nextAnniv - today) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 30) {
          isAnniversaryUpcoming = true;
          insights.upcoming_anniversaries += 1;
        }
      }

      // RFM Cohort
      let cohort = 'Promising New';
      let action = 'Send 10% 2nd Visit Welcome Reward';
      let churn = 'Low';

      if (c.lifetime_value >= 5000 && recencyDays <= 45) {
        cohort = 'VIP Champion';
        action = 'Send Exclusive VIP Paithani Preview (WhatsApp)';
        churn = 'Low';
        insights.rfm.vip += 1;
      } else if (c.no_of_visits >= 3 && recencyDays <= 60) {
        cohort = 'Loyal Regular';
        action = 'Send Double Loyalty Points Pass';
        churn = 'Low';
        insights.rfm.loyal += 1;
      } else if (recencyDays > 90) {
        cohort = 'Lost / Dormant';
        action = 'Clearance Deep Discount Voucher';
        churn = 'High';
        insights.rfm.dormant += 1;
      } else if (c.no_of_visits >= 2 && recencyDays > 45) {
        cohort = 'At Risk (Slipping)';
        action = 'Send ₹200 Win-Back Saree Voucher';
        churn = 'Medium';
        insights.rfm.atRisk += 1;
      } else {
        cohort = 'Promising New';
        action = 'Send Welcome Reward & Feedback Prompt';
        churn = 'Low';
        insights.rfm.promising += 1;
      }

      return {
        ...c,
        id: c.id || idx + 1,
        avg_trx_value: Math.round(avgTrx),
        lifetime_value: Math.round(c.lifetime_value),
        total_spent: Math.round(c.lifetime_value),
        last_bill_value: Math.round(c.last_bill_value),
        last_bill_amount: Math.round(c.last_bill_value),
        last_visit: c.last_bill_date,
        max_bill_amount: Math.round(c.max_bill_amount),
        max_bill_value: Math.round(c.max_bill_amount),
        no_of_visits: c.no_of_visits,
        visits_count: c.no_of_visits,
        dormancy,
        dormancy_bucket: dormancy,
        recency_days: recencyDays,
        rfm_cohort: cohort,
        cohort: cohort,
        churn_risk: churn,
        recommended_action: action,
        is_birthday_upcoming: isBirthdayUpcoming,
        is_anniversary_upcoming: isAnniversaryUpcoming
      };
    }).sort((a, b) => b.lifetime_value - a.lifetime_value);

    res.status(200).json({
      success: true,
      insights,
      data: customerList
    });
  } catch (error) {
    console.error('CRM Get Customers Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer data' });
  }
};

/**
 * POST /api/v1/auth/customers/profile
 * Create or update rich customer profile (Name, DOB, Anniversary, Spouse, DPDP Consent)
 */
exports.saveCustomerProfile = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      phone,
      customer_name,
      email,
      dob,
      anniversary_date,
      gender,
      marital_status,
      profession,
      shopping_frequency,
      state,
      city,
      spouse_name,
      spouse_mobile,
      spouse_dob,
      child_name,
      child_dob,
      consent_given
    } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    const cleanPhone = phone.trim();
    const status = (customer_name && dob && email) ? 'complete' : (customer_name || email ? 'incomplete' : 'not_exist');

    // Upsert into customers table
    const [result] = await db.query(
      `INSERT INTO customers (
         tenant_id, phone, customer_name, email, dob, anniversary_date,
         gender, marital_status, profession, shopping_frequency, state, city,
         spouse_name, spouse_mobile, spouse_dob, child_name, child_dob,
         profile_status, consent_given
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         customer_name = VALUES(customer_name),
         email = VALUES(email),
         dob = VALUES(dob),
         anniversary_date = VALUES(anniversary_date),
         gender = VALUES(gender),
         marital_status = VALUES(marital_status),
         profession = VALUES(profession),
         shopping_frequency = VALUES(shopping_frequency),
         state = VALUES(state),
         city = VALUES(city),
         spouse_name = VALUES(spouse_name),
         spouse_mobile = VALUES(spouse_mobile),
         spouse_dob = VALUES(spouse_dob),
         child_name = VALUES(child_name),
         child_dob = VALUES(child_dob),
         profile_status = VALUES(profile_status),
         consent_given = VALUES(consent_given)`,
      [
        tenantId, cleanPhone, customer_name || null, email || null, dob || null, anniversary_date || null,
        gender || 'm', marital_status || 'u', profession || null, shopping_frequency || null, state || null, city || null,
        spouse_name || null, spouse_mobile || null, spouse_dob || null, child_name || null, child_dob || null,
        status, consent_given !== false ? 1 : 0
      ]
    );

    res.status(200).json({
      success: true,
      message: 'Customer profile saved successfully',
      data: { phone: cleanPhone, profile_status: status }
    });
  } catch (error) {
    console.error('Save Customer Profile Error:', error);
    res.status(500).json({ success: false, error: 'Failed to save customer profile' });
  }
};

/**
 * GET /api/v1/auth/customers/:phone/journey
 * Complete historical interaction journey for a customer
 */
exports.getCustomerJourney = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone parameter required' });
    }

    // 1. Fetch customer demographic record
    const rawPhone = String(req.params.phone || '').trim();
    const last10 = rawPhone.replace(/\D/g, '').slice(-10);
    const with91 = '91' + last10;

    // 1. Fetch customer profile (match last 10 or 91+10)
    const [custRows] = await db.query(
      `SELECT * FROM customers WHERE tenant_id = ? AND (phone = ? OR phone = ? OR phone LIKE ?) LIMIT 1`,
      [tenantId, last10, with91, `%${last10}`]
    );
    const profile = custRows[0] || { phone: rawPhone, customer_name: 'Valued Customer', loyalty_points: 0 };

    // 2. Fetch all invoices
    const [invoices] = await db.query(
      `SELECT id, short_id, receipt_json, file_url, created_at
       FROM invoices
       WHERE tenant_id = ? AND (customer_phone = ? OR customer_phone = ? OR customer_phone LIKE ?)
       ORDER BY created_at DESC`,
      [tenantId, last10, with91, `%${last10}`]
    );

    // 3. Fetch messaging dispatches
    const [messages] = await db.query(
      `SELECT id, gateway, template_name, status, error_reason, sent_at as created_at
       FROM billing_messages
       WHERE tenant_id = ? AND (customer_phone = ? OR customer_phone = ? OR customer_phone LIKE ?)
       ORDER BY sent_at DESC`,
      [tenantId, last10, with91, `%${last10}`]
    );

    // 4. Fetch feedback
    const [feedback] = await db.query(
      `SELECT id, invoice_number, rating, comment, resolution_status, created_at
       FROM customer_feedback
       WHERE tenant_id = ? AND (customer_phone = ? OR customer_phone = ? OR customer_phone LIKE ?)
       ORDER BY created_at DESC`,
      [tenantId, last10, with91, `%${last10}`]
    );

    // 5. Fetch action logs (review clicks, referral shares)
    const [actions] = await db.query(
      `SELECT id, short_id, action_type, metadata, created_at
       FROM action_logs
       WHERE tenant_id = ? AND (customer_phone = ? OR customer_phone = ? OR customer_phone LIKE ?)
       ORDER BY created_at DESC`,
      [tenantId, last10, with91, `%${last10}`]
    );

    // Build timeline events
    const timeline = [];
    let lifetimeSpend = 0;

    invoices.forEach(inv => {
      let rJson = {};
      try {
        rJson = typeof inv.receipt_json === 'string' ? JSON.parse(inv.receipt_json) : (inv.receipt_json || {});
      } catch (e) {}

      const billAmt = parseFloat(rJson.BillTotal || rJson.billAmount || rJson.totalAmount || rJson.Total || 0);
      const invNum = rJson.InvoiceNumber || rJson.invoice_number || rJson.InvoiceNo || inv.short_id;
      lifetimeSpend += billAmt;

      timeline.push({
        type: 'invoice',
        title: `Issued Invoice #${invNum}`,
        timestamp: inv.created_at,
        amount: billAmt,
        short_id: inv.short_id,
        items_count: (rJson.items || []).length || 1,
        details: `Digital Bill Total ₹${billAmt.toLocaleString('en-IN')}`
      });
    });

    messages.forEach(msg => {
      timeline.push({
        type: 'message',
        title: `WhatsApp Notification (${msg.status})`,
        timestamp: msg.created_at,
        gateway: msg.gateway,
        details: `Template: ${msg.template_name || 'billing_receipt'} • Gateway: ${msg.gateway}`
      });
    });

    feedback.forEach(fb => {
      timeline.push({
        type: 'feedback',
        title: `Customer Rated ${fb.rating}★`,
        timestamp: fb.created_at,
        rating: fb.rating,
        details: fb.comment ? `"${fb.comment}"` : 'Rating without comment'
      });
    });

    actions.forEach(act => {
      timeline.push({
        type: 'action',
        title: `Customer Action: ${act.action_type.replace(/_/g, ' ').toUpperCase()}`,
        timestamp: act.created_at,
        action: act.action_type
      });
    });

    // Sort timeline descending
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const responseData = {
      profile,
      summary: {
        total_invoices: invoices.length,
        lifetime_spend: lifetimeSpend,
        loyalty_points: profile.loyalty_points || 0,
        feedback_count: feedback.length,
        messages_sent: messages.length
      },
      timeline
    };

    res.status(200).json({
      success: true,
      data: responseData,
      profile,
      summary: responseData.summary,
      timeline
    });
  } catch (error) {
    console.error('Customer Journey Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer journey' });
  }
};

/**
 * GET /api/v1/auth/customers/optout
 * List all DND / opted-out customers
 */
exports.getOptoutCustomers = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT * FROM optout_customers WHERE tenant_id = ? ORDER BY created_at DESC`,
      [tenantId]
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Optout List Error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch optout list' });
  }
};

/**
 * POST /api/v1/auth/customers/optout
 * Add phone number to optout / DND
 */
exports.addOptoutCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { phone, channel, reason } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    const cleanPhone = phone.trim();
    await db.query(
      `INSERT INTO optout_customers (tenant_id, phone, channel, reason) VALUES (?, ?, ?, ?)`,
      [tenantId, cleanPhone, channel || 'whatsapp', reason || 'Customer requested DND']
    );

    // Also flag in customers table
    await db.query(
      `UPDATE customers SET opted_out_whatsapp = TRUE WHERE tenant_id = ? AND phone = ?`,
      [tenantId, cleanPhone]
    );

    res.status(200).json({ success: true, message: 'Customer added to optout list' });
  } catch (error) {
    console.error('Add Optout Error:', error);
    res.status(500).json({ success: false, error: 'Failed to add optout customer' });
  }
};

/**
 * DELETE /api/v1/auth/customers/optout/:id
 * Remove customer from optout list
 */
exports.removeOptoutCustomer = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT phone FROM optout_customers WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );

    if (rows.length > 0) {
      const phone = rows[0].phone;
      await db.query(`DELETE FROM optout_customers WHERE id = ? AND tenant_id = ?`, [id, tenantId]);
      await db.query(`UPDATE customers SET opted_out_whatsapp = FALSE WHERE tenant_id = ? AND phone = ?`, [tenantId, phone]);
    }

    res.status(200).json({ success: true, message: 'Removed from optout list' });
  } catch (error) {
    console.error('Remove Optout Error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove optout customer' });
  }
};
