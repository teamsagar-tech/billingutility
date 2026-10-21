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
- **waba_account_id**: `VARCHAR(100) NULL` - Upstream WhatsApp Business Account ID (WABA ID) for automated opt-out engine sync (e.g. `420636434456305`)
- **waba_template_name**: `VARCHAR(100) DEFAULT 'retailnode_consultation_v2'` - Approved WABA text template name
- **bill_dispatch_format**: `ENUM('template_pdf', 'template_image', 'template_text', 'text_link') DEFAULT 'template_pdf'` - Merchant's chosen bill delivery format on WhatsApp
- **pdf_template_name**: `VARCHAR(100) DEFAULT 'billing_pdf_receipt'` - Approved document header template for vector Tax Invoice PDF
- **image_template_name**: `VARCHAR(100) DEFAULT 'invoice_sample'` - Approved image header template for receipt card PNG
- **custom_bill_image_url**: `VARCHAR(500) NULL` - Optional custom fallback receipt image URL
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
- **config_key**: `VARCHAR(100) UNIQUE NOT NULL` (e.g. `DEFAULT_WABA_PROVIDER`, `WABA_CUSTOM_URL`, `DEFAULT_RESEND_API_KEY`, `DEFAULT_RESEND_FROM_EMAIL` (`billing@retailnode.in`), `DEFAULT_RESEND_FROM_NAME` (`RetailNode Invoices`), `AUTH_RESEND_FROM_EMAIL` (`auth@retailnode.in`), `AUTH_RESEND_FROM_NAME` (`RetailNode Security`), `SYSTEM_ALERT_EMAIL`)
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
- **source**: `VARCHAR(32) DEFAULT 'manual'` - Opt-out origin: `'waba'` (auto-captured via keyword 'STOP' on waba.mpocket.in) or `'manual'` (merchant added)
- **waba_optout_id**: `INT NULL` - ID corresponding to the record in upstream `opt_out_list` on `waba.mpocket.in`
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
- **dispatch_format**: `ENUM('template_pdf', 'template_image', 'template_text', 'text_link') DEFAULT 'template_pdf'`
- **template_name**: `VARCHAR(100) NOT NULL`
- **message_id**: `VARCHAR(255) NULL` - Provider dispatch ID (Meta WAMID or gateway ID)
- **status**: `ENUM('queued', 'sent', 'delivered', 'read', 'failed') DEFAULT 'queued'`
- **error_reason**: `TEXT NULL` - Detailed failure reason if undelivered
- **sent_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **INDEX**: `idx_tenant_status (tenant_id, status)`
- **INDEX**: `idx_invoice_id (invoice_id)`
- **INDEX**: `idx_message_id (message_id)`

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

### 9. `customer_feedback` & `feedback_settings` (Customer Surveys & Reputation Engine)
- **customer_feedback** (Active survey & review ledger):
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **short_id**: `VARCHAR(50) NULL` (INDEXed) - Associated invoice short ID (`/t/{shortId}`)
  - **invoice_number**: `VARCHAR(100) NULL` - Store invoice number
  - **customer_name**: `VARCHAR(150) NULL` - Customer legal or display name
  - **customer_phone**: `VARCHAR(20) NULL` - Customer mobile number (INDEXed)
  - **rating**: `INT NOT NULL` (1 to 5 Stars)
  - **nps_score**: `TINYINT NULL` - Net Promoter Score recommendation (0 to 10 scale)
  - **survey_tags**: `JSON NULL` - Multi-select aspect chips (e.g. `["⚡ Fast Billing & Checkout", "👔 Courteous & Helpful Staff"]`)
  - **experience_aspects**: `JSON NULL` - Key-value ratings for specific operational aspects
  - **comment**: `TEXT NULL` - Direct customer remarks or improvement suggestions
  - **routed_to_google**: `TINYINT(1) DEFAULT 0` - 1 if 4-5★ promoter was nudged to Google Reviews
  - **resolution_status**: `ENUM('pending', 'in_progress', 'resolved') DEFAULT 'pending'` - Complaint recovery status
  - **resolution_notes**: `TEXT NULL` - Private notes on customer phone call/WhatsApp apology voucher resolution
  - **resolved_at**: `DATETIME NULL` - Resolution timestamp
  - **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **tenants survey attributes**:
  - **feedback_enabled**: `BOOLEAN DEFAULT TRUE` - Master toggle for embedded receipt surveys
  - **survey_reward_points**: `INT DEFAULT 25` - Bonus loyalty points awarded for survey completion
  - **google_review_url**: `VARCHAR(255) NULL` - Target Google review write dialog URL
  - **google_place_id**: `VARCHAR(150) NULL` - Direct Google Place ID for one-click review launch

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

---

### 14. `email_logs` (Resend Email Dispatch Audit Log)
Tracks every transactional email dispatched via Resend API (customer digital bills, test emails, and merchant notifications).
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` - Store foreign key (or 1 for platform SuperAdmin)
- **invoice_id**: `INT NULL` - Linked invoice ID (if email was a bill delivery)
- **recipient_email**: `VARCHAR(255) NOT NULL` - Destination customer or tester email
- **sender_email**: `VARCHAR(255) NOT NULL` - From email header (e.g. `billing@retailnode.in`)
- **subject**: `VARCHAR(255) NOT NULL` - Email subject line
- **resend_email_id**: `VARCHAR(100) NULL` - Upstream Resend unique email dispatch ID
- **status**: `ENUM('sent', 'failed') DEFAULT 'sent'` - Dispatch delivery status
- **is_default_gateway**: `BOOLEAN DEFAULT TRUE` - 1 if platform fallback Resend key was used, 0 if custom tenant key
- **error_reason**: `TEXT NULL` - Resend API rejection error message if status is 'failed'
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 15. `subscription_payments` (Razorpay Merchant Subscription & Quota Payments)
Tracks Razorpay orders, payment signatures, and automated plan activations.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` - Merchant store ID
- **order_id**: `VARCHAR(100) NOT NULL` - Razorpay Order ID (e.g. `order_...`)
- **payment_id**: `VARCHAR(100) NULL` - Razorpay Payment ID (e.g. `pay_...`)
- **signature**: `VARCHAR(255) NULL` - HMAC SHA256 payment verification signature
- **amount**: `DECIMAL(10, 2) NOT NULL DEFAULT 6000.00` - Payment amount in INR
- **currency**: `VARCHAR(10) NOT NULL DEFAULT 'INR'` - ISO currency code
- **plan_tier**: `VARCHAR(50) NOT NULL DEFAULT 'growth'` - Activated tier
- **billing_cycle**: `VARCHAR(50) NOT NULL DEFAULT 'annual'` - Subscription frequency
- **status**: `ENUM('created', 'authorized', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'created'`
- **payment_method**: `VARCHAR(50) NULL` - Card, UPI, NetBanking, etc.
- **receipt_id**: `VARCHAR(100) NULL` - Internal merchant receipt identifier
- **notes**: `JSON NULL` - Additional metadata payload
- **error_message**: `TEXT NULL` - Gateway error message on decline
- **paid_at**: `DATETIME NULL` - Gateway capture confirmation timestamp
- **created_at**: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`
- **updated_at**: `DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
- **Indexes**: `idx_tenant`, `idx_order`, `idx_payment`, `idx_status`

---

## High-Throughput Redis In-Memory Caching Key Dictionary
The platform uses Redis (`127.0.0.1:6379`) to power sub-millisecond data delivery, instant receipt views, and cashier POS throughput:

### 1. Public Digital Receipt Cache
- **Key Pattern**: `invoice:{shortId}`
- **TTL**: 86,400s (24 Hours)
- **Data Structure**: Stringified JSON (`shortId`, `receiptData`, `loyalty`, `createdAt`)
- **Usage**: Serves `https://bill.retailnode.in/t/{shortId}` in < 2ms without hitting MySQL.

### 2. Merchant Invoices Stream Cache
- **Key Pattern**: `store:invoices:{tenantId}`
- **TTL**: 60s
- **Data Structure**: Stringified JSON array of invoices
- **Invalidation**: Cleared automatically on `ingestInvoice` and `createQuickBill`.

### 3. Merchant Customer Directory Cache
- **Key Pattern**: `store:customers:{tenantId}`
- **TTL**: 60s
- **Data Structure**: Stringified JSON array of customer profiles and metrics
- **Invalidation**: Cleared on customer profile save (`saveCustomerProfile`) and new invoice creation.

### 4. Merchant Coupons & Adhoc Offers Cache
- **Key Pattern**: `store:coupons:{tenantId}`
- **TTL**: 60s
- **Data Structure**: Stringified JSON (`data`, `summary`)
- **Invalidation**: Cleared on `createCoupon` and `toggleCoupon`.

### 5. Store Branding & Profile Cache
- **Key Pattern**: `tenant:profile:{tenantId}`
- **TTL**: 3,600s (1 Hour)
- **Data Structure**: Stringified JSON (store name, logo, address, review links, WABA settings)
- **Invalidation**: Cleared on store profile save or admin modification.

### 6. SaaS Admin Platform Stats & Directory Cache
- **Key Pattern**: `admin:platform:analytics`
- **TTL**: 15s
- **Data Structure**: Stringified JSON (store counts, invoice counts, messaging totals, engagement)
- **Invalidation**: Cleared on store provisioning, plan changes, or quota top-ups.

- **Key Pattern**: `admin:tenants:list`
- **TTL**: 30s
- **Data Structure**: Stringified JSON array of all retail stores with plan status and quota usage
- **Invalidation**: Cleared on store provisioning, plan changes, or quota top-ups.

### 7. Customer OTP & Rate Limiting
- **Key Pattern**: `otp:{phone}`
- **TTL**: 600s (10 Minutes)
- **Data Structure**: String (6-digit verification code)

- **Key Pattern**: `rate_limit:otp:{phone}`
- **TTL**: 45s
- **Data Structure**: String ('1') - Enforces anti-spam throttling between OTP requests.

---

### 8. `tenants` WhatsApp Business & Utility Template Columns
- **waba_provider**: `ENUM('waba_custom', 'waba_graph') DEFAULT 'waba_custom'`
- **waba_access_token**: `TEXT NULL` - Tenant-specific `waba.mpocket.in` API token (Meta tokens never stored or accepted here)
- **phone_number_id**: `VARCHAR(100) NULL` - Verified WhatsApp Business Phone Number ID
- **bill_dispatch_format**: `ENUM('template_pdf', 'template_image', 'template_text', 'text_link') DEFAULT 'template_pdf'`
- **pdf_template_name**: `VARCHAR(100) DEFAULT 'retailnode_invoice_pdf'`
- **image_template_name**: `VARCHAR(100) DEFAULT 'retailnode_invoice_image'`
- **custom_bill_image_url**: `TEXT NULL` - Fallback header image URL for receipt card
- **waba_template_name**: `VARCHAR(100) DEFAULT 'retailnode_invoice_summary'` - Quick bill summary template

---

### 9. eCommerce Products & SKU Segmentation (`waba.mpocket.in` Catalog Integration)

Connected directly to the WhatsApp eCommerce catalog schema hosted on `waba.mpocket.in` (`waba_saas.products`):
- **Upstream Table (`waba_saas.products`)**:
  - `id`: `INT AUTO_INCREMENT PRIMARY KEY`
  - `tenant_id`: `INT NOT NULL`
  - `product_name`: `VARCHAR(255) NOT NULL`
  - `product_description`: `TEXT NULL`
  - `product_category`: `VARCHAR(100) DEFAULT 'General'`
  - `price`: `DECIMAL(10,2) NOT NULL`
  - `sale_price`: `DECIMAL(10,2) NULL`
  - `stock_qty`: `INT DEFAULT 0`
  - `availability`: `ENUM('in stock', 'out of stock') DEFAULT 'in stock'`
  - `condition`: `ENUM('new', 'refurbished', 'used') DEFAULT 'new'`
  - `brand`: `VARCHAR(100) NULL`
  - `gtin` / `sku`: `VARCHAR(100) NULL` (Default SKU fallback: `SKU-{id}`)
  - `image`: `VARCHAR(255) NULL` (Relative upload path, data URI, or external URL)
  - `deleted_at`: `DATETIME NULL` (Soft delete tracking)

- **API Endpoints**:
  - `GET /api/v1/products`: Fetches active catalog items, aggregates POS sales metrics (`times_sold`, `units_sold`, `total_revenue`) from `digital_invoice.invoices`, and returns stock valuations.
  - `POST /api/v1/products`: Dispatches multipart/form-data to `waba.mpocket.in/api/products`.
  - `PUT /api/v1/products/:id`: Dispatches multipart updates to `waba.mpocket.in/api/products/:id`.
  - `DELETE /api/v1/products/:id`: Soft-deletes product from catalog on `waba.mpocket.in`.

- **Redis Cache**:
  - **Key Pattern**: `products:list:{tenantId}`
  - **TTL**: 60s (Auto-invalidated on create, update, delete, or when `?refresh=true` is requested).

---

### 10. WhatsApp Message Templates Schema & Deployer (`waba.mpocket.in` & Meta Graph API)

Connected to `waba_saas.message_templates` and Meta WhatsApp Cloud API (`v20.0`):
- **Upstream Table (`waba_saas.message_templates`)**:
  - `id`: `VARCHAR(100) PRIMARY KEY` - Meta Template ID (e.g. `3173313492858274`)
  - `whatsapp_business_account_id`: `VARCHAR(100) NOT NULL`
  - `name`: `VARCHAR(255) NOT NULL` - Unique template identifier (lowercase with underscores)
  - `language`: `VARCHAR(10) DEFAULT 'en'`
  - `category`: `ENUM('UTILITY', 'MARKETING', 'AUTHENTICATION')`
  - `status`: `ENUM('APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED')`
  - `updated_at`: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

- **Endpoints**:
  - `GET /api/v1/auth/waba/templates/status`: Returns all live approved templates from Meta via `waba.mpocket.in/api/tenant/templates/retailnode-status`.
  - `POST /api/v1/auth/waba/templates/deploy`: 1-click batch deployer for standardized retail utility templates (`invoice_pdf`, `invoice_image`, `invoice_summary`, `loyalty_update`).
  - `POST /api/v1/auth/waba/templates/create-custom`: Submits custom templates (Header, Body with variables, Footer, Buttons) directly to Meta Cloud API via `waba.mpocket.in/api/tenant/templates/create-custom`.
  - `GET /api/v1/campaigns/templates`: Returns all live approved marketing and utility templates for campaign broadcast creation with component body text.

---

### 16. `audit_logs` (Security, Authentication & Admin Actions)
Comprehensive audit ledger tracking user registrations, logins, failed authentications, password resets, and critical system events.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NULL` - Nullable for platform superadmin or failed unknown login attempts
- **user_id**: `INT NULL` - User foreign key if authenticated
- **event_category**: `ENUM('auth', 'security', 'billing', 'settings', 'admin', 'customer') NOT NULL DEFAULT 'auth'`
- **event_name**: `VARCHAR(100) NOT NULL` - e.g. `user_signup`, `login_success`, `login_failed`, `customer_otp_requested`, `customer_login_success`
- **status**: `ENUM('success', 'failed', 'warning') DEFAULT 'success'`
- **actor_email**: `VARCHAR(255) NULL` - User email or attempted login username
- **actor_phone**: `VARCHAR(30) NULL` - User or customer mobile number
- **actor_role**: `VARCHAR(50) NULL` - `merchant_admin`, `superadmin`, `cashier`, `customer`
- **ip_address**: `VARCHAR(45) NOT NULL` - Real public IP extracted via reverse proxy (`trust proxy`)
- **user_agent**: `VARCHAR(500) NULL` - Raw browser user-agent string
- **device_type**: `VARCHAR(50) NULL` - `mobile`, `desktop`, `tablet`
- **failure_reason**: `VARCHAR(255) NULL` - Detailed failure cause (e.g. `invalid_password`, `user_not_found`, `invalid_or_expired_otp`)
- **metadata**: `JSON NULL` - Additional context (e.g. `storeName`, `planTier`, `city`, `loginType`)
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Indexes**: `idx_audit_tenant (tenant_id, created_at)`, `idx_audit_event (event_name, created_at)`, `idx_audit_ip (ip_address)`

---

### 17. `panel_page_views` (Universal Panel Navigation & Screen Telemetry)
Automatically logs every screen visited inside `/dashboard/*`, `/saas-admin/*`, or public portals without requiring manual instrumentation on new pages.
- **id**: `BIGINT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NULL` - Store foreign key (NULL for SuperAdmin platform panel)
- **user_id**: `INT NULL` - Authenticated user ID (extracted from JWT)
- **session_id**: `VARCHAR(64) NOT NULL` - Browser tab session UUID
- **panel_type**: `ENUM('merchant_panel', 'saas_admin', 'customer_portal', 'public') NOT NULL`
- **path**: `VARCHAR(255) NOT NULL` - URL pathname + search query (e.g. `/dashboard/invoices`)
- **page_title**: `VARCHAR(150) NULL` - Document title or route descriptor
- **referrer**: `VARCHAR(255) NULL` - Previous internal route in session
- **ip_address**: `VARCHAR(45) NOT NULL` - Real client IP
- **user_agent**: `VARCHAR(500) NULL`
- **device_type**: `VARCHAR(50) NULL` - `mobile`, `desktop`, `tablet`
- **duration_seconds**: `INT DEFAULT 0` - Dwell time spent on screen before navigating away
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Indexes**: `idx_ppv_tenant_time (tenant_id, created_at)`, `idx_ppv_path (path)`, `idx_ppv_session (session_id)`

---

### 18. `invoice_views` (End-Customer Digital Receipt Open Audit)
High-volume audit ledger recording every time an end-customer opens their digital bill at `/t/{shortId}` or `/i/{shortId}`.
- **id**: `BIGINT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` - Store foreign key
- **invoice_id**: `INT NULL` - Linked invoice ID
- **short_id**: `VARCHAR(50) NOT NULL` - Public receipt slug (e.g. `tClfKso9`)
- **customer_phone**: `VARCHAR(20) NOT NULL` - Bill recipient mobile number
- **view_number**: `INT NOT NULL DEFAULT 1` - Cumulative view counter (1st view, 2nd view, 3rd view...)
- **is_unique_ip**: `BOOLEAN DEFAULT TRUE` - 1 if this IP address has not opened this bill before (Redis deduplicated)
- **ip_address**: `VARCHAR(45) NOT NULL` - Shopper public IP address
- **user_agent**: `VARCHAR(500) NULL` - Device browser string
- **is_whatsapp_webview**: `BOOLEAN DEFAULT FALSE` - 1 if opened inside WhatsApp mobile in-app browser
- **device_type**: `VARCHAR(50) DEFAULT 'mobile'`
- **referrer**: `VARCHAR(255) NULL` - e.g. `https://api.whatsapp.com/`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **Indexes**: `idx_iv_short_id (short_id, created_at)`, `idx_iv_tenant (tenant_id, created_at)`, `idx_iv_phone (customer_phone)`


