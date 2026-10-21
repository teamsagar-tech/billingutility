const axios = require('axios');
const db = require('../config/database');
const redis = require('../config/redis');
const { dispatchInvoiceBill, checkConversationWindow } = require('../services/wabaClient');

const WABA_BASE_URL = process.env.WABA_BASE_URL || 'https://waba.mpocket.in';

exports.getWabaSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT 
        waba_provider,
        waba_access_token, 
        phone_number_id,
        waba_template_name,
        bill_dispatch_format,
        pdf_template_name,
        image_template_name,
        custom_bill_image_url
       FROM tenants WHERE id = ?`,
      [tenantId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    const row = rows[0];
    res.status(200).json({
      success: true,
      data: {
        waba_provider: row.waba_provider || 'waba_custom',
        waba_access_token: row.waba_access_token || '',
        phone_number_id: row.phone_number_id || '',
        waba_template_name: row.waba_template_name || 'retailnode_consultation_v2',
        bill_dispatch_format: row.bill_dispatch_format || 'template_pdf',
        pdf_template_name: row.pdf_template_name || 'billing_pdf_receipt',
        image_template_name: row.image_template_name || 'invoice_sample',
        custom_bill_image_url: row.custom_bill_image_url || ''
      }
    });
  } catch (error) {
    console.error('Error fetching WABA settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch WABA settings' });
  }
};

exports.updateWabaSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      waba_provider,
      waba_access_token, 
      phone_number_id,
      waba_template_name,
      bill_dispatch_format,
      pdf_template_name,
      image_template_name,
      custom_bill_image_url
    } = req.body;

    const validFormats = ['template_pdf', 'template_image', 'template_text', 'text_link'];
    const chosenFormat = validFormats.includes(bill_dispatch_format) ? bill_dispatch_format : 'template_pdf';

    await db.query(
      `UPDATE tenants 
       SET 
         waba_provider = COALESCE(?, waba_provider),
         waba_access_token = ?, 
         phone_number_id = ?,
         waba_template_name = COALESCE(?, waba_template_name),
         bill_dispatch_format = ?,
         pdf_template_name = COALESCE(?, pdf_template_name),
         image_template_name = COALESCE(?, image_template_name),
         custom_bill_image_url = ?
       WHERE id = ?`,
      [
        waba_provider || 'waba_custom',
        waba_access_token ? waba_access_token.trim() : null, 
        phone_number_id ? phone_number_id.trim() : null,
        waba_template_name ? waba_template_name.trim() : null,
        chosenFormat,
        pdf_template_name ? pdf_template_name.trim() : 'billing_pdf_receipt',
        image_template_name ? image_template_name.trim() : 'invoice_sample',
        custom_bill_image_url ? custom_bill_image_url.trim() : null,
        tenantId
      ]
    );

    // Invalidate Redis caches so new credentials and format take effect immediately
    try {
      await redis.del(`tenant:profile:${tenantId}`);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: 'WhatsApp billing message settings saved successfully'
    });
  } catch (error) {
    console.error('Error updating WABA settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update WABA settings' });
  }
};

exports.getWabaLogs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT 
        bm.id,
        bm.invoice_id,
        i.short_id,
        bm.customer_phone,
        bm.gateway,
        bm.dispatch_format,
        bm.template_name,
        bm.message_id,
        bm.status,
        bm.error_reason,
        bm.sent_at
       FROM billing_messages bm
       LEFT JOIN invoices i ON bm.invoice_id = i.id
       WHERE bm.tenant_id = ?
       ORDER BY bm.id DESC
       LIMIT 100`,
      [tenantId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching WABA logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch WhatsApp logs' });
  }
};

exports.simulateWebhookStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { status = 'read', messageId } = req.body;
    let targetId = messageId;

    if (!targetId) {
      const [latest] = await db.query(
        'SELECT message_id FROM billing_messages WHERE tenant_id = ? ORDER BY id DESC LIMIT 1',
        [tenantId]
      );
      if (latest.length > 0) {
        targetId = latest[0].message_id;
      }
    }

    if (!targetId) {
      return res.status(400).json({ success: false, error: 'No recent billing message found to test' });
    }

    const validStatuses = ['sent', 'delivered', 'read', 'failed'];
    const normStatus = validStatuses.includes(status) ? status : 'read';

    await db.query(
      `UPDATE billing_messages 
       SET status = ?, 
           error_reason = ? 
       WHERE message_id = ? AND tenant_id = ?`,
      [normStatus, normStatus === 'failed' ? 'Simulated delivery failure' : null, targetId, tenantId]
    );

    try {
      await redis.del(`store:waba_logs:${tenantId}`);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Simulated status updated to '${normStatus}' on message ${targetId}`,
      messageId: targetId,
      status: normStatus
    });
  } catch (err) {
    console.error('Error in simulateWebhookStatus:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.sendTestWhatsAppMessage = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { phone } = req.body;
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '8857808284';
    const targetPhone = cleanPhone || '8857808284';

    const [tenantRows] = await db.query(
      'SELECT store_name, bill_dispatch_format, waba_provider, phone_number_id, waba_template_name FROM tenants WHERE id = ?',
      [tenantId]
    );
    const tenant = tenantRows[0] || {};
    const storeName = tenant.store_name || 'RetailNode Store';

    // Fetch latest invoice for this tenant to provide realistic test content, or generate mock
    const [latestInvoices] = await db.query(
      'SELECT id, short_id, receipt_json FROM invoices WHERE tenant_id = ? ORDER BY id DESC LIMIT 1',
      [tenantId]
    );

    let testShortId = 'test_' + Math.floor(1000 + Math.random() * 9000);
    let sampleReceipt = {
      StoreName: storeName,
      InvoiceNumber: 'DEMO-' + Date.now().toString().slice(-4),
      Date: new Date().toISOString(),
      customerPhone: targetPhone,
      BillTotal: '1299.00',
      Items: [{ Name: 'Sample Retail Product', Qty: 1, Rate: 1299, Amount: 1299 }]
    };
    let invoiceId = null;

    if (latestInvoices.length > 0) {
      testShortId = latestInvoices[0].short_id;
      invoiceId = latestInvoices[0].id;
      try {
        const parsed = JSON.parse(latestInvoices[0].receipt_json);
        sampleReceipt = { ...parsed, customerPhone: targetPhone };
      } catch (e) {}
    }

    const result = await dispatchInvoiceBill({
      tenantId,
      invoiceId,
      shortId: testShortId,
      customerPhone: targetPhone,
      customerName: sampleReceipt.CustomerName || sampleReceipt.customerName || 'Test Customer',
      billAmount: parseFloat(sampleReceipt.BillTotal || sampleReceipt.billAmount || 1299),
      invoiceNumber: sampleReceipt.InvoiceNumber || sampleReceipt.invoiceNumber || 'DEMO-1001',
      storeName,
      receiptData: sampleReceipt
    });

    try {
      await redis.del(`store:waba_logs:${tenantId}`);
    } catch (e) {}

    res.status(200).json({
      success: true,
      message: `Test bill message dispatched to WhatsApp (+91 ${targetPhone})!`,
      format: tenant.bill_dispatch_format || 'template_pdf',
      result
    });
  } catch (error) {
    console.error('Error dispatching test WhatsApp message:', error);
    res.status(500).json({ success: false, error: 'Failed to dispatch test WhatsApp message: ' + error.message });
  }
};

exports.checkConversationWindowStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const phone = req.query.phone || req.body?.phone || '8857808284';
    const result = await checkConversationWindow({ tenantId, phone });
    res.status(200).json(result);
  } catch (error) {
    console.error('Error checking conversation window:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Deploy Pre-defined Utility Templates for Store
exports.deployUtilityTemplates = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [tenants] = await db.query(
      `SELECT phone_number_id, waba_access_token, store_name, store_phone FROM tenants WHERE id = ?`,
      [tenantId]
    );

    if (tenants.length === 0) {
      return res.status(404).json({ success: false, error: 'Tenant not found' });
    }

    const t = tenants[0];
    const identifier = req.body.phone_number_id || t.phone_number_id || process.env.DEFAULT_WABA_PHONE_NUMBER_ID || '361462453714220';
    const store_name = req.body.store_name || t.store_name || 'Retail Store';
    const store_phone = req.body.store_phone || t.store_phone || '+91 8857808284';
    const custom_prefix = req.body.custom_prefix || 'retailnode';
    const footer_text = req.body.footer_text || 'Powered by RetailNode';
    const types = Array.isArray(req.body.types) && req.body.types.length > 0 
      ? req.body.types 
      : ['invoice_pdf', 'invoice_image', 'invoice_summary', 'loyalty_update'];

    const response = await axios.post(`${WABA_BASE_URL}/api/tenant/templates/deploy-retailnode-utility`, {
      identifier: identifier.trim(),
      store_name: store_name.trim(),
      store_phone: store_phone.trim(),
      custom_prefix: custom_prefix.trim().toLowerCase(),
      footer_text: footer_text.trim(),
      types
    }, { timeout: 25000 });

    const templates = response.data?.templates || [];

    // Automatically update tenant's configured templates if matching ones were processed
    const pdfTpl = templates.find(tpl => tpl.type === 'invoice_pdf');
    const imgTpl = templates.find(tpl => tpl.type === 'invoice_image');

    const updateFields = [];
    const updateParams = [];

    if (pdfTpl && pdfTpl.name) {
      updateFields.push('pdf_template_name = ?');
      updateParams.push(pdfTpl.name);
    }
    if (imgTpl && imgTpl.name) {
      updateFields.push('image_template_name = ?');
      updateParams.push(imgTpl.name);
    }

    if (updateFields.length > 0) {
      updateParams.push(tenantId);
      await db.query(`UPDATE tenants SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);
      try {
        await redis.del(`tenant:profile:${tenantId}`);
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: 'Pre-defined utility templates deployed and synced successfully!',
      templates
    });
  } catch (error) {
    console.error('Error deploying utility templates:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to deploy utility templates' 
    });
  }
};

// Get Live Utility Template Statuses from WABA
exports.getTemplateStatuses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [tenants] = await db.query(
      `SELECT phone_number_id, pdf_template_name, image_template_name, waba_template_name FROM tenants WHERE id = ?`,
      [tenantId]
    );

    const t = tenants[0] || {};
    const identifier = req.query.phone_number_id || t.phone_number_id || process.env.DEFAULT_WABA_PHONE_NUMBER_ID || '361462453714220';
    
    const response = await axios.get(`${WABA_BASE_URL}/api/tenant/templates/retailnode-status`, {
      params: { identifier: identifier.trim() },
      timeout: 15000
    });

    const allTemplates = response.data?.templates || [];
    
    // Highlight relevant utility templates
    const trackedNames = [
      t.pdf_template_name || 'retailnode_invoice_pdf',
      t.image_template_name || 'retailnode_invoice_image',
      t.waba_template_name || 'retailnode_consultation_v2',
      'retailnode_invoice_pdf',
      'retailnode_invoice_image',
      'retailnode_invoice_summary',
      'retailnode_loyalty_update',
      'invoice_sample'
    ];

    const utilityTemplates = allTemplates.filter(tpl => 
      trackedNames.includes(tpl.name) || tpl.name.includes('invoice') || tpl.name.includes('loyalty') || tpl.name.includes('retailnode')
    );

    res.status(200).json({
      success: true,
      templates: allTemplates,
      utility_templates: utilityTemplates,
      raw_count: allTemplates.length
    });
  } catch (error) {
    console.error('Error fetching template statuses:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error || error.message || 'Failed to fetch template statuses' 
    });
  }
};

// Create Custom Template on Meta WhatsApp Cloud API
exports.createCustomTemplate = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [tenants] = await db.query(
      `SELECT phone_number_id, waba_access_token FROM tenants WHERE id = ?`,
      [tenantId]
    );

    const t = tenants[0] || {};
    const identifier = req.body.phone_number_id || t.phone_number_id || process.env.DEFAULT_WABA_PHONE_NUMBER_ID || '361462453714220';
    const { name, category, language, components } = req.body;

    if (!name || !category || !components) {
      return res.status(400).json({ success: false, error: 'Template name, category, and components are required' });
    }

    const response = await axios.post(`${WABA_BASE_URL}/api/tenant/templates/create-custom`, {
      identifier: identifier.trim(),
      name: name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      category: category.toUpperCase(),
      language: language || 'en',
      components
    }, { timeout: 25000 });

    res.status(201).json({
      success: true,
      message: 'Template submitted to Meta for review successfully!',
      template: response.data?.template || response.data
    });
  } catch (error) {
    console.error('Error creating custom template:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error || error.message || 'Failed to submit template to Meta'
    });
  }
};


