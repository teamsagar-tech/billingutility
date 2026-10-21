import axios from 'axios';

const GRAPH_API_BASE = process.env.GRAPH_API_BASE || 'https://graph.facebook.com';
const GRAPH_API_VERSION = process.env.GRAPH_API_VERSION || 'v20.0';

export function createSampleInvoicePdfBuffer() {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 55 >> stream
BT /F1 18 Tf 50 800 Td (TAX INVOICE - RETAILNODE) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000350 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
426
%%EOF`;
  return Buffer.from(content, 'utf-8');
}

export function createSampleInvoicePngBuffer() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x62, 0x8a, 0x53,
    0xdd, 0x00, 0x00, 0x00, 0x1a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x60, 0x18, 0x05, 0xa3,
    0x60, 0x14, 0x8c, 0x82, 0x51, 0x30, 0x0a, 0x18,
    0x05, 0xa3, 0x60, 0x14, 0x00, 0x00, 0x03, 0x10,
    0x00, 0x01, 0x54, 0x27, 0xec, 0xb8, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
    0x60, 0x82
  ]);
}

/**
 * Deploys pre-defined RetailNode Utility Templates to Meta WhatsApp Cloud API
 * Strictly returns public-safe template info (zero Meta tokens exposed).
 */
export async function deployRetailNodeUtilityTemplates({
  pool,
  identifier,
  store_name = 'Retail Store',
  store_phone = '+91 8857808284',
  custom_prefix = 'retailnode',
  footer_text = 'Powered by RetailNode',
  types = ['invoice_pdf', 'invoice_image', 'invoice_summary', 'loyalty_update'],
  uploadResumableMediaToMeta
}) {
  const [rows] = await pool.query(
    'SELECT id, token, app_id, whatsapp_business_account_id FROM phone_number_details WHERE id = ? OR whatsapp_business_account_id = ? LIMIT 1',
    [identifier, identifier]
  );

  if (!rows || rows.length === 0 || !rows[0].token) {
    throw new Error(`WABA account details not found for identifier: ${identifier}`);
  }

  const { id: phoneId, token: metaToken, app_id: appId, whatsapp_business_account_id: wabaId } = rows[0];
  const cleanPrefix = String(custom_prefix || 'retailnode').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const storeNameClean = String(store_name || 'Retail Store').trim();
  const storePhoneClean = String(store_phone || '+91 8857808284').trim();
  const footerTextClean = String(footer_text || 'Powered by RetailNode').trim();

  const results = [];

  // Helper: fetch all existing templates from Meta to avoid redundant creates
  let existingMetaTemplates = [];
  try {
    const listRes = await axios.get(
      `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates?limit=100`,
      { headers: { Authorization: `Bearer ${metaToken}` } }
    );
    existingMetaTemplates = listRes.data?.data || [];
  } catch (err) {
    console.warn('[RetailNode-Deployer] Warning fetching existing templates:', err.message);
  }

  // Helper to save or update template in waba_saas.message_templates
  async function syncLocalDb(name, status, category, metaId) {
    if (!metaId) return;
    try {
      await pool.query(
        `INSERT INTO message_templates (
          id, whatsapp_business_account_id, name, language, category, status, updated_at
        ) VALUES (?, ?, ?, 'en', ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
          status = VALUES(status), 
          category = VALUES(category),
          updated_at = NOW()`,
        [String(metaId), wabaId, name, category, status]
      );
    } catch (e) {
      console.warn('[RetailNode-Deployer] DB sync error:', e.message);
    }
  }

  // 1. Official Tax Invoice PDF (Document Header)
  if (types.includes('invoice_pdf')) {
    const templateName = `${cleanPrefix}_invoice_pdf`;
    const existing = existingMetaTemplates.find(t => t.name === templateName && t.language === 'en');
    if (existing) {
      await syncLocalDb(templateName, existing.status, existing.category, existing.id);
      results.push({
        type: 'invoice_pdf',
        name: templateName,
        category: existing.category,
        status: existing.status,
        id: existing.id,
        note: 'Template already registered with Meta'
      });
    } else {
      try {
        if (!appId) throw new Error('Meta App ID required for document header resumable upload');
        const pdfBuf = createSampleInvoicePdfBuffer();
        const pdfHandle = await uploadResumableMediaToMeta(appId, metaToken, pdfBuf, 'application/pdf');

        const payload = {
          name: templateName,
          language: 'en',
          category: 'UTILITY',
          components: [
            {
              type: 'HEADER',
              format: 'DOCUMENT',
              example: { header_handle: [pdfHandle] }
            },
            {
              type: 'BODY',
              text: `Dear {{1}},\n\nThank you for shopping at {{2}}! Your official tax invoice PDF is attached above.\n\nView or download your digital invoice here:\nhttps://bill.retailnode.in/t/{{3}}\n\nFor inquiries, please contact us at {{4}} for assistance.`,
              example: { body_text: [['Valued Customer', storeNameClean, 'JiKSx0qM', storePhoneClean]] }
            },
            {
              type: 'FOOTER',
              text: footerTextClean
            },
            {
              type: 'BUTTONS',
              buttons: [
                {
                  type: 'URL',
                  text: 'View Invoice',
                  url: 'https://bill.retailnode.in/t/{{1}}',
                  example: ['inv-demo-101']
                }
              ]
            }
          ]
        };

        const createRes = await axios.post(
          `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
          payload,
          { headers: { Authorization: `Bearer ${metaToken}`, 'Content-Type': 'application/json' } }
        );

        const newId = createRes.data?.id;
        const newStatus = createRes.data?.status || 'PENDING';
        await syncLocalDb(templateName, newStatus, 'UTILITY', newId);

        results.push({
          type: 'invoice_pdf',
          name: templateName,
          category: 'UTILITY',
          status: newStatus,
          id: newId,
          note: 'Submitted to Meta for review'
        });
      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        results.push({
          type: 'invoice_pdf',
          name: templateName,
          status: 'FAILED',
          error: errorMsg
        });
      }
    }
  }

  // 2. Receipt Image Summary (Image Header)
  if (types.includes('invoice_image')) {
    const templateName = `${cleanPrefix}_invoice_image`;
    const existing = existingMetaTemplates.find(t => t.name === templateName && t.language === 'en');
    if (existing) {
      await syncLocalDb(templateName, existing.status, existing.category, existing.id);
      results.push({
        type: 'invoice_image',
        name: templateName,
        category: existing.category,
        status: existing.status,
        id: existing.id,
        note: 'Template already registered with Meta'
      });
    } else {
      try {
        if (!appId) throw new Error('Meta App ID required for image header resumable upload');
        const pngBuf = createSampleInvoicePngBuffer();
        const pngHandle = await uploadResumableMediaToMeta(appId, metaToken, pngBuf, 'image/png');

        const payload = {
          name: templateName,
          language: 'en',
          category: 'UTILITY',
          components: [
            {
              type: 'HEADER',
              format: 'IMAGE',
              example: { header_handle: [pngHandle] }
            },
            {
              type: 'BODY',
              text: `Dear {{1}},\n\nThank you for shopping at {{2}}! Your receipt preview is attached above.\n\nView or download your digital invoice here:\nhttps://bill.retailnode.in/t/{{3}}\n\nFor queries, contact our support team at {{4}} for assistance.`,
              example: { body_text: [['Valued Customer', storeNameClean, 'JiKSx0qM', storePhoneClean]] }
            },
            {
              type: 'FOOTER',
              text: footerTextClean
            },
            {
              type: 'BUTTONS',
              buttons: [
                {
                  type: 'URL',
                  text: 'See Invoice',
                  url: 'https://bill.retailnode.in/t/{{1}}',
                  example: ['inv-demo-101']
                }
              ]
            }
          ]
        };

        const createRes = await axios.post(
          `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
          payload,
          { headers: { Authorization: `Bearer ${metaToken}`, 'Content-Type': 'application/json' } }
        );

        const newId = createRes.data?.id;
        const newStatus = createRes.data?.status || 'PENDING';
        await syncLocalDb(templateName, newStatus, 'UTILITY', newId);

        results.push({
          type: 'invoice_image',
          name: templateName,
          category: 'UTILITY',
          status: newStatus,
          id: newId,
          note: 'Submitted to Meta for review'
        });
      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        results.push({
          type: 'invoice_image',
          name: templateName,
          status: 'FAILED',
          error: errorMsg
        });
      }
    }
  }

  // 3. Instant Bill Summary (Text Utility)
  if (types.includes('invoice_summary')) {
    const templateName = `${cleanPrefix}_invoice_summary`;
    const existing = existingMetaTemplates.find(t => t.name === templateName && t.language === 'en');
    if (existing) {
      await syncLocalDb(templateName, existing.status, existing.category, existing.id);
      results.push({
        type: 'invoice_summary',
        name: templateName,
        category: existing.category,
        status: existing.status,
        id: existing.id,
        note: 'Template already registered with Meta'
      });
    } else {
      try {
        const payload = {
          name: templateName,
          language: 'en',
          category: 'UTILITY',
          components: [
            {
              type: 'BODY',
              text: `Hello {{1}},\n\nThank you for your purchase at {{2}}! Your invoice {{3}} has been generated.\n\nView your digital bill and rewards online:\nhttps://bill.retailnode.in/t/{{4}}\n\nFor support, call us at {{5}} for assistance.`,
              example: { body_text: [['Valued Customer', storeNameClean, 'INV-1001', 'JiKSx0qM', storePhoneClean]] }
            },
            {
              type: 'FOOTER',
              text: footerTextClean
            },
            {
              type: 'BUTTONS',
              buttons: [
                {
                  type: 'URL',
                  text: 'View Digital Bill',
                  url: 'https://bill.retailnode.in/t/{{1}}',
                  example: ['inv-demo-101']
                }
              ]
            }
          ]
        };

        const createRes = await axios.post(
          `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
          payload,
          { headers: { Authorization: `Bearer ${metaToken}`, 'Content-Type': 'application/json' } }
        );

        const newId = createRes.data?.id;
        const newStatus = createRes.data?.status || 'PENDING';
        await syncLocalDb(templateName, newStatus, 'UTILITY', newId);

        results.push({
          type: 'invoice_summary',
          name: templateName,
          category: 'UTILITY',
          status: newStatus,
          id: newId,
          note: 'Submitted to Meta for review'
        });
      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        results.push({
          type: 'invoice_summary',
          name: templateName,
          status: 'FAILED',
          error: errorMsg
        });
      }
    }
  }

  // 4. Loyalty Points Update (Loyalty Utility)
  if (types.includes('loyalty_update')) {
    const templateName = `${cleanPrefix}_loyalty_update`;
    const existing = existingMetaTemplates.find(t => t.name === templateName && t.language === 'en');
    if (existing) {
      await syncLocalDb(templateName, existing.status, existing.category, existing.id);
      results.push({
        type: 'loyalty_update',
        name: templateName,
        category: existing.category,
        status: existing.status,
        id: existing.id,
        note: 'Template already registered with Meta'
      });
    } else {
      try {
        const payload = {
          name: templateName,
          language: 'en',
          category: 'UTILITY',
          components: [
            {
              type: 'BODY',
              text: `Hello {{1}},\n\nYou earned {{2}} reward points on your recent purchase at {{3}}! Your loyalty balance is now {{4}} points.\n\nCheck your digital rewards card:\nhttps://bill.retailnode.in/t/{{5}}\n\nFor inquiries, contact us at {{6}} for assistance.`,
              example: { body_text: [['Valued Customer', '50', storeNameClean, '250', 'JiKSx0qM', storePhoneClean]] }
            },
            {
              type: 'FOOTER',
              text: footerTextClean
            },
            {
              type: 'BUTTONS',
              buttons: [
                {
                  type: 'URL',
                  text: 'Check Rewards',
                  url: 'https://bill.retailnode.in/t/{{1}}',
                  example: ['inv-demo-101']
                }
              ]
            }
          ]
        };

        const createRes = await axios.post(
          `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
          payload,
          { headers: { Authorization: `Bearer ${metaToken}`, 'Content-Type': 'application/json' } }
        );

        const newId = createRes.data?.id;
        const newStatus = createRes.data?.status || 'PENDING';
        await syncLocalDb(templateName, newStatus, 'UTILITY', newId);

        results.push({
          type: 'loyalty_update',
          name: templateName,
          category: 'UTILITY',
          status: newStatus,
          id: newId,
          note: 'Submitted to Meta for review'
        });
      } catch (err) {
        const errorMsg = err.response?.data?.error?.message || err.message;
        results.push({
          type: 'loyalty_update',
          name: templateName,
          status: 'FAILED',
          error: errorMsg
        });
      }
    }
  }

  return results;
}

/**
 * Fetches status of templates for a WABA account from Meta
 */
export async function getRetailNodeTemplateStatuses({ pool, identifier }) {
  const [rows] = await pool.query(
    'SELECT token, whatsapp_business_account_id FROM phone_number_details WHERE id = ? OR whatsapp_business_account_id = ? LIMIT 1',
    [identifier, identifier]
  );

  if (!rows || rows.length === 0 || !rows[0].token) {
    throw new Error(`WABA account details not found for identifier: ${identifier}`);
  }

  const { token: metaToken, whatsapp_business_account_id: wabaId } = rows[0];

  const listRes = await axios.get(
    `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates?limit=100`,
    { headers: { Authorization: `Bearer ${metaToken}` } }
  );

  const templates = (listRes.data?.data || []).map(t => ({
    name: t.name,
    category: t.category,
    status: t.status,
    id: t.id,
    language: t.language,
    rejected_reason: t.rejected_reason || null,
    components: t.components || []
  }));

  // Sync to local DB
  for (const t of templates) {
    if (!t.id) continue;
    try {
      await pool.query(
        `INSERT INTO message_templates (
          id, whatsapp_business_account_id, name, language, category, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
          status = VALUES(status), 
          category = VALUES(category),
          updated_at = NOW()`,
        [String(t.id), wabaId, t.name, t.language || 'en', t.category, t.status]
      );
    } catch (e) {}
  }

  return templates;
}

/**
 * Submits a custom template to Meta WhatsApp Cloud API
 */
export async function createCustomTemplate({
  pool,
  identifier,
  name,
  category = 'UTILITY',
  language = 'en',
  components = []
}) {
  const [rows] = await pool.query(
    'SELECT token, whatsapp_business_account_id FROM phone_number_details WHERE id = ? OR whatsapp_business_account_id = ? LIMIT 1',
    [identifier, identifier]
  );

  if (!rows || rows.length === 0 || !rows[0].token) {
    throw new Error(`WABA account details not found for identifier: ${identifier}`);
  }

  const { token: metaToken, whatsapp_business_account_id: wabaId } = rows[0];

  const payload = {
    name: String(name).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    language: language || 'en',
    category: String(category).toUpperCase(),
    components
  };

  const createRes = await axios.post(
    `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
    payload,
    { headers: { Authorization: `Bearer ${metaToken}`, 'Content-Type': 'application/json' } }
  );

  const metaId = createRes.data?.id;
  const status = createRes.data?.status || 'PENDING';

  if (metaId) {
    try {
      await pool.query(
        `INSERT INTO message_templates (
          id, whatsapp_business_account_id, name, language, category, status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
          status = VALUES(status), 
          category = VALUES(category),
          updated_at = NOW()`,
        [String(metaId), wabaId, payload.name, payload.language, payload.category, status]
      );
    } catch (e) {}
  }

  return {
    id: metaId,
    status,
    name: payload.name,
    category: payload.category
  };
}

