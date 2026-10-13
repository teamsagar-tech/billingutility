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

    console.log('Database tables verified/created successfully.');
  } catch (error) {
    console.error('Error setting up database tables:', error);
  }
};

module.exports = setupDatabase;
