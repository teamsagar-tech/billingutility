const db = require('./database');

const setupDatabase = async () => {
  try {
    // Create Tenants Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_name VARCHAR(255) NOT NULL,
        api_token VARCHAR(255) UNIQUE NOT NULL,
        waba_access_token TEXT,
        phone_number_id VARCHAR(255),
        logo_url VARCHAR(255),
        instagram_url VARCHAR(255),
        facebook_url VARCHAR(255),
        google_review_url VARCHAR(255),
        feedback_enabled BOOLEAN DEFAULT FALSE,
        plan_tier ENUM('starter', 'growth', 'enterprise') DEFAULT 'starter',
        plan_valid_until DATE NULL,
        message_quota INT DEFAULT 1000,
        messages_used INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create Customers (CRM) Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        phone VARCHAR(20) NOT NULL,
        total_spent DECIMAL(10, 2) DEFAULT 0,
        loyalty_points INT DEFAULT 0,
        last_visit TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        UNIQUE KEY unique_tenant_customer (tenant_id, phone)
      )
    `);

    // Create Loyalty Settings Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS loyalty_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT UNIQUE NOT NULL,
        rupees_per_point INT DEFAULT 100,
        min_points_redeem INT DEFAULT 500,
        discount_value DECIMAL(10,2) DEFAULT 50.00,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create Invoices Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        short_id VARCHAR(50) UNIQUE NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        receipt_json JSON NOT NULL,
        file_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create Referral Settings Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS referral_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT UNIQUE NOT NULL,
        referrer_reward_points INT DEFAULT 500,
        referee_discount_value DECIMAL(10,2) DEFAULT 50.00,
        is_active BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create Referrals Tracking Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        referrer_phone VARCHAR(20) NOT NULL,
        referee_phone VARCHAR(20) NOT NULL,
        status ENUM('pending', 'converted') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      )
    `);

    // Create Pricing & Promo Campaigns Table (Dynamic Admin Pricing)
    await db.query(`
      CREATE TABLE IF NOT EXISTS pricing_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_name VARCHAR(150) NOT NULL,
        plan_tier VARCHAR(50) NOT NULL DEFAULT 'growth',
        regular_price DECIMAL(10,2) NOT NULL DEFAULT 9000.00,
        campaign_price DECIMAL(10,2) NOT NULL DEFAULT 6000.00,
        trial_days INT NOT NULL DEFAULT 3,
        badge_text VARCHAR(150) DEFAULT 'SAVE ₹3,000 TODAY (33% OFF)',
        headline VARCHAR(255) DEFAULT 'One Simple Price. All Features Included.',
        subheadline TEXT,
        features_json JSON,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        start_date DATE NULL,
        end_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure billing_messages table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS billing_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        invoice_id INT NULL,
        campaign_id INT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        gateway VARCHAR(50) DEFAULT 'waba_custom',
        dispatch_format VARCHAR(50) DEFAULT 'template_pdf',
        template_name VARCHAR(100) NULL,
        message_id VARCHAR(100) NULL,
        status ENUM('queued', 'sent', 'delivered', 'read', 'failed') DEFAULT 'sent',
        error_reason TEXT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_bm_tenant_phone (tenant_id, customer_phone),
        INDEX idx_bm_status (status)
      )
    `);

    // Ensure customer_feedback table exists (Embedded Digital Receipt Surveys & Ratings)
    await db.query(`
      CREATE TABLE IF NOT EXISTS customer_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        short_id VARCHAR(50) NULL,
        invoice_number VARCHAR(100) NULL,
        customer_phone VARCHAR(20) NULL,
        customer_name VARCHAR(150) NULL,
        rating INT NOT NULL,
        nps_score TINYINT NULL,
        survey_tags JSON NULL,
        experience_aspects JSON NULL,
        comment TEXT NULL,
        routed_to_google TINYINT(1) DEFAULT 0,
        resolution_status ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending',
        resolution_notes TEXT NULL,
        resolved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_cf_tenant (tenant_id),
        INDEX idx_cf_short_id (short_id),
        INDEX idx_cf_phone (customer_phone),
        INDEX idx_cf_status (resolution_status)
      )
    `);

    // Ensure global_configs table exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS global_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT NOT NULL,
        is_secret BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Ensure audit_logs table exists (Security, Auth, Signups & Admin Actions)
    await db.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NULL,
        user_id INT NULL,
        event_category ENUM('auth', 'security', 'billing', 'settings', 'admin', 'customer') NOT NULL DEFAULT 'auth',
        event_name VARCHAR(100) NOT NULL,
        status ENUM('success', 'failed', 'warning') DEFAULT 'success',
        actor_email VARCHAR(255) NULL,
        actor_phone VARCHAR(30) NULL,
        actor_role VARCHAR(50) NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        device_type VARCHAR(50) NULL,
        failure_reason VARCHAR(255) NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_audit_tenant (tenant_id, created_at),
        INDEX idx_audit_event (event_name, created_at),
        INDEX idx_audit_ip (ip_address)
      )
    `);

    // Ensure panel_page_views table exists (Universal Screen Telemetry & Navigation Stream)
    await db.query(`
      CREATE TABLE IF NOT EXISTS panel_page_views (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NULL,
        user_id INT NULL,
        session_id VARCHAR(64) NOT NULL,
        panel_type ENUM('merchant_panel', 'saas_admin', 'customer_portal', 'public') NOT NULL,
        path VARCHAR(255) NOT NULL,
        page_title VARCHAR(150) NULL,
        referrer VARCHAR(255) NULL,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        device_type VARCHAR(50) NULL,
        duration_seconds INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ppv_tenant_time (tenant_id, created_at),
        INDEX idx_ppv_path (path),
        INDEX idx_ppv_session (session_id)
      )
    `);

    // Ensure invoice_views table exists (Customer Receipt Views & Frequency Tracking)
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoice_views (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        invoice_id INT NULL,
        short_id VARCHAR(50) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        view_number INT NOT NULL DEFAULT 1,
        is_unique_ip BOOLEAN DEFAULT TRUE,
        ip_address VARCHAR(45) NOT NULL,
        user_agent VARCHAR(500) NULL,
        is_whatsapp_webview BOOLEAN DEFAULT FALSE,
        device_type VARCHAR(50) DEFAULT 'mobile',
        referrer VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_iv_short_id (short_id, created_at),
        INDEX idx_iv_tenant (tenant_id, created_at),
        INDEX idx_iv_phone (customer_phone)
      )
    `);

    // Ensure action_logs table exists (Interactive Clicks: Google Reviews, Social Channels)
    await db.query(`
      CREATE TABLE IF NOT EXISTS action_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        short_id VARCHAR(50) NULL,
        customer_phone VARCHAR(20) NULL,
        action_type VARCHAR(50) NOT NULL,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant_action (tenant_id, action_type),
        INDEX idx_short_action (short_id, action_type)
      )
    `);

    // Safe Alterations for tenants table (Supports Owner Bill Dispatch Choice)
    const tenantColumns = [
      { col: 'waba_provider', type: "ENUM('waba_custom', 'waba_graph') DEFAULT 'waba_custom'" },
      { col: 'waba_template_name', type: "VARCHAR(100) DEFAULT 'retailnode_consultation_v2'" },
      { col: 'bill_dispatch_format', type: "ENUM('template_pdf', 'template_image', 'template_text', 'text_link') DEFAULT 'template_pdf'" },
      { col: 'pdf_template_name', type: "VARCHAR(100) DEFAULT 'billing_pdf_receipt'" },
      { col: 'image_template_name', type: "VARCHAR(100) DEFAULT 'invoice_sample'" },
      { col: 'custom_bill_image_url', type: "VARCHAR(500) NULL" },
      { col: 'plan_tier', type: "ENUM('starter', 'growth', 'enterprise', 'trial') DEFAULT 'starter'" },
      { col: 'plan_valid_until', type: "DATE NULL" },
      { col: 'message_quota', type: "INT DEFAULT 1000" },
      { col: 'messages_used', type: "INT DEFAULT 0" },
      { col: 'is_active', type: "BOOLEAN DEFAULT TRUE" },
      { col: 'resend_api_key', type: "VARCHAR(255) NULL" },
      { col: 'resend_from_email', type: "VARCHAR(255) NULL" },
      { col: 'resend_from_name', type: "VARCHAR(255) NULL" },
      { col: 'email_billing_enabled', type: "BOOLEAN DEFAULT FALSE" },
      { col: 'survey_reward_points', type: "INT DEFAULT 25" },
      { col: 'google_place_id', type: "VARCHAR(150) NULL" },
      { col: 'store_email', type: "VARCHAR(150) NULL" },
      { col: 'store_phone', type: "VARCHAR(50) NULL" },
      { col: 'store_address', type: "TEXT NULL" },
      { col: 'website_url', type: "VARCHAR(255) NULL" },
      { col: 'youtube_url', type: "VARCHAR(255) NULL" },
      { col: 'gstin', type: "VARCHAR(25) NULL" },
      { col: 'fb_pixel_id', type: "VARCHAR(255) NULL" }
    ];

    for (const item of tenantColumns) {
      try {
        await db.query(`ALTER TABLE tenants ADD COLUMN ${item.col} ${item.type}`);
      } catch (err) {
        // Error code 1060 is ER_DUP_FIELDNAME (column already exists)
        if (err.errno !== 1060 && !err.message.includes('Duplicate column name')) {
          console.warn(`[Migration] Note on tenants.${item.col}:`, err.message);
        }
      }
    }

    // Safe Alterations for customers table (Customer Profile & Demographics)
    const customerColumns = [
      { col: 'customer_name', type: "VARCHAR(255) NULL" },
      { col: 'email', type: "VARCHAR(255) NULL" },
      { col: 'dob', type: "DATE NULL" },
      { col: 'anniversary_date', type: "DATE NULL" },
      { col: 'gender', type: "ENUM('m', 'f', 'o') DEFAULT 'm'" },
      { col: 'marital_status', type: "ENUM('m', 'u') DEFAULT 'u'" },
      { col: 'profession', type: "VARCHAR(150) NULL" },
      { col: 'shopping_frequency', type: "VARCHAR(50) DEFAULT 'Monthly'" },
      { col: 'address', type: "TEXT NULL" },
      { col: 'city', type: "VARCHAR(100) NULL" },
      { col: 'state', type: "VARCHAR(100) DEFAULT 'Maharashtra'" },
      { col: 'pincode', type: "VARCHAR(20) NULL" },
      { col: 'spouse_name', type: "VARCHAR(150) NULL" },
      { col: 'spouse_mobile', type: "VARCHAR(20) NULL" },
      { col: 'spouse_dob', type: "DATE NULL" },
      { col: 'child_name', type: "VARCHAR(150) NULL" },
      { col: 'child_dob', type: "DATE NULL" },
      { col: 'profile_status', type: "ENUM('complete', 'incomplete', 'not_exist') DEFAULT 'incomplete'" },
      { col: 'opted_out_whatsapp', type: "BOOLEAN DEFAULT FALSE" },
      { col: 'opted_out_sms', type: "BOOLEAN DEFAULT FALSE" },
      { col: 'consent_given', type: "BOOLEAN DEFAULT TRUE" }
    ];

    for (const item of customerColumns) {
      try {
        await db.query(`ALTER TABLE customers ADD COLUMN ${item.col} ${item.type}`);
      } catch (err) {
        if (err.errno !== 1060 && !err.message.includes('Duplicate column name')) {
          console.warn(`[Migration] Note on customers.${item.col}:`, err.message);
        }
      }
    }

    // Safe Alterations for users table (Authentication & Password Reset)
    const userColumns = [
      { col: 'phone', type: "VARCHAR(30) NULL" },
      { col: 'first_name', type: "VARCHAR(100) NULL" },
      { col: 'last_name', type: "VARCHAR(100) NULL" },
      { col: 'role', type: "ENUM('superadmin', 'merchant_admin', 'cashier') DEFAULT 'merchant_admin'" },
      { col: 'password_reset_otp', type: "VARCHAR(10) NULL" },
      { col: 'password_reset_expires', type: "DATETIME NULL" }
    ];

    for (const item of userColumns) {
      try {
        await db.query(`ALTER TABLE users ADD COLUMN ${item.col} ${item.type}`);
      } catch (err) {
        if (err.errno !== 1060 && !err.message.includes('Duplicate column name')) {
          console.warn(`[Migration] Note on users.${item.col}:`, err.message);
        }
      }
    }

    // Safe Alterations for billing_messages table (WhatsApp Dispatch Engine)
    const messageColumns = [
      { col: 'dispatch_format', type: "VARCHAR(50) DEFAULT 'template_pdf'" },
      { col: 'campaign_id', type: "INT NULL" }
    ];

    for (const item of messageColumns) {
      try {
        await db.query(`ALTER TABLE billing_messages ADD COLUMN ${item.col} ${item.type}`);
      } catch (err) {
        if (err.errno !== 1060 && !err.message.includes('Duplicate column name')) {
          console.warn(`[Migration] Note on billing_messages.${item.col}:`, err.message);
        }
      }
    }

    // Safe Alterations for customer_feedback table (Surveys, NPS & Resolution)
    const feedbackColumns = [
      { col: 'short_id', type: 'VARCHAR(50) NULL' },
      { col: 'invoice_number', type: 'VARCHAR(100) NULL' },
      { col: 'customer_name', type: 'VARCHAR(150) NULL' },
      { col: 'nps_score', type: 'TINYINT NULL' },
      { col: 'survey_tags', type: 'JSON NULL' },
      { col: 'experience_aspects', type: 'JSON NULL' },
      { col: 'routed_to_google', type: 'TINYINT(1) DEFAULT 0' },
      { col: 'resolution_status', type: "ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending'" },
      { col: 'resolution_notes', type: 'TEXT NULL' },
      { col: 'resolved_at', type: 'DATETIME NULL' }
    ];

    for (const item of feedbackColumns) {
      try {
        await db.query(`ALTER TABLE customer_feedback ADD COLUMN ${item.col} ${item.type}`);
      } catch (err) {
        if (err.errno !== 1060 && !err.message.includes('Duplicate column name')) {
          console.warn(`[Migration] Note on customer_feedback.${item.col}:`, err.message);
        }
      }
    }

    // Safe Alterations for invoices table (Receipt View Counter)
    try {
      await db.query('ALTER TABLE invoices ADD COLUMN view_count INT DEFAULT 0');
    } catch (err) {
      if (err.errno !== 1060 && !err.message.includes('Duplicate column name')) {
        console.warn('[Migration] Note on invoices.view_count:', err.message);
      }
    }

    // Seed default global configs if not present
    await db.query(`
      INSERT INTO global_configs (config_key, config_value)
      VALUES 
        ('DEFAULT_WABA_PROVIDER', 'waba_custom'),
        ('DEFAULT_WABA_PHONE_NUMBER_ID', '361462453714220'),
        ('DEFAULT_WABA_ACCESS_TOKEN', 'Vpv6mesdUaY3XHS6BKrM0XOdIoQu4ygTVaHmpKMNb29bc1c7')
      ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
    `);

    console.log('Database tables verified/created/migrated successfully.');
  } catch (error) {
    console.error('Error setting up database tables:', error);
  }
};

module.exports = setupDatabase;
