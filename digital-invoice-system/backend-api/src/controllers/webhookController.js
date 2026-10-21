const db = require('../config/database');
const redis = require('../config/redis');

/**
 * GET /api/v1/webhook
 * Meta WhatsApp Webhook Verification Handshake
 */
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WABA_VERIFY_TOKEN || 'retailnode_webhook_secret_2026';

  if (mode && token) {
    if (mode === 'subscribe' && token === expectedToken) {
      console.log('[Webhook] Webhook verified successfully');
      return res.status(200).send(challenge);
    } else {
      console.warn('[Webhook] Verification token mismatch');
      return res.sendStatus(403);
    }
  }

  // Generic healthcheck
  res.status(200).json({ status: 'active', service: 'RetailNode Webhook Engine' });
};

/**
 * POST /api/v1/webhook & POST /api/v1/waba/webhook
 * Handles incoming WhatsApp delivery status updates (sent, delivered, read, failed)
 * Supports both Meta Cloud API webhook payloads and waba.mpocket.in status callbacks
 */
exports.handleWebhook = async (req, res) => {
  // Acknowledge immediately to avoid WhatsApp retries (< 50ms)
  res.status(200).send('EVENT_RECEIVED');

  try {
    const body = req.body;
    if (!body) return;

    const updates = [];

    // Format 1: Standard Meta WhatsApp Cloud API / Graph API format
    if (body.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (Array.isArray(entry.changes)) {
          for (const change of entry.changes) {
            const val = change.value;
            if (val && Array.isArray(val.statuses)) {
              for (const st of val.statuses) {
                updates.push({
                  messageId: st.id,
                  status: st.status, // 'sent', 'delivered', 'read', 'failed'
                  timestamp: st.timestamp ? new Date(Number(st.timestamp) * 1000) : new Date(),
                  recipient: st.recipient_id,
                  errors: st.errors ? JSON.stringify(st.errors) : null
                });
              }
            }
          }
        }
      }
    }

    // Format 2: Direct flat status callback from waba.mpocket.in or custom gateway
    if (body.message_id || body.messageId || body.id) {
      const mId = body.message_id || body.messageId || body.id;
      const st = body.status;
      if (mId && st) {
        updates.push({
          messageId: mId,
          status: st.toLowerCase(),
          timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
          recipient: body.recipient || body.to || body.phone,
          errors: body.error || body.error_reason || body.reason || null
        });
      }
    }

    // Format 3: Array of status updates
    if (Array.isArray(body.statuses)) {
      for (const st of body.statuses) {
        if (st.id || st.message_id) {
          updates.push({
            messageId: st.id || st.message_id,
            status: (st.status || '').toLowerCase(),
            timestamp: st.timestamp ? new Date(st.timestamp) : new Date(),
            recipient: st.recipient || st.to,
            errors: st.errors ? JSON.stringify(st.errors) : (st.error || null)
          });
        }
      }
    }

    if (updates.length === 0) return;

    // Process all status updates in database
    for (const item of updates) {
      const validStatuses = ['sent', 'delivered', 'read', 'failed'];
      const normalizedStatus = validStatuses.includes(item.status) ? item.status : 'sent';

      const [resUpdate] = await db.query(
        `UPDATE billing_messages 
         SET status = ?, 
             error_reason = COALESCE(?, error_reason)
         WHERE message_id = ?`,
        [normalizedStatus, item.errors ? String(item.errors).slice(0, 500) : null, item.messageId]
      );

      if (resUpdate.affectedRows > 0) {
        console.log(`[Webhook Engine] Updated message ${item.messageId} -> ${normalizedStatus}`);
        
        // Invalidate cached WABA logs in Redis for the affected tenant if possible
        try {
          const [msgRows] = await db.query('SELECT tenant_id FROM billing_messages WHERE message_id = ?', [item.messageId]);
          if (msgRows.length > 0) {
            await redis.del(`store:waba_logs:${msgRows[0].tenant_id}`);
          }
        } catch (e) {}
      }
    }
  } catch (error) {
    console.error('[Webhook Engine] Error processing webhook:', error);
  }
};

/**
 * POST /api/v1/waba/status-update
 * Explicit REST endpoint for waba.mpocket.in to push status callbacks
 */
exports.updateMessageStatus = async (req, res) => {
  try {
    const { message_id, messageId, status, error, error_reason } = req.body;
    const targetId = message_id || messageId;

    if (!targetId || !status) {
      return res.status(400).json({ success: false, error: 'message_id and status are required' });
    }

    const validStatuses = ['queued', 'sent', 'delivered', 'read', 'failed'];
    const normStatus = validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'sent';

    const [result] = await db.query(
      `UPDATE billing_messages 
       SET status = ?, 
           error_reason = ? 
       WHERE message_id = ?`,
      [normStatus, error || error_reason || null, targetId]
    );

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      matchedRows: result.affectedRows
    });
  } catch (err) {
    console.error('[WABA Status API Error]:', err);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};
