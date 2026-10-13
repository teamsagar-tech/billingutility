# RetailNode Digital Invoice & Customer Messaging - Database Schema Dictionary

> **CTO RULE:** Before suggesting a new database table or altering existing models, you MUST check this dictionary. Do NOT duplicate existing entities or schemas. Every operational table MUST include `tenant_id` for strict multi-tenant isolation.
>
> **ENVIRONMENT:** MySQL 8.0 with `mysql2/promise` connection pooling. Production Host: `95.135.166.109`, Domain: `bill.retailnode.in`.

---

## Tables List

### 1. `tenants` (Store & Firm Accounts)
Stores the brand/merchant master record, API tokens, and messaging credentials.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **store_name**: `VARCHAR(255) NOT NULL` - Name displayed on digital receipts and messages
- **api_token**: `VARCHAR(255) UNIQUE NOT NULL` - Unique POS integration key (e.g. `sk_live_...`)
- **waba_provider**: `ENUM('waba_custom', 'waba_graph') DEFAULT 'waba_custom'` - WhatsApp gateway provider
- **waba_access_token**: `TEXT NULL` - Meta Bearer token or custom gateway API secret
- **phone_number_id**: `VARCHAR(255) NULL` - Meta WABA phone number ID or custom sender ID
- **waba_template_name**: `VARCHAR(100) DEFAULT 'billing_receipt'` - Approved WABA template name
- **logo_url**: `VARCHAR(255) NULL` - Store branding logo URL
- **instagram_url**: `VARCHAR(255) NULL` - Merchant Instagram profile link
- **facebook_url**: `VARCHAR(255) NULL` - Merchant Facebook profile link
- **google_review_url**: `VARCHAR(255) NULL` - Google Business Profile review link for 4+ star ratings
- **feedback_enabled**: `BOOLEAN DEFAULT TRUE` - Enable/disable interactive feedback star rating
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **updated_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`

---

### 2. `users` (Merchant Admin & Cashier Accounts)
Staff and manager authentication credentials.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **email**: `VARCHAR(255) UNIQUE NOT NULL`
- **password_hash**: `VARCHAR(255) NOT NULL` (Bcrypt 10 rounds)
- **role**: `ENUM('owner', 'manager', 'cashier') DEFAULT 'owner'`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 3. `customers` (CRM & Loyalty Profiles)
Aggregated retail shopper profiles per tenant store.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **phone**: `VARCHAR(20) NOT NULL` - E.164 formatted customer mobile number
- **total_spent**: `DECIMAL(12, 2) DEFAULT 0.00` - Lifetime purchase total
- **loyalty_points**: `INT DEFAULT 0` - Active redeemable loyalty point balance
- **last_visit**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
- **UNIQUE KEY**: `unique_tenant_customer (tenant_id, phone)`

---

### 4. `invoices` (Digital Receipts Master)
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

### 5. `billing_messages` (Customer Messaging Dispatch Log)
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

### 6. `loyalty_settings` (Points Engine Rules)
Per-store configuration for loyalty point calculations.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT UNIQUE NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **rupees_per_point**: `INT DEFAULT 100` - e.g. Spend Rs 100 to earn 1 point
- **min_points_redeem**: `INT DEFAULT 500` - Minimum threshold to unlock discount
- **discount_value**: `DECIMAL(10, 2) DEFAULT 50.00` - Discount cash value per redemption slab
- **is_active**: `BOOLEAN DEFAULT TRUE`

---

### 7. `referral_settings` & `referrals` (Word-of-Mouth Engine)
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

### 8. `feedback_settings` & `feedback_responses` (Reputation Engine)
- **feedback_settings**:
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT UNIQUE NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **min_rating_for_google_review**: `INT DEFAULT 4` - 4 or 5 stars routes to Google Review
  - **is_active**: `BOOLEAN DEFAULT TRUE`
- **feedback_responses**:
  - **id**: `INT AUTO_INCREMENT PRIMARY KEY`
  - **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
  - **invoice_id**: `INT NOT NULL` (REFERENCES `invoices(id)` ON DELETE CASCADE)
  - **customer_phone**: `VARCHAR(20) NOT NULL`
  - **rating**: `INT NOT NULL` (1 to 5)
  - **review_text**: `TEXT NULL`
  - **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

---

### 9. `action_logs` (God-Mode Audit Trail)
Immutable ledger of administrative actions and sensitive changes.
- **id**: `INT AUTO_INCREMENT PRIMARY KEY`
- **tenant_id**: `INT NOT NULL` (REFERENCES `tenants(id)` ON DELETE CASCADE)
- **user_id**: `INT NULL` (REFERENCES `users(id)` ON DELETE SET NULL)
- **action**: `VARCHAR(100) NOT NULL` - e.g. `UPDATE_WABA_CREDENTIALS`, `DELETE_CUSTOMER`, `UPDATE_LOYALTY`
- **entity**: `VARCHAR(100) NOT NULL`
- **entity_id**: `VARCHAR(100) NULL`
- **old_values**: `JSON NULL`
- **new_values**: `JSON NULL`
- **ip_address**: `VARCHAR(45) NULL`
- **created_at**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
