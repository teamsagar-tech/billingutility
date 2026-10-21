const db = require('../config/database');
const logger = require('../utils/logger');
const {
  sendEmail,
  generateDailyReportEmailHtml,
  generateTrialStatusEmailHtml,
  generateRenewalReminderEmailHtml
} = require('./emailClient');

/**
 * Gathers today's billing and messaging statistics for a given merchant
 */
async function getTenantDailyStats(tenantId, targetDateStr) {
  const queryDate = targetDateStr || new Date().toISOString().split('T')[0];
  const startOfDay = `${queryDate} 00:00:00`;
  const endOfDay = `${queryDate} 23:59:59`;

  // 1. Invoices & Revenue
  const [invRows] = await db.query(
    `SELECT 
       COUNT(*) as total_invoices, 
       COALESCE(SUM(total_amount), 0) as total_revenue 
     FROM invoices 
     WHERE tenant_id = ? AND created_at BETWEEN ? AND ?`,
    [tenantId, startOfDay, endOfDay]
  );

  // 2. WhatsApp Delivery Breakdown
  const [waRows] = await db.query(
    `SELECT status, COUNT(*) as count 
     FROM billing_messages 
     WHERE tenant_id = ? AND created_at BETWEEN ? AND ?
     GROUP BY status`,
    [tenantId, startOfDay, endOfDay]
  );

  let waSent = 0;
  let waDelivered = 0;
  let waRead = 0;
  let waFailed = 0;

  waRows.forEach(row => {
    const c = parseInt(row.count, 10) || 0;
    waSent += c;
    if (row.status === 'delivered') waDelivered += c;
    else if (row.status === 'read') waRead += c;
    else if (row.status === 'failed') waFailed += c;
    else if (row.status === 'sent') waDelivered += c; // Sent to carrier
  });

  // 3. Loyalty Points Awarded
  let loyaltyPointsAwarded = 0;
  try {
    const [loyaltyRows] = await db.query(
      `SELECT COALESCE(SUM(points_earned), 0) as total_points 
       FROM loyalty_transactions 
       WHERE tenant_id = ? AND created_at BETWEEN ? AND ?`,
      [tenantId, startOfDay, endOfDay]
    );
    loyaltyPointsAwarded = parseInt(loyaltyRows[0]?.total_points, 10) || 0;
  } catch (e) {}

  // 4. New Customers Ingested
  const [custRows] = await db.query(
    `SELECT COUNT(*) as new_customers 
     FROM customers 
     WHERE tenant_id = ? AND created_at BETWEEN ? AND ?`,
    [tenantId, startOfDay, endOfDay]
  );

  return {
    totalInvoices: parseInt(invRows[0]?.total_invoices, 10) || 0,
    totalRevenue: parseFloat(invRows[0]?.total_revenue || 0),
    waSent,
    waDelivered,
    waRead,
    waFailed,
    loyaltyPointsAwarded,
    newCustomers: parseInt(custRows[0]?.new_customers, 10) || 0
  };
}

/**
 * Dispatches daily 11 PM report for a specific store
 */
async function dispatchDailyReportForTenant(tenantId, customRecipientEmail = null) {
  try {
    const [tenants] = await db.query(
      `SELECT t.id, t.store_name, t.store_email, u.email as admin_email 
       FROM tenants t 
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'merchant_admin' 
       WHERE t.id = ? 
       LIMIT 1`,
      [tenantId]
    );

    if (tenants.length === 0) return { success: false, error: 'Tenant not found' };

    const tenant = tenants[0];
    const recipient = customRecipientEmail || tenant.store_email || tenant.admin_email;

    if (!recipient || !recipient.includes('@')) {
      return { success: false, error: 'No valid recipient email address configured for store' };
    }

    const todayDateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const stats = await getTenantDailyStats(tenantId);

    const reportHtml = generateDailyReportEmailHtml({
      storeName: tenant.store_name,
      reportDate: todayDateStr,
      stats
    });

    const result = await sendEmail({
      tenantId,
      to: recipient,
      subject: `Daily Store Performance Report - ${tenant.store_name} (${todayDateStr})`,
      html: reportHtml
    });

    logger.info(`[Daily-Report] Dispatched to ${recipient} for ${tenant.store_name}: ${result.success}`);
    return result;
  } catch (error) {
    logger.error(`[Daily-Report] Error dispatching report for tenant ${tenantId}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Checks and dispatches all trial countdown and renewal reminder emails
 */
async function checkAndDispatchExpiryReminders() {
  logger.info('[Expiry-Scheduler] Checking trial countdowns and subscription renewal notices...');
  const results = { trialPreExpiry: 0, trialPostExpiry: 0, growthRenewal: 0 };

  try {
    // 1. Trial Pre-Expiry (Days left: 1, 2, or 3)
    const [trialExpiring] = await db.query(
      `SELECT t.id, t.store_name, t.plan_valid_until, t.store_email, u.email as admin_email,
              DATEDIFF(t.plan_valid_until, CURRENT_DATE) as days_left
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'merchant_admin'
       WHERE t.plan_tier = 'trial' 
         AND t.is_active = 1
         AND DATEDIFF(t.plan_valid_until, CURRENT_DATE) BETWEEN 1 AND 3`
    );

    for (const t of trialExpiring) {
      const email = t.store_email || t.admin_email;
      if (!email) continue;

      const html = generateTrialStatusEmailHtml({
        storeName: t.store_name,
        stage: 'pre_expiry',
        expiryDate: new Date(t.plan_valid_until).toLocaleDateString('en-IN'),
        daysLeft: t.days_left,
        upgradePrice: '6000',
        upgradeLink: 'https://bill.retailnode.in/dashboard/settings'
      });

      await sendEmail({
        tenantId: null, // Platform System Notice (not a customer invoice)
        to: email,
        subject: `Action Required: Your 3-Day Trial Ends in ${t.days_left} Day${t.days_left === 1 ? '' : 's'} (${t.store_name})`,
        html
      });
      results.trialPreExpiry++;
    }

    // 2. Trial Post-Expiry (Exactly 5 days after trial ended - Win-Back Offer)
    const [trialExpired5Days] = await db.query(
      `SELECT t.id, t.store_name, t.plan_valid_until, t.store_email, u.email as admin_email
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'merchant_admin'
       WHERE t.plan_tier = 'trial'
         AND DATEDIFF(CURRENT_DATE, t.plan_valid_until) = 5`
    );

    for (const t of trialExpired5Days) {
      const email = t.store_email || t.admin_email;
      if (!email) continue;

      const html = generateTrialStatusEmailHtml({
        storeName: t.store_name,
        stage: 'post_expiry',
        expiryDate: new Date(t.plan_valid_until).toLocaleDateString('en-IN'),
        daysExpired: 5,
        upgradePrice: '6000',
        upgradeLink: 'https://bill.retailnode.in/dashboard/settings'
      });

      await sendEmail({
        tenantId: null, // Platform System Notice (not a customer invoice)
        to: email,
        subject: `Special Offer: Re-activate ${t.store_name} on RetailNode (Save ₹3,000)`,
        html
      });
      results.trialPostExpiry++;
    }

    // 3. Growth Plan Renewal Reminders (7 days and 3 days before renewal)
    const [growthExpiring] = await db.query(
      `SELECT t.id, t.store_name, t.plan_valid_until, t.store_email, u.email as admin_email,
              DATEDIFF(t.plan_valid_until, CURRENT_DATE) as days_left
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'merchant_admin'
       WHERE t.plan_tier = 'growth'
         AND t.is_active = 1
         AND DATEDIFF(t.plan_valid_until, CURRENT_DATE) IN (7, 3, 1)`
    );

    for (const t of growthExpiring) {
      const email = t.store_email || t.admin_email;
      if (!email) continue;

      const html = generateRenewalReminderEmailHtml({
        storeName: t.store_name,
        planName: 'Growth Annual Plan',
        expiryDate: new Date(t.plan_valid_until).toLocaleDateString('en-IN'),
        daysRemaining: t.days_left,
        renewalPrice: '6000',
        renewalLink: 'https://bill.retailnode.in/dashboard/settings'
      });

      await sendEmail({
        tenantId: null, // Platform System Notice (not a customer invoice)
        to: email,
        subject: `Renewal Notice: ${t.days_left} Days Left for ${t.store_name}`,
        html
      });
      results.growthRenewal++;
    }

    logger.info('[Expiry-Scheduler] Reminders sent successfully:', results);
    return { success: true, results };
  } catch (error) {
    logger.error(`[Expiry-Scheduler] Error checking reminders: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Initializes the automated background cron runner
 */
function initCronScheduler() {
  logger.info('⏰ Automated Background Cron Scheduler initialized');

  let lastDailyReportDay = -1;
  let lastMorningCheckDay = -1;

  // Run a heartbeat check every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      // Convert to IST (UTC+5:30)
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const hours = istTime.getUTCHours();
      const minutes = istTime.getUTCMinutes();
      const dayOfMonth = istTime.getUTCDate();

      // 1. Daily 11:00 PM (23:00 IST) Digest
      if (hours === 23 && minutes === 0 && lastDailyReportDay !== dayOfMonth) {
        lastDailyReportDay = dayOfMonth;
        logger.info('🔔 Triggering Daily 11:00 PM Merchant Reports...');

        const [tenants] = await db.query('SELECT id FROM tenants WHERE is_active = 1');
        for (const t of tenants) {
          await dispatchDailyReportForTenant(t.id);
        }
      }

      // 2. Daily 09:00 AM (09:00 IST) Expiry & Renewal Reminders
      if (hours === 9 && minutes === 0 && lastMorningCheckDay !== dayOfMonth) {
        lastMorningCheckDay = dayOfMonth;
        logger.info('🔔 Triggering Daily 09:00 AM Expiry & Renewal Reminders...');
        await checkAndDispatchExpiryReminders();
      }
    } catch (e) {
      logger.error(`[CronScheduler] Heartbeat error: ${e.message}`);
    }
  }, 60 * 1000);
}

module.exports = {
  initCronScheduler,
  getTenantDailyStats,
  dispatchDailyReportForTenant,
  checkAndDispatchExpiryReminders
};
