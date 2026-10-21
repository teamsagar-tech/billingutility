const db = require('../config/database');
const redis = require('../config/redis');

/**
 * GET /api/v1/auth/feedback/settings
 * Retrieves merchant survey and rating settings
 */
exports.getFeedbackSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      'SELECT feedback_enabled, survey_reward_points, google_review_url, google_place_id FROM tenants WHERE id = ?',
      [tenantId]
    );
    const tenant = rows[0] || {};
    res.status(200).json({
      success: true,
      feedback_enabled: tenant.feedback_enabled !== 0,
      survey_reward_points: tenant.survey_reward_points !== undefined ? tenant.survey_reward_points : 25,
      google_review_url: tenant.google_review_url || '',
      google_place_id: tenant.google_place_id || ''
    });
  } catch (error) {
    console.error('Error fetching feedback settings:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * PUT /api/v1/auth/feedback/settings
 * Updates merchant survey settings
 */
exports.updateFeedbackSettings = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { feedback_enabled, survey_reward_points, google_review_url, google_place_id } = req.body;
    
    await db.query(
      `UPDATE tenants 
       SET feedback_enabled = ?, 
           survey_reward_points = ?,
           google_review_url = ?,
           google_place_id = ?
       WHERE id = ?`,
      [
        feedback_enabled ? 1 : 0,
        Number.isInteger(Number(survey_reward_points)) ? Number(survey_reward_points) : 25,
        google_review_url || null,
        google_place_id || null,
        tenantId
      ]
    );

    // Invalidate cached tenant profile in Redis
    try {
      await redis.del(`tenant:${tenantId}`);
      await redis.del(`tenant_profile:${tenantId}`);
    } catch (e) {}

    res.status(200).json({ success: true, message: 'Survey settings updated successfully' });
  } catch (error) {
    console.error('Error updating feedback settings:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * GET /api/v1/auth/feedback/responses
 * Retrieves customer survey responses with tags, NPS score, and resolution status
 */
exports.getFeedbackResponses = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const [rows] = await db.query(
      `SELECT 
         id, short_id, invoice_number, customer_phone, customer_name, 
         rating, nps_score, survey_tags, experience_aspects, comment, 
         routed_to_google, resolution_status, resolution_notes, resolved_at, created_at 
       FROM customer_feedback 
       WHERE tenant_id = ? 
       ORDER BY created_at DESC 
       LIMIT 300`,
      [tenantId]
    );

    const formatted = rows.map(r => {
      let tags = [];
      let aspects = {};
      try {
        tags = typeof r.survey_tags === 'string' ? JSON.parse(r.survey_tags) : (r.survey_tags || []);
      } catch (e) {
        tags = [];
      }
      try {
        aspects = typeof r.experience_aspects === 'string' ? JSON.parse(r.experience_aspects) : (r.experience_aspects || {});
      } catch (e) {
        aspects = {};
      }

      return {
        ...r,
        survey_tags: Array.isArray(tags) ? tags : [],
        experience_aspects: aspects,
        nps_score: r.nps_score !== null ? Number(r.nps_score) : null,
        rating: Number(r.rating || 5)
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * PUT /api/v1/auth/feedback/responses/:id/resolution
 * Updates feedback resolution notes and status
 */
exports.updateFeedbackResolution = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const resStatus = status === 'pending' ? 'pending' : (status === 'in_progress' ? 'in_progress' : 'resolved');
    const resolvedAt = resStatus === 'resolved' ? new Date() : null;

    await db.query(
      `UPDATE customer_feedback 
       SET resolution_status = ?, resolution_notes = ?, resolved_at = ? 
       WHERE id = ? AND tenant_id = ?`,
      [resStatus, notes || null, resolvedAt, id, tenantId]
    );

    res.status(200).json({ success: true, message: 'Feedback resolution updated' });
  } catch (error) {
    console.error('Error updating feedback resolution:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

/**
 * POST /api/v1/invoices/public/feedback
 * Embedded Digital Receipt Customer Survey Submission
 */
exports.submitFeedback = async (req, res) => {
  try {
    const {
      shortId,
      rating,
      npsScore,
      nps_score,
      surveyTags,
      survey_tags,
      experienceAspects,
      experience_aspects,
      comment,
      routedToGoogle,
      routed_to_google
    } = req.body;

    if (!shortId || !rating) {
      return res.status(400).json({ success: false, error: 'Short ID and star rating are required' });
    }

    const numericRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    const effectiveNps = (npsScore !== undefined ? npsScore : nps_score);
    const parsedNps = (effectiveNps !== undefined && effectiveNps !== null && effectiveNps !== '')
      ? Math.max(0, Math.min(10, parseInt(effectiveNps, 10)))
      : null;

    const rawTags = surveyTags || survey_tags || [];
    const formattedTags = Array.isArray(rawTags) ? rawTags : [];

    const rawAspects = experienceAspects || experience_aspects || {};
    const isRoutedGoogle = Boolean(routedToGoogle || routed_to_google);

    // 1. Lookup the tenant and customer details via invoice shortId
    const [invRows] = await db.query(
      'SELECT tenant_id, customer_phone, receipt_json FROM invoices WHERE short_id = ?',
      [shortId]
    );
    if (invRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { tenant_id, customer_phone, receipt_json } = invRows[0];

    // 2. Fetch tenant profile for survey reward points & store info
    const [tenantRows] = await db.query(
      'SELECT store_name, feedback_enabled, survey_reward_points, google_review_url, google_place_id FROM tenants WHERE id = ?',
      [tenant_id]
    );
    const tenant = tenantRows[0] || {};

    let invNo = shortId;
    let custName = 'Valued Customer';
    try {
      const parsed = typeof receipt_json === 'string' ? JSON.parse(receipt_json) : (receipt_json || {});
      invNo = parsed.InvoiceNumber || parsed.invoiceNumber || parsed.BillNo || shortId;
      custName = parsed.CustomerName || parsed.customerName || 'Valued Customer';
    } catch (e) {}

    // 3. Determine resolution status: 1-3 stars goes to manager resolution queue, 4-5 stars is resolved
    const initialStatus = numericRating <= 3 ? 'pending' : 'resolved';
    const resolvedAt = numericRating >= 4 ? new Date() : null;

    // 4. Record survey response in customer_feedback table
    await db.query(
      `INSERT INTO customer_feedback (
         tenant_id, short_id, invoice_number, customer_phone, customer_name,
         rating, nps_score, survey_tags, experience_aspects, comment,
         routed_to_google, resolution_status, resolved_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id,
        shortId,
        invNo,
        customer_phone,
        custName,
        numericRating,
        parsedNps,
        JSON.stringify(formattedTags),
        JSON.stringify(rawAspects),
        comment ? comment.trim() : null,
        isRoutedGoogle ? 1 : 0,
        initialStatus,
        resolvedAt
      ]
    );

    // 5. Reward Loyalty Points to customer if enabled
    let pointsAwarded = 0;
    const rewardPoints = tenant.survey_reward_points !== undefined ? Number(tenant.survey_reward_points) : 25;

    if (rewardPoints > 0 && customer_phone) {
      try {
        const cleanPhone = customer_phone.replace(/\D/g, '');
        // Search for customer with 10-digit suffix or exact phone
        const [custRows] = await db.query(
          `SELECT id, loyalty_points FROM customers 
           WHERE tenant_id = ? AND (phone = ? OR phone LIKE ?) 
           LIMIT 1`,
          [tenant_id, customer_phone, `%${cleanPhone.slice(-10)}`]
        );

        if (custRows.length > 0) {
          const custId = custRows[0].id;
          await db.query(
            'UPDATE customers SET loyalty_points = loyalty_points + ? WHERE id = ? AND tenant_id = ?',
            [rewardPoints, custId, tenant_id]
          );
          pointsAwarded = rewardPoints;
        }
      } catch (custErr) {
        console.warn('[Feedback] Could not credit customer loyalty points:', custErr.message);
      }
    }

    // 6. Invalidate analytics and feedback caches in Redis
    try {
      await redis.del(`analytics:${tenant_id}`);
      await redis.del(`feedback:${tenant_id}`);
      await redis.del(`invoice:${shortId}`);
    } catch (e) {}

    res.status(201).json({
      success: true,
      message: 'Survey feedback submitted successfully',
      rating: numericRating,
      pointsAwarded,
      isPromoter: numericRating >= 4,
      googleReviewUrl: tenant.google_review_url || '',
      storeName: tenant.store_name || 'Retail Store'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ success: false, error: 'Server error submitting feedback' });
  }
};
