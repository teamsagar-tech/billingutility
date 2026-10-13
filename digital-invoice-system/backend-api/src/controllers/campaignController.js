const db = require('../config/database');
const { createWabaCampaign, fetchCampaignReport, getWabaCredentials, normalizePhoneNumber } = require('../services/wabaClient');

/**
 * POST /api/v1/campaigns/create
 * Creates and dispatches a campaign (WhatsApp or SMS)
 */
exports.createCampaign = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const {
      title,
      campaignName,
      templateName,
      channel = 'whatsapp',
      audience = 'all',
      messageText = '',
      schedule = 'now',
      couponCode = null,
      bonusPoints = 0
    } = req.body;

    const actualTitle = (title || campaignName || 'Promotional Campaign').trim();

    // 1. Fetch targeted customer recipients from database
    let customerQuery = 'SELECT customer_name, phone, total_spent FROM customers WHERE tenant_id = ?';
    const params = [tenantId];

    if (channel === 'whatsapp') {
      customerQuery += ' AND opted_out_whatsapp = 0';
    } else {
      customerQuery += ' AND opted_out_sms = 0';
    }

    if (audience === 'repeat') {
      customerQuery += ' AND total_spent > 1500';
    } else if (audience === 'inactive') {
      customerQuery += ' AND last_visit < DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (audience === 'vip') {
      customerQuery += ' AND total_spent >= 3000';
    }

    const [customers] = await db.query(customerQuery, params);

    // If tenant has no customers in DB yet, generate targeted store audience
    let recipients = customers.map(c => ({
      name: c.customer_name || 'Valued Customer',
      phone_number: c.phone
    }));

    if (recipients.length === 0) {
      // Fallback to recent invoice customer numbers so campaign has active targets
      const [invoicePhones] = await db.query(
        'SELECT DISTINCT customer_phone, customer_name FROM invoices WHERE tenant_id = ? AND customer_phone IS NOT NULL LIMIT 50',
        [tenantId]
      );
      recipients = invoicePhones.map(i => ({
        name: i.customer_name || 'Valued Shopper',
        phone_number: i.customer_phone
      }));
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No eligible customer recipients found for the selected audience.'
      });
    }

    // 2. Dispatch Campaign via WABA Client
    const result = await createWabaCampaign({
      tenantId,
      campaignName: actualTitle,
      templateName,
      languageCode: 'en',
      rawData: recipients,
      schedule,
      messageText,
      channel
    });

    res.status(201).json({
      success: true,
      message: `Campaign "${actualTitle}" dispatched successfully to ${recipients.length} recipients via ${channel === 'whatsapp' ? 'WABA' : 'SMS'}!`,
      data: result
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ success: false, error: 'Failed to launch campaign' });
  }
};

/**
 * POST /api/v1/campaigns/send-sms
 * Direct SMS Campaign Dispatch
 */
exports.sendSmsCampaign = async (req, res) => {
  req.body.channel = 'sms';
  return exports.createCampaign(req, res);
};

/**
 * GET /api/v1/campaigns/list
 * Lists all active and past campaigns with delivery metrics
 */
exports.getCampaignsList = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [campaigns] = await db.query(
      `SELECT 
        id, waba_campaign_id, title, channel, audience, template_name, message_text,
        recipient_count, delivered_count, read_count, failed_count, cost, status, scheduled_at, created_at
       FROM campaigns 
       WHERE tenant_id = ? 
       ORDER BY created_at DESC`,
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Get campaigns list error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve campaigns' });
  }
};

/**
 * GET /api/v1/campaigns/report/:campaignId
 * Detailed sending report with individual recipient statuses
 */
exports.getCampaignReport = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { campaignId } = req.params;

    const report = await fetchCampaignReport({ tenantId, campaignId });
    if (!report.success) {
      return res.status(404).json(report);
    }

    res.status(200).json(report);
  } catch (error) {
    console.error('Get campaign report error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign report' });
  }
};

/**
 * GET /api/v1/campaigns/templates
 * Retrieves approved WABA templates for the store
 */
exports.getTemplates = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const creds = await getWabaCredentials(tenantId);

    // List approved templates
    const templates = [
      {
        name: creds.templateName || 'deepak_sarees_invoice',
        category: 'UTILITY',
        language: 'en',
        displayName: 'Billing & Digital Invoice Receipt (Interactive)'
      },
      {
        name: '2024_promo_1',
        category: 'MARKETING',
        language: 'mr',
        displayName: 'Festive & Promotional Broadcast (Discount Offer)'
      },
      {
        name: 'shahi_paithani_feb_2025',
        category: 'MARKETING',
        language: 'mr',
        displayName: 'New Arrivals & Paithani Collection Showcase'
      },
      {
        name: 'retailnode_consultation_v2',
        category: 'UTILITY',
        language: 'en',
        displayName: 'Customer Greeting & Milestone Engagement'
      }
    ];

    res.status(200).json({
      success: true,
      wabaProvider: 'waba_custom',
      isDefaultGateway: creds.isDefault,
      templates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve templates' });
  }
};
