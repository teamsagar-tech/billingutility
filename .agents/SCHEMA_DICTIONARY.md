# RetailNode Digital Invoice & Customer Messaging - Database Schema Dictionary

> **CTO RULE:** Before suggesting a new database table or altering existing models, you MUST check this dictionary. Do NOT duplicate existing entities or schemas. Every operational table MUST include `tenant_id` for strict multi-tenant isolation.
>
> **ENVIRONMENT:** MySQL 8.0 with `mysql2/promise` connection pooling. Production Host: `95.135.166.109`, Domain: `bill.retailnode.in`.

---

## Tables List

### 1. `tenants` (Store & Firm Accounts)
Stores the brand/merchant master record, API tokens, quota limits, and messaging credentials.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **store_name**: `VARCHAR(255) NOT NULL` - Name displayed on digital receipts and messages
- **api_token**: `VARCHAR(255) UNIQUE NOT NULL` - Unique POS integration key (e.g. `sk_live_...`)
- **plan_tier**: `VARCHAR(50) DEFAULT 'growth'` - Subscription plan tier: strictly `'trial'` (3-Day Free Trial) or `'growth'` (Annual Growth Plan, ₹6,000 / Year)
- **plan_valid_until**: `DATE NULL` - Subscription license expiry date (defaults to +3 days for trial, +365 days for growth)
- **message_quota**: `INT DEFAULT 1000` - Monthly or lifetime messaging credits
- **messages_used**: `INT DEFAULT 0` - Running counter of sent messages
- **is_active**: `BOOLEAN DEFAULT TRUE` - Tenant status flag (manageable by SuperAdmin)
- **waba_provider**: `ENUM('waba_custom', 'waba_graph') DEFAULT 'waba_custom'` - WhatsApp gateway provider
- **waba_access_token**: `TEXT NULL` - Meta Bearer token or custom gateway API secret
- **phone_number_id**: `VARCHAR(255) NULL` - Meta WABA phone number ID or custom sender ID
- **waba_template_name**: `VARCHAR(100) DEFAULT 'billing_receipt'` - Approved WABA template name
- **logo_url**: `VARCHAR(255) NULL` - Store branding logo URL
- **instagram_url**: `VARCHAR(255) NULL` - Merchant Instagram profile link
- **facebook_url**: `VARCHAR(255) NULL` - Merchant Facebook profile link
- **google_review_url**: `VARCHAR(255) NULL` - Google Business Profile review link for 4+ star ratings
- **google_place_id**: `VARCHAR(100) NULL` - Google Place ID (e.g. `ChIJ...`) for direct `writereview?placeid=` URL generation
- **website_url**: `VARCHAR(255) NULL` - Store official e-commerce or website link
- **youtube_url**: `VARCHAR(255) NULL` - Merchant YouTube channel link
- **store_address**: `VARCHAR(500) NULL` - Physical address of the retail store
- **gstin**: `VARCHAR(25) NULL` - Store GST identification number
- **store_phone**: `VARCHAR(30) NULL` - Store public WhatsApp/calling phone number
- **store_email**: `VARCHAR(100) NULL` - Store customer service email
- **fb_pixel_id**: `VARCHAR(255) NULL` - Merchant Meta Facebook Pixel ID(s), comma-separated for multi-pixel tracking
- **feedback_enabled**: `BOOLEAN DEFAULT TRUE` - Enable/disable interactive feedback star rating
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **updated_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

---

### 2. `users` (Store Staff & SaaS SuperAdmins)
Staff, merchant managers, and platform operators.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NULL` - Nullable for `superadmin` users, foreign key to `tenants(id)` for merchant users
- **email**: `VARCHAR(255) UNIQUE NOT NULL`
- **phone**: `VARCHAR(30) NULL` - User contact mobile number (10-digit clean format)
- **first_name**: `VARCHAR(100) NULL` - User or store owner display name
- **last_name**: `VARCHAR(100) NULL`
- **password_hash**: `VARCHAR(255) NOT NULL` (Bcrypt 10 rounds)
- **password_reset_otp**: `VARCHAR(10) NULL` - 6-digit OTP code for password recovery
- **password_reset_expires**: `DATETIME NULL` - Expiration timestamp for password reset OTP (15-min window)
- **role**: `ENUM('superadmin', 'merchant_admin', 'cashier') DEFAULT 'merchant_admin'`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 2b. `customer_otps` (Shopper Password-Free OTP Authentication)
Temporary 6-digit one-time passcodes for customer bills & loyalty portal authentication (strictly password-free for all shoppers).
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **phone**: `VARCHAR(20) NOT NULL` - 10-digit customer mobile number
- **otp**: `VARCHAR(10) NOT NULL` - 6-digit cryptographic verification code
- **expires_at**: `DATETIME NOT NULL` - 10-minute validity window
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **INDEX**: `idx_cust_otps_phone (phone)`

---

### 3. `global_configs` (SaaS SuperAdmin Platform Settings)
Global platform settings and default provider configurations managed via SuperAdmin SaaS panel.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **config_key**: `VARCHAR(100) UNIQUE NOT NULL` (e.g. `DEFAULT_WABA_PROVIDER`, `WABA_CUSTOM_URL`, `SYSTEM_ALERT_EMAIL`)
- **config_value**: `TEXT NOT NULL`
- **is_secret**: `BOOLEAN DEFAULT FALSE` - Masked in API responses if true
- **updated_by**: `INT NULL` (REFERENCES `users(id)`)
- **updated_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

---

### 4. `customers` (CRM & Demographic Loyalty Profiles)
Aggregated retail shopper profiles per tenant store with demographic lifecycle enrichment.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **phone**: `VARCHAR(20) NOT NULL` - E.164 formatted customer mobile number
- **customer_name**: `VARCHAR(255) NULL` - Customer full legal / display name
- **email**: `VARCHAR(255) NULL` - Customer email address
- **dob**: `DATE NULL` - Customer date of birth for automated birthday greetings & vouchers
- **anniversary_date**: `DATE NULL` - Wedding anniversary date for milestone discounts
- **gender**: `ENUM('m', 'f', 'o') NULL` - Gender classification
- **marital_status**: `ENUM('m', 'u') NULL` - Married ('m') or Unmarried ('u')
- **profession**: `VARCHAR(150) NULL` - Customer occupation / professional background
- **shopping_frequency**: `VARCHAR(50) DEFAULT 'Monthly'` - Preferred purchase interval
- **state**: `VARCHAR(100) DEFAULT 'Maharashtra'` - Customer home state
- **city**: `VARCHAR(100) DEFAULT 'Pune'` - Customer home city
- **spouse_name**: `VARCHAR(150) NULL` - Spouse full name
- **spouse_mobile**: `VARCHAR(20) NULL` - Spouse mobile number
- **spouse_dob**: `DATE NULL` - Spouse birthday
- **child_name**: `VARCHAR(150) NULL` - Child name
- **child_dob**: `DATE NULL` - Child birthday
- **profile_status**: `ENUM('complete', 'incomplete', 'not_exist') DEFAULT 'not_exist'` - Profile enrichment flag
- **opted_out_whatsapp**: `BOOLEAN DEFAULT FALSE` - WhatsApp promotional opt-out flag
- **opted_out_sms**: `BOOLEAN DEFAULT FALSE` - SMS promotional opt-out flag
- **consent_given**: `BOOLEAN DEFAULT TRUE` - DPDP Act 2023 customer messaging consent
- **total_spent**: `DECIMAL(12, 2) DEFAULT 0.00` - Lifetime purchase total
- **loyalty_points**: `INT DEFAULT 0` - Active redeemable loyalty point balance
- **last_visit**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **UNIQUE KEY**: `unique_tenant_customer (tenant_id, phone)`

---

### 4b. `optout_customers` (DPDP Act 2023 & WhatsApp DND Blacklist)
Blacklist of customer phone numbers who have unsubscribed or requested Do Not Disturb (DND).
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **phone**: `VARCHAR(20) NOT NULL` - Unsubscribed mobile number
- **channel**: `ENUM('whatsapp', 'sms', 'all') DEFAULT 'whatsapp'`
- **reason**: `VARCHAR(255) DEFAULT 'Customer requested DND'`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **UNIQUE KEY**: `unique_tenant_optout (tenant_id, phone, channel)`

---

### 5. `invoices` (Digital Receipts Master)
Receipt records ingested from POS terminals (Tally, Busy, Marg, RetailNode ERP).
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **short_id**: `VARCHAR(50) UNIQUE NOT NULL` - 8-character base62 slug (e.g. `https://bill.retailnode.in/t/{short_id}`)
- **invoice_number**: `VARCHAR(100) NULL` - Original POS bill/invoice number
- **customer_phone**: `VARCHAR(20) NOT NULL`
- **bill_total**: `DECIMAL(12, 2) NOT NULL DEFAULT 0.00`
- **tax_amount**: `DECIMAL(12, 2) DEFAULT 0.00`
- **receipt_json**: `JSON NOT NULL` - Full line items, payment modes, cashier, timestamp, discounts
- **file_url**: `VARCHAR(255) NULL` - Optional S3/local PDF copy
- **view_count**: `INT DEFAULT 0` - Number of times receipt link was opened
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **INDEX**: `idx_tenant_phone (tenant_id, customer_phone)`
- **INDEX**: `idx_created_at (created_at)`

---

### 6. `billing_messages` (Customer Messaging Dispatch Log)
Full audit trail of every billing SMS and WhatsApp message dispatched to customers.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **invoice_id**: `INT NOT NULL` (REFERENCES `invoices(id)` ON DELETE CASCADE)
- **customer_phone**: `VARCHAR(20) NOT NULL`
- **gateway**: `ENUM('waba_custom', 'waba_graph', 'sms') NOT NULL`
- **template_name**: `VARCHAR(100) NOT NULL`
- **message_id**: `VARCHAR(255) NULL` - Provider dispatch ID (Meta WAMID or gateway ID)
- **status**: `ENUM('queued', 'sent', 'delivered', 'read', 'failed') DEFAULT 'queued'`
- **error_reason**: `TEXT NULL` - Detailed failure reason if undelivered
- **sent_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **INDEX**: `idx_tenant_status (tenant_id, status)`
- **INDEX**: `idx_invoice_id (invoice_id)`

---

### 7. `loyalty_settings` (Points Engine Rules)
Per-store configuration for loyalty point calculations.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT UNIQUE NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **rupees_per_point**: `INT DEFAULT 100` - e.g. Spend Rs 100 to earn 1 point
- **min_points_redeem**: `INT DEFAULT 500` - Minimum threshold to unlock discount
- **discount_value**: `DECIMAL(10, 2) DEFAULT 50.00` - Discount cash value per redemption slab
- **is_active**: `BOOLEAN DEFAULT TRUE`

---

### 8. `referral_settings` & `referrals` (Word-of-Mouth Engine)
- **referral_settings**:
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT UNIQUE NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **referrer_reward_points**: `INT DEFAULT 500`
  - **referee_discount_value**: `DECIMAL(10, 2) DEFAULT 50.00`
  - **is_active**: `BOOLEAN DEFAULT FALSE`
- **referrals**:
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **referrer_phone**: `VARCHAR(20) NOT NULL`
  - **referee_phone**: `VARCHAR(20) NOT NULL`
  - **status**: `ENUM('pending', 'converted') DEFAULT 'pending'`
  - **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 9. `feedback_settings` & `customer_feedback` (Dissatisfaction Shield & Reputation Engine)
- **feedback_settings**:
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT UNIQUE NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **min_rating_for_google_review**: `INT DEFAULT 4` - 4 or 5 stars routes to Google Review
  - **is_active**: `BOOLEAN DEFAULT TRUE`
- **customer_feedback** (Active feedback ledger):
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **invoice_id**: `INT NULL` (REFERENCES `invoices(id)`)
  - **invoice_number**: `VARCHAR(100) NULL`
  - **customer_name**: `VARCHAR(255) NULL`
  - **customer_phone**: `VARCHAR(20) NOT NULL`
  - **rating**: `INT NOT NULL` (1 to 5)
  - **comment**: `TEXT NULL`
  - **question_title**: `VARCHAR(255) DEFAULT 'How was your shopping experience?'`
  - **resolution_status**: `ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending'` - Proactive Dissatisfaction Shield status
  - **resolution_notes**: `TEXT NULL` - Private notes on customer phone call/apology coupon resolution
  - **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 10. `action_logs` (Customer Engagement & System Audit Trail)
High-throughput ledger tracking user clicks on Google Reviews, social channels, and administrative actions.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (INDEXed)
- **short_id**: `VARCHAR(50) NOT NULL` (INDEXed) - Associated invoice shortId
- **customer_phone**: `VARCHAR(20) NULL` - Customer phone number
- **action_type**: `VARCHAR(50) NOT NULL` - e.g. `google_review_click`, `instagram_click`, `youtube_click`, `facebook_click`
- **metadata**: `JSON NULL` - Request metadata (IP, userAgent, source, destination URL)
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Indexes**: `idx_tenant_action (tenant_id, action_type)`, `idx_short_action (short_id, action_type)`

---

### 11. `campaigns` (WABA & SMS Broadcast Marketing Campaigns)
Records batch marketing broadcasts and lifecycle campaigns dispatched through WABA microservice (`waba.mpocket.in`).
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **waba_campaign_id**: `INT NULL` - ID returned from upstream `waba.mpocket.in/api/store-campaign`
- **title**: `VARCHAR(255) NOT NULL` - Campaign internal name
- **channel**: `ENUM('whatsapp', 'sms') DEFAULT 'whatsapp'`
- **audience**: `VARCHAR(100) DEFAULT 'all'` - Audience segment (`all`, `active`, `vip`, `dormant`, `targeted`)
- **template_name**: `VARCHAR(100) NULL` - Approved WABA template name
- **message_text**: `TEXT NULL` - Promotional copy or template parameters preview
- **coupon_code**: `VARCHAR(50) NULL` - Optional promo discount code
- **bonus_points**: `INT DEFAULT 0`
- **recipient_count**: `INT DEFAULT 0` - Total target customers
- **delivered_count**: `INT DEFAULT 0` - Confirmed delivered receipts
- **read_count**: `INT DEFAULT 0` - Confirmed read receipts
- **failed_count**: `INT DEFAULT 0` - Bounced / failed numbers
- **cost**: `DECIMAL(10,2) DEFAULT 0.00` - Calculated billing cost
- **status**: `ENUM('draft', 'scheduled', 'running', 'completed', 'failed') DEFAULT 'completed'`
- **scheduled_at**: `DATETIME NULL`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 12. `global_configs` (Platform Global Settings & Fallback Gateway)
Platform-wide system configuration for fallback messaging gateway and platform defaults.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **config_key**: `VARCHAR(100) UNIQUE NOT NULL` - e.g. `DEFAULT_WABA_PROVIDER`, `DEFAULT_WABA_PHONE_NUMBER_ID`, `DEFAULT_WABA_ACCESS_TOKEN`, `DEFAULT_WABA_URL`
- **config_value**: `TEXT NOT NULL`
- **is_secret**: `BOOLEAN DEFAULT FALSE`
- **updated_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

---

### 13. `pricing_campaigns` (SaaS Dynamic Pricing & Promo Offers)
Platform-wide promotional campaigns, pricing tiers, and trial duration managed by SuperAdmin in `/saas-admin`.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **campaign_name**: `VARCHAR(150) NOT NULL` - e.g. 'Retail Launch Offer', 'Diwali Festive Sale'
- **plan_tier**: `VARCHAR(50) NOT NULL DEFAULT 'growth'`
- **regular_price**: `DECIMAL(10,2) NOT NULL DEFAULT 9000.00` - Strikethrough regular price (₹)
- **campaign_price**: `DECIMAL(10,2) NOT NULL DEFAULT 6000.00` - Active promotional price (₹)
- **trial_days**: `INT NOT NULL DEFAULT 3` - Free trial duration (Days)
- **badge_text**: `VARCHAR(150) DEFAULT 'SAVE ₹3,000 TODAY (33% OFF)'` - Ribbon badge displayed on pricing card
- **headline**: `VARCHAR(255) DEFAULT 'One Simple Price. All Features Included.'` - Headline for /pricing
- **subheadline**: `TEXT NULL` - Description text on /pricing
- **features_json**: `JSON NULL` - Optional JSON list of plan features
- **is_active**: `BOOLEAN NOT NULL DEFAULT TRUE` - Published active campaign (only 1 active at a time)
- **start_date**: `DATE NULL` - Optional campaign start date
- **end_date**: `DATE NULL` - Optional campaign end date
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **updated_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

