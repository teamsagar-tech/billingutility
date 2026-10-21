const axios = require('axios');
const db = require('../config/database');
const { createWabaCampaign, fetchCampaignReport, getWabaCredentials, normalizePhoneNumber } = require('../services/wabaClient');

const WABA_BASE_URL = process.env.WABA_BASE_URL || 'https://waba.mpocket.in';

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
 * Retrieves approved WABA templates for the store dynamically from WABA setup
 */
exports.getTemplates = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const creds = await getWabaCredentials(tenantId);
    const identifier = creds.phoneNumberId || process.env.DEFAULT_WABA_PHONE_NUMBER_ID || '361462453714220';

    let templates = [];

    try {
      const response = await axios.get(`${WABA_BASE_URL}/api/tenant/templates/retailnode-status`, {
        params: { identifier: identifier.trim() },
        timeout: 15000
      });

      const rawTemplates = response.data?.templates || [];

      templates = rawTemplates.map(t => {
        const bodyComp = (t.components || []).find(c => c.type === 'BODY');
        const headerComp = (t.components || []).find(c => c.type === 'HEADER');
        const buttonsComp = (t.components || []).find(c => c.type === 'BUTTONS');

        return {
          id: t.id,
          name: t.name,
          category: t.category || 'UTILITY',
          language: t.language || 'en',
          status: t.status || 'APPROVED',
          displayName: `${t.name.replace(/_/g, ' ')} (${t.category} • ${t.language})`,
          bodyText: bodyComp?.text || '',
          headerFormat: headerComp?.format || null,
          buttons: buttonsComp?.buttons || [],
          components: t.components || []
        };
      });
    } catch (wabaErr) {
      console.warn('[CampaignController] Failed to fetch live templates from WABA:', wabaErr.message);
    }

    // Fallback if WABA call failed or returned empty
    if (templates.length === 0) {
      templates = [
        {
          name: creds.templateName || 'retailnode_bill_link_v1',
          category: 'UTILITY',
          language: 'en',
          status: 'APPROVED',
          displayName: 'Digital Invoice Link & Receipt (UTILITY • en)',
          bodyText: 'Dear customer, your digital bill is ready. Click link to view.'
        },
        {
          name: 'retailnode_loyalty_update',
          category: 'UTILITY',
          language: 'en',
          status: 'APPROVED',
          displayName: 'Loyalty Points Balance Update (UTILITY • en)',
          bodyText: 'Hello {{1}}, you earned {{2}} points. Total balance: {{3}}.'
        },
        {
          name: '2024_promo_1',
          category: 'MARKETING',
          language: 'mr',
          status: 'APPROVED',
          displayName: 'Festive & Promotional Broadcast (MARKETING • mr)',
          bodyText: 'Special festive discount offer.'
        }
      ];
    }

    res.status(200).json({
      success: true,
      wabaProvider: 'waba_custom',
      isDefaultGateway: creds.isDefault,
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error('[CampaignController] Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve templates' });
  }
};

