const axios = require('axios');
const db = require('../config/database');

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Dynamically resolves Resend credentials:
 * 1. Checks tenant custom credentials in `tenants` table.
 * 2. If tenant does not have their own API credentials, falls back
 *    to the platform default Resend credentials in `global_configs`.
 */
async function getResendCredentials(tenantId) {
  let storeName = 'Retail Store';
  let emailBillingEnabled = false;

  // 1. Check Tenant Custom Credentials
  if (tenantId) {
    try {
      const [tenants] = await db.query(
        'SELECT resend_api_key, resend_from_email, resend_from_name, email_billing_enabled, store_name FROM tenants WHERE id = ?',
        [tenantId]
      );
      if (tenants.length > 0) {
        storeName = tenants[0].store_name || storeName;
        emailBillingEnabled = Boolean(tenants[0].email_billing_enabled);

        if (tenants[0].resend_api_key && tenants[0].resend_api_key.trim().length > 5) {
          return {
            apiKey: tenants[0].resend_api_key.trim(),
            fromEmail: (tenants[0].resend_from_email || 'onboarding@resend.dev').trim(),
            fromName: (tenants[0].resend_from_name || storeName).trim(),
            storeName,
            emailBillingEnabled,
            isDefault: false
          };
        }
      }
    } catch (e) {
      console.warn('[Resend-Client] Error checking tenant credentials:', e.message);
    }
  }

  // 2. Fallback to Platform Global Default from global_configs / env
  let defaultKey = process.env.DEFAULT_RESEND_API_KEY || '';
  let defaultFrom = process.env.DEFAULT_RESEND_FROM_EMAIL || 'billing@retailnode.in';
  let defaultName = process.env.DEFAULT_RESEND_FROM_NAME || 'RetailNode Invoices';

  try {
    const [configs] = await db.query(
      'SELECT config_key, config_value FROM global_configs WHERE config_key IN (?, ?, ?)',
      ['DEFAULT_RESEND_API_KEY', 'DEFAULT_RESEND_FROM_EMAIL', 'DEFAULT_RESEND_FROM_NAME']
    );
    configs.forEach(c => {
      if (c.config_key === 'DEFAULT_RESEND_API_KEY' && c.config_value) defaultKey = c.config_value;
      if (c.config_key === 'DEFAULT_RESEND_FROM_EMAIL' && c.config_value) defaultFrom = c.config_value;
      if (c.config_key === 'DEFAULT_RESEND_FROM_NAME' && c.config_value) defaultName = c.config_value;
    });
  } catch (e) {
    console.warn('[Resend-Client] Error reading global_configs:', e.message);
  }

  return {
    apiKey: defaultKey.trim(),
    fromEmail: defaultFrom.trim() || 'onboarding@resend.dev',
    fromName: defaultName.trim() || storeName,
    storeName,
    emailBillingEnabled,
    isDefault: true
  };
}

/**
 * Wraps content in the official RetailNode branded responsive HTML email template
 */
function wrapRetailNodeEmail({
  title = 'RetailNode',
  preheader = 'Verified electronic invoice notification',
  heroSubtitle = 'CUSTOMER BILLING CONFIRMATION',
  heroTitle = 'RetailNode Digital Invoice',
  heroMeta = '',
  bodyHtml = '',
  storeAddress = '',
  storePhone = '',
  showVerificationBadge = true
}) {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table {border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
    body, table, td, a {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1e293b;">
  
  <!-- Preheader text (preview in inbox) -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
          
          <!-- RETAILNODE BRANDED SUPER-BAR WITH OFFICIAL LOGO -->
          <tr>
            <td style="background-color: #0b0f19; padding: 16px 24px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="middle" style="padding-right: 12px;">
                          <!-- Official RetailNode SVG Logo -->
                          <a href="https://retailnode.in" target="_blank" style="text-decoration: none; display: block;">
                            <img src="https://retailnode.in/logo.svg" alt="RetailNode" width="36" height="36" style="display: block; width: 36px; height: 36px; max-width: 36px; border: 0; outline: none; border-radius: 50%;" />
                          </a>
                        </td>
                        <td valign="middle">
                          <a href="https://retailnode.in" target="_blank" style="text-decoration: none; display: block;">
                            <div style="font-size: 19px; font-weight: 900; letter-spacing: -0.03em; color: #ffffff; line-height: 1;">
                              Retail<span style="color: #0ea5e9;">Node</span>
                            </div>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  ${showVerificationBadge ? `
                    <td align="right" valign="middle">
                      <span style="display: inline-block; background-color: #052e16; color: #4ade80; border: 1px solid #166534; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.02em;">
                        ✓ 100% VERIFIED RECEIPT
                      </span>
                    </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>

          <!-- STORE HERO HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); padding: 36px 28px 28px; text-align: center; color: #ffffff;">
              <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #38bdf8; margin-bottom: 8px;">
                ${heroSubtitle}
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.02em; color: #ffffff; line-height: 1.2;">
                ${heroTitle}
              </h1>
              ${heroMeta ? `
                <p style="margin: 10px 0 0; font-size: 14px; color: #c7d2fe; font-weight: 500;">
                  ${heroMeta}
                </p>
              ` : ''}
            </td>
          </tr>

          <!-- MAIN BODY CONTENT -->
          <tr>
            <td style="padding: 28px 24px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- RETAILNODE FOOTER & TRUST BADGE -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 26px 24px; text-align: center; font-size: 12px; color: #64748b;">
              
              <!-- Footer Brand Row -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom: 12px;">
                <tr>
                  <td valign="middle" style="padding-right: 8px;">
                    <img src="https://retailnode.in/logo.svg" alt="RetailNode" width="22" height="22" style="display: block; width: 22px; height: 22px; border: 0;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size: 13px; font-weight: 800; color: #0f172a;">
                      Retail<span style="color: #0ea5e9;">Node</span>
                    </span>
                  </td>
                </tr>
              </table>

              ${storeAddress || storePhone ? `
                <div style="font-weight: 600; color: #334155; margin-bottom: 8px; font-size: 12px;">
                  ${storeAddress ? storeAddress : ''} ${storeAddress && storePhone ? '&bull;' : ''} ${storePhone ? `Tel: ${storePhone}` : ''}
                </div>
              ` : ''}
              
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.6; max-width: 500px; margin: 0 auto 12px;">
                🔒 This electronic tax invoice was dispatched securely via <strong style="color: #4f46e5;">RetailNode</strong> (<a href="https://bill.retailnode.in" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 700;">bill.retailnode.in</a>).<br>
                🌱 <strong>Green Retail Initiative</strong>: Eliminating thermal paper waste, preserving trees, and empowering modern retail.
              </div>

              <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px;">
                &copy; ${currentYear} RetailNode. All rights reserved. &bull; <a href="https://bill.retailnode.in/privacy" target="_blank" style="color: #64748b; text-decoration: underline;">Privacy Policy</a> &bull; <a href="https://bill.retailnode.in/terms" target="_blank" style="color: #64748b; text-decoration: underline;">Terms of Service</a>
              </div>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Formats a clean, high-conversion, responsive HTML Digital Invoice Email with RetailNode Branding
 */
function generateInvoiceEmailHtml({ receiptData, shortId, loyalty, storeName }) {
  const invNo = receiptData.InvoiceNumber || `INV-${shortId}`;
  const total = parseFloat(receiptData.BillTotal || receiptData.GrandTotal || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const dateStr = receiptData.Date ? new Date(receiptData.Date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');
  const custName = receiptData.CustomerName || 'Valued Shopper';
  const shortUrl = `https://bill.retailnode.in/t/${shortId}`;
  const items = Array.isArray(receiptData.Items) ? receiptData.Items : [];
  const pointsEarned = loyalty?.earned || 0;
  const pointsBalance = loyalty?.balance || 0;

  const itemRowsHtml = items.map((item, idx) => {
    const name = item.Name || item.name || `Item #${idx + 1}`;
    const qty = item.Qty || item.qty || 1;
    const rate = parseFloat(item.Rate || item.rate || 0).toFixed(2);
    const amount = parseFloat(item.Amount || item.amount || (qty * rate)).toFixed(2);
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    return `
      <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${rowBg};">
        <td style="padding: 12px 14px; font-size: 14px; color: #1e293b; font-weight: 600;">${name}</td>
        <td style="padding: 12px 14px; font-size: 14px; color: #475569; text-align: center; font-weight: 600;">${qty}</td>
        <td style="padding: 12px 14px; font-size: 14px; color: #475569; text-align: right;">₹${rate}</td>
        <td style="padding: 12px 14px; font-size: 14px; color: #0f172a; font-weight: 800; text-align: right;">₹${amount}</td>
      </tr>
    `;
  }).join('');

  const bodyContent = `
    <!-- Greeting -->
    <p style="margin: 0 0 20px; font-size: 15px; color: #334155; line-height: 1.5;">
      Dear <strong>${custName}</strong>, thank you for shopping with us! Here is your verified digital tax invoice.
    </p>

    <!-- TOTAL PAID BANNER -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 16px; padding: 22px 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #166534; letter-spacing: 0.08em;">
        TOTAL AMOUNT PAID
      </div>
      <div style="font-size: 38px; font-weight: 900; color: #15803d; margin: 4px 0 2px; letter-spacing: -0.03em;">
        ₹${total}
      </div>
      <div style="font-size: 12px; color: #166534; font-weight: 700;">
        ✓ Payment Confirmed &bull; Verified Digital Bill
      </div>
    </div>

    <!-- LOYALTY POINTS BADGE -->
    ${pointsEarned > 0 || pointsBalance > 0 ? `
      <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left" valign="middle">
              <div style="font-size: 14px; font-weight: 800; color: #92400e;">
                ⭐ +${pointsEarned} Loyalty Points Earned!
              </div>
              <div style="font-size: 12px; color: #b45309; margin-top: 2px;">
                Your total rewards balance is now <strong style="color: #78350f;">${pointsBalance} Points</strong>.
              </div>
            </td>
            <td align="right" valign="middle">
              <span style="background-color: #fef08a; color: #854d0e; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 800; border: 1px solid #facc15; display: inline-block;">
                VIP REWARDS
              </span>
            </td>
          </tr>
        </table>
      </div>
    ` : ''}

    <!-- ITEMIZED ITEMS TABLE -->
    ${items.length > 0 ? `
      <div style="margin-bottom: 28px;">
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
          Purchased Items Summary
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
              <th style="padding: 12px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: left;">Item Description</th>
              <th style="padding: 12px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: center;">Qty</th>
              <th style="padding: 12px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right;">Rate</th>
              <th style="padding: 12px 14px; font-size: 12px; font-weight: 800; text-transform: uppercase; color: #475569; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- PRIMARY ACTION: VIEW DIGITAL RECEIPT -->
    <div style="text-align: center; margin: 32px 0 20px;">
      <a href="${shortUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 800; letter-spacing: -0.01em; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);">
        View Interactive Bill &amp; Download PDF &rarr;
      </a>
    </div>

    <p style="text-align: center; margin: 0 0 16px; font-size: 12px; color: #64748b;">
      Can't click the button? Open directly: <a href="${shortUrl}" target="_blank" style="color: #2563eb; font-weight: 600; text-decoration: underline;">${shortUrl}</a>
    </p>
  `;

  return wrapRetailNodeEmail({
    title: `Digital Invoice #${invNo} - ${storeName} (RetailNode)`,
    preheader: `Here is your verified digital tax receipt of ₹${total} for Invoice #${invNo} from ${storeName}`,
    heroSubtitle: 'CUSTOMER BILLING CONFIRMATION',
    heroTitle: storeName,
    heroMeta: `Invoice <strong style="color: #ffffff;">#${invNo}</strong> &bull; ${dateStr}`,
    bodyHtml: bodyContent,
    storeAddress: receiptData.Address || '',
    storePhone: receiptData.Phone || '',
    showVerificationBadge: true
  });
}

/**
 * Dispatches an email strictly via Resend API (api.resend.com/emails)
 * Guarantees universal RetailNode HTML branding
 */
async function sendEmail({
  tenantId,
  to,
  subject,
  html,
  text,
  invoiceId = null,
  fromEmail = null,
  fromName = null,
  emailType = 'billing'
}) {
  const credentials = await getResendCredentials(tenantId);

  if (!to || !to.includes('@')) {
    return { success: false, error: 'Valid recipient email address is required' };
  }

  if (!credentials.apiKey) {
    console.warn('[Resend-Client] Missing Resend API key for tenant:', tenantId);
    return { success: false, error: 'Resend API Key is not configured for this store or platform.' };
  }

  const cleanRecipient = to.trim().toLowerCase();

  let senderEmail = fromEmail || credentials.fromEmail;
  let senderName = fromName || credentials.fromName;

  // Strict routing: Authentication, OTP, and Security emails dispatch from auth@retailnode.in (RetailNode Security)
  if (emailType === 'auth' || emailType === 'security' || emailType === 'otp' || (subject && /otp|password|reset|verify|verification/i.test(subject))) {
    let authEmail = process.env.AUTH_RESEND_FROM_EMAIL || 'auth@retailnode.in';
    let authName = process.env.AUTH_RESEND_FROM_NAME || 'RetailNode Security';
    try {
      const [configs] = await db.query(
        'SELECT config_key, config_value FROM global_configs WHERE config_key IN (?, ?)',
        ['AUTH_RESEND_FROM_EMAIL', 'AUTH_RESEND_FROM_NAME']
      );
      configs.forEach(c => {
        if (c.config_key === 'AUTH_RESEND_FROM_EMAIL' && c.config_value) authEmail = c.config_value;
        if (c.config_key === 'AUTH_RESEND_FROM_NAME' && c.config_value) authName = c.config_value;
      });
    } catch (e) { }

    senderEmail = fromEmail || authEmail;
    senderName = fromName || authName;
  } else if (emailType === 'welcome' || emailType === 'signup' || (subject && /welcome|onboard|sign\s*up/i.test(subject))) {
    let welcomeEmail = process.env.WELCOME_RESEND_FROM_EMAIL || 'welcome@retailnode.in';
    let welcomeName = process.env.WELCOME_RESEND_FROM_NAME || 'RetailNode';
    try {
      const [configs] = await db.query(
        'SELECT config_key, config_value FROM global_configs WHERE config_key IN (?, ?)',
        ['WELCOME_RESEND_FROM_EMAIL', 'WELCOME_RESEND_FROM_NAME']
      );
      configs.forEach(c => {
        if (c.config_key === 'WELCOME_RESEND_FROM_EMAIL' && c.config_value) welcomeEmail = c.config_value;
        if (c.config_key === 'WELCOME_RESEND_FROM_NAME' && c.config_value) welcomeName = c.config_value;
      });
    } catch (e) { }

    senderEmail = fromEmail || welcomeEmail;
    senderName = fromName || welcomeName;
  }

  const fromHeader = `${senderName} <${senderEmail}>`;

  // Ensure ALL emails have full RetailNode HTML branding
  let finalHtml = html;
  if (!finalHtml || !finalHtml.includes('<!DOCTYPE html>')) {
    finalHtml = wrapRetailNodeEmail({
      title: subject || `Notification from ${credentials.storeName}`,
      preheader: subject || `Important message from ${credentials.storeName}`,
      heroSubtitle: 'STORE NOTIFICATION',
      heroTitle: credentials.storeName,
      bodyHtml: `<div style="font-size: 15px; line-height: 1.6; color: #334155;">${html || `<p>${text || 'Thank you for shopping with us.'}</p>`}</div>`,
      showVerificationBadge: false
    });
  }

  const payload = {
    from: fromHeader,
    to: [cleanRecipient],
    subject: subject || `Digital Invoice from ${credentials.storeName}`,
    html: finalHtml,
    headers: {
      'X-Entity-Ref-ID': `rn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    }
  };

  if (text) {
    payload.text = text;
  }

  try {
    const response = await axios.post(RESEND_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 12000
    });

    const resendEmailId = response.data?.id || `resend_${Date.now()}`;

    // Audit log in email_logs
    try {
      await db.query(
        `INSERT INTO email_logs (
          tenant_id, invoice_id, recipient_email, sender_email, subject, resend_email_id, status, is_default_gateway
        ) VALUES (?, ?, ?, ?, ?, ?, 'sent', ?)`,
        [
          tenantId || null,
          invoiceId || null,
          cleanRecipient,
          senderEmail,
          payload.subject,
          resendEmailId,
          credentials.isDefault ? 1 : 0
        ]
      );
    } catch (auditErr) {
      console.warn('[Resend-Client] Audit log failed:', auditErr.message);
    }

    return {
      success: true,
      emailId: resendEmailId,
      gateway: 'resend',
      isDefaultGateway: credentials.isDefault,
      from: fromHeader,
      to: cleanRecipient
    };
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    console.error('[Resend-Client] Email dispatch failed:', errorMsg);

    try {
      await db.query(
        `INSERT INTO email_logs (
          tenant_id, invoice_id, recipient_email, sender_email, subject, status, is_default_gateway, error_reason
        ) VALUES (?, ?, ?, ?, ?, 'failed', ?, ?)`,
        [
          tenantId || null,
          invoiceId || null,
          cleanRecipient,
          senderEmail,
          payload.subject,
          credentials.isDefault ? 1 : 0,
          String(errorMsg).slice(0, 500)
        ]
      );
    } catch (e) { }

    return { success: false, error: errorMsg };
  }
}

/**
 * Validates a Resend API key and sends a test email with full RetailNode HTML branding
 */
async function testResendConnection({ apiKey, fromEmail, fromName = 'RetailNode Verification', toEmail }) {
  if (!apiKey || !apiKey.startsWith('re_')) {
    return { success: false, error: 'Invalid Resend API Key. Keys must start with "re_"' };
  }

  if (!toEmail || !toEmail.includes('@')) {
    return { success: false, error: 'Valid test recipient email is required' };
  }

  const sender = fromEmail && fromEmail.includes('@') ? fromEmail.trim() : 'onboarding@resend.dev';
  const cleanRecipient = toEmail.trim().toLowerCase();
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const testBodyHtml = `
    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 24px; margin-bottom: 4px;">🚀</div>
      <h3 style="margin: 0 0 6px; font-size: 18px; font-weight: 800; color: #166534;">
        Resend Email Gateway Connected!
      </h3>
      <p style="margin: 0; font-size: 13px; color: #15803d; font-weight: 600;">
        This test confirms that your RetailNode platform can successfully dispatch automated customer invoices via Resend.
      </p>
    </div>

    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">
        Gateway Diagnostic Telemetry
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 140px;">Sender Address</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 700; font-family: monospace;">${sender}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Recipient</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 700; font-family: monospace;">${cleanRecipient}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Server Cluster</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">95.135.166.109 (bill.retailnode.in)</td>
        </tr>
        <tr>
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Timestamp (IST)</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${timestamp}</td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 28px 0 10px;">
      <a href="https://bill.retailnode.in" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.4);">
        Open RetailNode Command Center &rarr;
      </a>
    </div>
  `;

  const html = wrapRetailNodeEmail({
    title: 'Resend API Gateway Verification - RetailNode',
    preheader: 'Your Resend email dispatch gateway has been successfully verified by RetailNode.',
    heroSubtitle: 'GATEWAY VERIFICATION DISPATCH',
    heroTitle: 'Email Gateway Verified',
    heroMeta: 'RetailNode',
    bodyHtml: testBodyHtml,
    showVerificationBadge: false
  });

  const payload = {
    from: `${fromName} <${sender}>`,
    to: [cleanRecipient],
    subject: `Resend API Gateway Verification - RetailNode (${new Date().toLocaleTimeString('en-IN')})`,
    html
  };

  try {
    const response = await axios.post(RESEND_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return {
      success: true,
      emailId: response.data?.id,
      message: `Verified test email successfully dispatched to ${cleanRecipient}!`
    };
  } catch (err) {
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
    return {
      success: false,
      error: `Resend verification error: ${errMsg}`
    };
  }
}

/**
 * 1. Forgot Password / OTP / PIN Email (Optimized for Gmail "Code Requested / Copy code" Header)
 */
function generateForgotPasswordEmailHtml({ userName = 'User', otp, resetLink, storeName = 'RetailNode', actionText = 'reset', expiryMinutes = 15 }) {
  const firstName = (userName || 'User').trim().split(/\s+/)[0] || 'User';
  const cleanOtp = String(otp || '').trim();
  const subject = `${firstName}, here's your PIN ${cleanOtp}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f2ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    Hi ${firstName}, enter this code to complete the ${actionText}: ${cleanOtp}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f2ef; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;">
          <tr>
            <td style="padding: 24px 32px 16px; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="padding-right: 10px;">
                    <img src="https://retailnode.in/logo.svg" alt="RetailNode" width="28" height="28" style="display: block; width: 28px; height: 28px; border: 0; border-radius: 50%;" />
                  </td>
                  <td valign="middle">
                    <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.03em; color: #0f172a;">
                      Retail<span style="color: #0ea5e9;">Node</span>
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px;">
              <p style="margin: 0 0 14px; font-size: 16px; font-weight: 700; color: #0f172a;">
                Hi ${firstName},
              </p>
              <p style="margin: 0 0 18px; font-size: 15px; color: #334155; line-height: 1.5;">
                Enter this code to complete the ${actionText}.
              </p>
              <div style="font-size: 32px; font-weight: 700; color: #0f172a; margin: 16px 0 24px; letter-spacing: 0;">
                ${cleanOtp}
              </div>
              ${resetLink ? `
                <div style="margin: 20px 0 24px;">
                  <a href="${resetLink}" target="_blank" style="display: inline-block; background-color: #0a66c2; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 24px; font-size: 14px; font-weight: 700;">
                    Reset Password Directly &rarr;
                  </a>
                </div>
              ` : ''}
              <p style="margin: 0 0 12px; font-size: 14px; color: #475569; line-height: 1.6;">
                If you didn't request this PIN for your <strong>${storeName}</strong> account, we recommend you change your password or ignore this email. Never share this code with anyone.
              </p>
              <p style="margin: 20px 0 0; font-size: 14px; color: #334155;">
                Thanks,<br>
                <strong>The RetailNode Security Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generateOtpPlainText({ userName = 'User', otp, actionText = 'reset', expiryMinutes = 15 }) {
  const firstName = (userName || 'User').trim().split(/\s+/)[0] || 'User';
  const cleanOtp = String(otp || '').trim();
  return [
    `Hi ${firstName},`,
    ``,
    `Enter this code to complete the ${actionText}.`,
    ``,
    `${cleanOtp}`,
    ``,
    `If you didn't request this PIN, we recommend you change your password or ignore this email. This code expires in ${expiryMinutes} minutes.`,
    ``,
    `Thanks,`,
    `The RetailNode Security Team`
  ].join('\n');
}

/**
 * 2. Welcome & Account Email Verification
 */
function generateWelcomeVerificationEmailHtml({
  storeName,
  ownerName = 'Store Owner',
  userEmail,
  verifyOtp,
  loginUrl,
  apiToken,
  planName = '3-Day Free Trial (500 Bills)',
  role = 'Store Admin',
  temporaryPassword = null
}) {
  const targetLoginUrl = loginUrl || 'https://bill.retailnode.in/login';

  const bodyHtml = `
    <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
      Welcome to RetailNode, <strong>${ownerName}</strong>! 🎉
      <br><br>
      Your store <strong>${storeName}</strong> has been provisioned on our high-throughput Digital Billing &amp; Customer CRM SaaS platform. Your <strong>${planName}</strong> is active now!
    </div>

    ${verifyOtp ? `
      <!-- VERIFICATION CODE -->
      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 14px; padding: 16px 32px;">
          <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px;">
            ACCOUNT VERIFICATION CODE
          </div>
          <div style="font-size: 34px; font-family: monospace; font-weight: 900; letter-spacing: 0.2em; color: #15803d;">
            ${verifyOtp}
          </div>
        </div>
      </div>
    ` : ''}

    <!-- ACCOUNT DETAILS CARD -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">
        Store Account Credentials
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600; width: 140px;">Store Name</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 700;">${storeName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Admin Login</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 700; font-family: monospace;">${userEmail}</td>
        </tr>
        ${temporaryPassword ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Initial Password</td>
            <td style="padding: 10px 16px; color: #dc2626; font-weight: 700; font-family: monospace;">${temporaryPassword}</td>
          </tr>
        ` : ''}
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Account Role</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${role}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Active Plan</td>
          <td style="padding: 10px 16px; color: #16a34a; font-weight: 700;">${planName}</td>
        </tr>
        ${apiToken ? `
          <tr>
            <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">POS API Token</td>
            <td style="padding: 10px 16px; color: #4338ca; font-weight: 700; font-family: monospace; font-size: 12px;">${apiToken.slice(0, 14)}••••••••</td>
          </tr>
        ` : ''}
      </table>
    </div>

    <!-- GET STARTED CTA -->
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${targetLoginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 15px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.4);">
        Access Merchant Dashboard &rarr;
      </a>
    </div>

    <div style="font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 20px;">
      <strong>3 Quick Steps to Start:</strong><br>
      1. Log into your dashboard at <a href="${targetLoginUrl}" style="color: #2563eb;">${targetLoginUrl}</a><br>
      2. Integrate your POS (RetailNode ERP, Tally, Marg, Busy) using your API Token<br>
      3. Start dispatching paperless digital receipts instantly!
    </div>
  `;

  return wrapRetailNodeEmail({
    title: `Welcome to RetailNode - ${storeName}`,
    preheader: `Welcome ${storeName}! Your store account has been created. Start sending digital receipts today.`,
    heroSubtitle: 'STORE ACTIVATION & ONBOARDING',
    heroTitle: storeName,
    heroMeta: 'RetailNode',
    bodyHtml,
    showVerificationBadge: false
  });
}

/**
 * 3. Daily 11:00 PM Message Sending & Business Digest Report
 */
function generateDailyReportEmailHtml({ storeName, reportDate, stats = {} }) {
  const dateStr = reportDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const totalInvoices = stats.totalInvoices || 0;
  const totalRevenue = parseFloat(stats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const waSent = stats.waSent || 0;
  const waDelivered = stats.waDelivered || 0;
  const waRead = stats.waRead || 0;
  const waFailed = stats.waFailed || 0;
  const deliveryRate = waSent > 0 ? Math.round(((waDelivered + waRead) / waSent) * 100) : 100;
  const pointsAwarded = stats.loyaltyPointsAwarded || 0;
  const newCustomers = stats.newCustomers || 0;

  const bodyHtml = `
    <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      Good evening <strong>${storeName}</strong> team,
      <br><br>
      Here is your automated daily operations &amp; customer billing summary for <strong>${dateStr}</strong>:
    </div>

    <!-- TOP KPI HIGHLIGHT BANNER -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="48%" style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 18px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">Total Sales Volume</div>
            <div style="font-size: 26px; font-weight: 900; color: #15803d; margin: 4px 0;">₹${totalRevenue}</div>
            <div style="font-size: 11px; color: #166534; font-weight: 600;">Processed Today</div>
          </td>
          <td width="4%"></td>
          <td width="48%" style="background-color: #eef2ff; border: 1px solid #a5b4fc; border-radius: 12px; padding: 18px; text-align: center;">
            <div style="font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase;">Digital Bills Sent</div>
            <div style="font-size: 26px; font-weight: 900; color: #3730a3; margin: 4px 0;">${totalInvoices}</div>
            <div style="font-size: 11px; color: #4338ca; font-weight: 600;">${newCustomers} New Shoppers</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- WHATSAPP DELIVERY HEALTH CARD -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; display: flex; justify-content: space-between;">
        <span>WhatsApp Delivery Metrics</span>
        <span style="color: #16a34a; font-weight: 800;">${deliveryRate}% Success</span>
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Messages Dispatched</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 700; text-align: right;">${waSent}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Delivered &amp; Read</td>
          <td style="padding: 10px 16px; color: #16a34a; font-weight: 700; text-align: right;">${waDelivered + waRead}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Failed Dispatches</td>
          <td style="padding: 10px 16px; color: ${waFailed > 0 ? '#dc2626' : '#64748b'}; font-weight: 700; text-align: right;">${waFailed}</td>
        </tr>
        <tr>
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Customer Loyalty Points Given</td>
          <td style="padding: 10px 16px; color: #d97706; font-weight: 700; text-align: right;">+${pointsAwarded} pts</td>
        </tr>
      </table>
    </div>

    <!-- DASHBOARD CTA -->
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="https://bill.retailnode.in/dashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 15px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3);">
        View Detailed Store Analytics &rarr;
      </a>
    </div>
  `;

  return wrapRetailNodeEmail({
    title: `Daily Store Performance Report - ${storeName} (${dateStr})`,
    preheader: `${storeName} Daily Summary: ${totalInvoices} bills sent &bull; ₹${totalRevenue} revenue &bull; ${deliveryRate}% delivery rate`,
    heroSubtitle: 'DAILY STORE PERFORMANCE DIGEST (11:00 PM)',
    heroTitle: storeName,
    heroMeta: `Report Date: <strong style="color: #ffffff;">${dateStr}</strong>`,
    bodyHtml,
    showVerificationBadge: false
  });
}

/**
 * 4. Payment Successful & Subscription Receipt
 */
function generatePaymentSuccessEmailHtml({ storeName, planName = 'Growth Annual Plan', amount = '6000.00', paymentId, orderId, validUntil, billingDate }) {
  const dateStr = billingDate || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const formattedAmount = parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  const bodyHtml = `
    <!-- SUCCESS BADGE -->
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; border-radius: 16px; padding: 22px 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #166534; letter-spacing: 0.08em;">
        PAYMENT CONFIRMED &bull; SUBSCRIPTION ACTIVATED
      </div>
      <div style="font-size: 38px; font-weight: 900; color: #15803d; margin: 4px 0 2px; letter-spacing: -0.03em;">
        ₹${formattedAmount}
      </div>
      <div style="font-size: 12px; color: #166534; font-weight: 700;">
        ✓ Transaction Completed &bull; Razorpay Verified
      </div>
    </div>

    <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
      Dear <strong>${storeName}</strong>,
      <br><br>
      Thank you for your payment! Your subscription to the <strong>${planName}</strong> has been successfully processed and your store account is active.
    </div>

    <!-- TRANSACTION RECEIPT TABLE -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
      <div style="background-color: #f8fafc; padding: 10px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase;">
        Payment Receipt Breakdown
      </div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Plan Subscribed</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 700;">${planName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Amount Paid</td>
          <td style="padding: 10px 16px; color: #15803d; font-weight: 800;">₹${formattedAmount} (All Taxes Included)</td>
        </tr>
        ${paymentId ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Razorpay Payment ID</td>
            <td style="padding: 10px 16px; color: #0f172a; font-weight: 700; font-family: monospace;">${paymentId}</td>
          </tr>
        ` : ''}
        ${orderId ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Order Reference</td>
            <td style="padding: 10px 16px; color: #0f172a; font-weight: 700; font-family: monospace;">${orderId}</td>
          </tr>
        ` : ''}
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Transaction Date</td>
          <td style="padding: 10px 16px; color: #0f172a; font-weight: 600;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding: 10px 16px; color: #64748b; font-weight: 600;">Valid Until</td>
          <td style="padding: 10px 16px; color: #4338ca; font-weight: 800;">${validUntil || '1 Year from today'}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="https://bill.retailnode.in/dashboard" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 10px; font-size: 15px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">
        Open Store Dashboard &rarr;
      </a>
    </div>
  `;

  return wrapRetailNodeEmail({
    title: `Payment Receipt: ${planName} Activated - RetailNode`,
    preheader: `Thank you for your payment of ₹${formattedAmount}. Your ${planName} is active until ${validUntil}.`,
    heroSubtitle: 'PAYMENT CONFIRMATION & RECEIPT',
    heroTitle: storeName,
    heroMeta: `Plan: <strong style="color: #ffffff;">${planName}</strong> &bull; ${dateStr}`,
    bodyHtml,
    showVerificationBadge: true
  });
}

/**
 * 5. Subscription Renewal Reminder
 */
function generateRenewalReminderEmailHtml({ storeName, planName = 'Growth Annual Plan', expiryDate, daysRemaining = 7, renewalPrice = '6000', renewalLink }) {
  const targetLink = renewalLink || 'https://bill.retailnode.in/dashboard/settings';

  const bodyHtml = `
    <!-- WARNING BANNER -->
    <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #fde68a; border-radius: 16px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em;">
        SUBSCRIPTION EXPIRATION WARNING
      </div>
      <div style="font-size: 26px; font-weight: 900; color: #b45309; margin: 4px 0 2px;">
        Expires in ${daysRemaining} Days
      </div>
      <div style="font-size: 12px; color: #92400e; font-weight: 700;">
        Expiry Date: ${expiryDate}
      </div>
    </div>

    <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
      Hello <strong>${storeName}</strong>,
      <br><br>
      Your annual subscription to RetailNode <strong>${planName}</strong> will expire on <strong>${expiryDate}</strong> (${daysRemaining} days remaining).
      <br><br>
      To prevent interruption to your automated customer digital bills, WhatsApp messaging delivery, and customer CRM loyalty balances, please renew your subscription before ${expiryDate}.
    </div>

    <!-- RENEWAL OFFER BOX -->
    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Current Promotional Renewal Rate</div>
      <div style="font-size: 32px; font-weight: 900; color: #0f172a; margin: 6px 0;">
        ₹${parseFloat(renewalPrice).toLocaleString('en-IN')} <span style="font-size: 14px; color: #94a3b8; font-weight: 500; text-decoration: line-through;">₹9,000</span>
      </div>
      <div style="font-size: 12px; color: #16a34a; font-weight: 700;">
        ⚡ Save ₹3,000 (33% OFF) with Launch Pricing
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 28px 0 16px;">
      <a href="${targetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 16px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.4);">
        Renew Now for ₹${parseFloat(renewalPrice).toLocaleString('en-IN')} &rarr;
      </a>
    </div>
  `;

  return wrapRetailNodeEmail({
    title: `Renewal Notice: ${daysRemaining} Days Left for ${storeName}`,
    preheader: `Your ${planName} for ${storeName} expires in ${daysRemaining} days on ${expiryDate}. Renew now to keep digital bills active.`,
    heroSubtitle: 'SUBSCRIPTION RENEWAL REMINDER',
    heroTitle: storeName,
    heroMeta: `Expires on <strong style="color: #ffffff;">${expiryDate}</strong> (${daysRemaining} Days Left)`,
    bodyHtml,
    showVerificationBadge: false
  });
}

/**
 * 6. Free Trial Status (Pre-expiry & 5-Day Post-Expiry Win-Back)
 */
function generateTrialStatusEmailHtml({ storeName, stage = 'pre_expiry', expiryDate, daysLeft = 1, daysExpired = 5, upgradePrice = '6000', upgradeLink }) {
  const targetLink = upgradeLink || 'https://bill.retailnode.in/dashboard/settings';
  const formattedPrice = parseFloat(upgradePrice).toLocaleString('en-IN');

  if (stage === 'post_expiry') {
    // 5-Day Post-Expiry Win-back
    const bodyHtml = `
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #cbd5e1; border-radius: 16px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.08em;">
          ACCOUNT RE-ACTIVATION &bull; SPECIAL WIN-BACK OFFER
        </div>
        <div style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 2px;">
          We Miss You at RetailNode!
        </div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">
          Trial ended ${daysExpired} days ago on ${expiryDate}
        </div>
      </div>

      <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
        Hello <strong>${storeName}</strong>,
        <br><br>
        Your 3-day free trial on RetailNode ended ${daysExpired} days ago. Your customers loved receiving instant WhatsApp digital receipts and accumulating loyalty points!
        <br><br>
        We want to make it effortless for you to continue. We are extending our <strong>Exclusive Annual Launch Offer</strong> to you today:
      </div>

      <!-- PRICE CARD -->
      <div style="background-color: #ffffff; border: 2px solid #818cf8; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase;">All-Inclusive Annual Growth Plan</div>
        <div style="font-size: 36px; font-weight: 900; color: #312e81; margin: 6px 0;">
          ₹${formattedPrice} <span style="font-size: 14px; color: #94a3b8; font-weight: 500; text-decoration: line-through;">₹9,000</span>
        </div>
        <div style="font-size: 12px; color: #16a34a; font-weight: 700;">
          ✓ Unlimited WhatsApp Bills &bull; Smart CRM &bull; Loyalty Engine &bull; Zero Lag
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${targetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(14, 165, 233, 0.4);">
          Re-activate Store for ₹${formattedPrice} &rarr;
        </a>
      </div>
    `;

    return wrapRetailNodeEmail({
      title: `Special Offer: Re-activate ${storeName} on RetailNode`,
      preheader: `Re-activate your store billing utility today for just ₹${formattedPrice}/yr (Save ₹3,000).`,
      heroSubtitle: 'STORE RE-ACTIVATION & WIN-BACK',
      heroTitle: storeName,
      heroMeta: `Trial Expired ${daysExpired} Days Ago`,
      bodyHtml,
      showVerificationBadge: false
    });
  } else {
    // Pre-expiry (Day 2/3 of trial)
    const bodyHtml = `
      <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #fde68a; border-radius: 16px; padding: 20px 24px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.08em;">
          FREE TRIAL EXPIRING SOON
        </div>
        <div style="font-size: 26px; font-weight: 900; color: #b45309; margin: 4px 0 2px;">
          ${daysLeft} Day${daysLeft === 1 ? '' : 's'} Remaining
        </div>
        <div style="font-size: 12px; color: #92400e; font-weight: 700;">
          Trial Ends on ${expiryDate}
        </div>
      </div>

      <div style="font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
        Hello <strong>${storeName}</strong>,
        <br><br>
        Your 3-day free trial on RetailNode will conclude on <strong>${expiryDate}</strong>.
        <br><br>
        Lock in your <strong>Annual Growth Plan</strong> today before your trial ends to preserve uninterrupted customer messaging, verified receipts, and Google review redirects:
      </div>

      <!-- PRICE CARD -->
      <div style="background-color: #ffffff; border: 2px solid #86efac; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase;">Growth Annual Plan (Launch Pricing)</div>
        <div style="font-size: 36px; font-weight: 900; color: #15803d; margin: 6px 0;">
          ₹${formattedPrice} <span style="font-size: 14px; color: #94a3b8; font-weight: 500; text-decoration: line-through;">₹9,000</span>
        </div>
        <div style="font-size: 12px; color: #166534; font-weight: 700;">
          ⚡ 33% OFF &bull; ₹6,000 / Year Instead of ₹9,000
        </div>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 28px 0 16px;">
        <a href="${targetLink}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-size: 16px; font-weight: 800; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);">
          Upgrade to Growth Plan (₹${formattedPrice}) &rarr;
        </a>
      </div>
    `;

    return wrapRetailNodeEmail({
      title: `Action Required: Your 3-Day Trial Ends in ${daysLeft} Day${daysLeft === 1 ? '' : 's'} (${storeName})`,
      preheader: `Your RetailNode trial expires on ${expiryDate}. Lock in the ₹${formattedPrice}/yr annual launch rate now.`,
      heroSubtitle: 'FREE TRIAL COUNTDOWN',
      heroTitle: storeName,
      heroMeta: `Expires on <strong style="color: #ffffff;">${expiryDate}</strong>`,
      bodyHtml,
      showVerificationBadge: false
    });
  }
}

module.exports = {
  getResendCredentials,
  wrapRetailNodeEmail,
  generateInvoiceEmailHtml,
  generateForgotPasswordEmailHtml,
  generateOtpPlainText,
  generateWelcomeVerificationEmailHtml,
  generateDailyReportEmailHtml,
  generatePaymentSuccessEmailHtml,
  generateRenewalReminderEmailHtml,
  generateTrialStatusEmailHtml,
  sendEmail,
  testResendConnection
};


