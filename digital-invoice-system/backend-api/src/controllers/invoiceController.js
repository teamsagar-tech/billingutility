const crypto = require('crypto');
const db = require('../config/database');
const redis = require('../config/redis');

// Generate a random 8-character base62 string
const generateShortId = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
};

exports.uploadInvoice = async (req, res) => {
  try {
    const { receiptData } = req.body; 
    const tenantId = req.tenantId; // Injected by requireApiToken middleware

    if (!receiptData || !receiptData.customerPhone) {
      return res.status(400).json({ success: false, error: 'Missing receipt data or customer phone' });
    }

    const shortId = generateShortId();
    const customerPhone = receiptData.customerPhone;
    const referralCode = req.body.referralCode || receiptData.referralCode; // The phone number of the referrer
    const billAmountRaw = receiptData.billAmount || receiptData.BillTotal || 0;
    const billAmount = parseFloat(billAmountRaw);
    
    // Check if customer is new
    const [existingCust] = await db.query('SELECT id FROM customers WHERE tenant_id = ? AND phone = ?', [tenantId, customerPhone]);
    const isNewCustomer = existingCust.length === 0;

    // Fetch Dynamic Loyalty Settings
    const [loyaltyRows] = await db.query('SELECT rupees_per_point, is_active FROM loyalty_settings WHERE tenant_id = ?', [tenantId]);
    const rpp = loyaltyRows.length > 0 ? loyaltyRows[0].rupees_per_point : 100;
    const isLoyaltyActive = loyaltyRows.length > 0 ? loyaltyRows[0].is_active : true;

    // Loyalty Engine
    let pointsEarned = isLoyaltyActive ? Math.floor(billAmount / rpp) : 0;

    // Referral Engine Logic
    if (isNewCustomer && referralCode && referralCode !== customerPhone) {
      const [refSettings] = await db.query('SELECT * FROM referral_settings WHERE tenant_id = ? AND is_active = 1', [tenantId]);
      if (refSettings.length > 0) {
         const rewardPoints = refSettings[0].referrer_reward_points || 500;
         
         // Insert referral record
         await db.query(
            'INSERT INTO referrals (tenant_id, referrer_phone, referee_phone, status) VALUES (?, ?, ?, ?)',
            [tenantId, referralCode, customerPhone, 'converted']
         );

         // Reward the referrer (add loyalty points)
         await db.query(
            'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE tenant_id = ? AND phone = ?',
            [rewardPoints, tenantId, referralCode]
         );
      }
    }

    // 1. Save metadata to MySQL linked to Tenant
    await db.query(
      'INSERT INTO invoices (tenant_id, short_id, customer_phone, receipt_json) VALUES (?, ?, ?, ?)',
      [tenantId, shortId, customerPhone, JSON.stringify(receiptData)]
    );

    // 2. Upsert Customer Profile (CRM)
    await db.query(
      `INSERT INTO customers (tenant_id, phone, total_spent, loyalty_points) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       total_spent = total_spent + VALUES(total_spent), 
       loyalty_points = loyalty_points + VALUES(loyalty_points), 
       last_visit = CURRENT_TIMESTAMP`,
      [tenantId, customerPhone, billAmount, pointsEarned]
    );

    // 3. Get updated loyalty balance
    const [custRows] = await db.query('SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?', [tenantId, customerPhone]);
    const totalPoints = custRows[0]?.loyalty_points || pointsEarned;

    const invoicePayload = {
      shortId,
      receiptData,
      loyalty: {
        earned: pointsEarned,
        balance: totalPoints
      },
      createdAt: new Date().toISOString()
    };

    // Cache the data in Redis for fast retrieval
    await redis.setex(`invoice:${shortId}`, 86400, JSON.stringify(invoicePayload));

    // 2. Fetch Tenant WABA Credentials
    const [tenants] = await db.query('SELECT waba_access_token, phone_number_id, waba_provider FROM tenants WHERE id = ?', [tenantId]);
    const baseUrl = process.env.APP_URL || 'https://bill.retailnode.in';
    const receiptUrl = `${baseUrl}/i/${shortId}`;

    if (tenants.length > 0 && tenants[0].waba_access_token) {
       const { waba_access_token, phone_number_id, waba_provider } = tenants[0];
       
       // Send WhatsApp message
       try {
         if (waba_provider === 'waba_custom' || !phone_number_id) {
           // WABA Custom Gateway (e.g. waba.mpocket.in)
           await fetch('https://waba.mpocket.in/messages', {
             method: 'POST',
             headers: {
               'Authorization': `Bearer ${waba_access_token}`,
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               messaging_product: "whatsapp",
               to: customerPhone,
               type: "text",
               text: { body: `Thank you for shopping at *${receiptData.StoreName || 'RetailNode'}*!\n\nYour digital bill for *₹${billAmount.toFixed(2)}* is ready.\n\nView and download your receipt here:\n${receiptUrl}` }
             })
           });
         } else {
           // Meta WhatsApp Cloud API (Graph API)
           await fetch(`https://graph.facebook.com/v20.0/${phone_number_id}/messages`, {
             method: 'POST',
             headers: {
               'Authorization': `Bearer ${waba_access_token}`,
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               messaging_product: "whatsapp",
               to: customerPhone,
               type: "text",
               text: { body: `Thank you for shopping at *${receiptData.StoreName || 'RetailNode'}*!\n\nYour digital bill for *₹${billAmount.toFixed(2)}* is ready.\n\nView and download your receipt here:\n${receiptUrl}` }
             })
           });
         }
       } catch (waErr) {
         console.error('Failed to send WhatsApp:', waErr);
       }
    }

    res.status(201).json({
      success: true,
      message: 'Invoice uploaded successfully',
      data: { shortId, url: receiptUrl }
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Fetch the primary invoice from MySQL
    const [invRows] = await db.query(
      'SELECT tenant_id, customer_phone, receipt_json, created_at FROM invoices WHERE short_id = ?',
      [slug]
    );

    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const primaryInvoice = invRows[0];
    const tenantId = primaryInvoice.tenant_id;
    const customerPhone = primaryInvoice.customer_phone;
    
    let receiptData = {};
    try {
      receiptData = typeof primaryInvoice.receipt_json === 'string' 
        ? JSON.parse(primaryInvoice.receipt_json) 
        : primaryInvoice.receipt_json;
    } catch (e) {
      console.error('Failed to parse receipt json');
    }

    // 2. Fetch the customer's loyalty balance
    const [custRows] = await db.query(
      'SELECT loyalty_points FROM customers WHERE tenant_id = ? AND phone = ?',
      [tenantId, customerPhone]
    );
    const totalPoints = custRows[0]?.loyalty_points || 0;

    // 3. Fetch History (Previous Bills for this customer)
    const [historyRows] = await db.query(
      'SELECT short_id, created_at FROM invoices WHERE tenant_id = ? AND customer_phone = ? AND short_id != ? ORDER BY created_at DESC LIMIT 10',
      [tenantId, customerPhone, slug]
    );

    const history = historyRows.map(row => ({
      shortId: row.short_id,
      date: row.created_at
    }));

    // 4. Fetch Tenant Profile (Social links, logo, website, feedback setting)
    const [tenantRows] = await db.query(
      'SELECT store_name, logo_url, instagram_url, facebook_url, google_review_url, website_url, feedback_enabled FROM tenants WHERE id = ?',
      [tenantId]
    );
    const tenantProfile = tenantRows[0] || {};

    res.status(200).json({
      success: true,
      data: {
        shortId: slug,
        receiptData,
        loyalty: { balance: totalPoints },
        createdAt: primaryInvoice.created_at,
        history,
        tenantProfile
      }
    });
  } catch (error) {
    console.error('Retrieval Error:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
