# Universal Audit & Telemetry Logging Architecture

> **Architectural Specification & Implementation Blueprint**  
> **Platform:** RetailNode Digital Invoice & Customer Messaging SaaS (`bill.retailnode.in`)  
> **Role:** CTO & Lead Enterprise SaaS Architect  
> **Target Status:** Proposed for User Approval  

---

## 1. Executive Summary & Objective

The objective is to implement an enterprise-grade, non-blocking **Universal Activity & Security Audit Logging System** across the RetailNode SaaS platform. 

The system will automatically log and audit:
1. **User Signups**: Merchant store registration timestamp, client IP, user agent, store name, user ID, tenant ID.
2. **User Logins**: Every login attempt (merchant admin, superadmin, cashier, customer OTP), client IP, timestamp, success/fail status, failure reason.
3. **Panel Navigation**: Every page visited within `/dashboard/*` (merchant panel) and `/saas-admin/*` (SaaS panel), page dwell time, session ID, user ID.
4. **Future-Proof Extensibility**: Zero manual instrumentation required for future pages; any newly added route in React Router will automatically log navigation events via a centralized listener.
5. **Customer Digital Receipt Views**: Number of times each invoice (`/t/{shortId}`) is opened, client IP, WhatsApp in-app browser vs Chrome/Safari, device type, timestamp, referrer, and view counter increments.
6. **Platform Performance Guarantee**: All telemetry logging will be strictly non-blocking (`setImmediate` / Redis-buffered) to preserve our **< 150ms POS ingestion** and **< 5ms cached receipt delivery**.

---

## 2. High-Level System Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                    CLIENT DEVICES                      │
                  │  (Merchant Desktop / Cashier POS / Customer WhatsApp)  │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
               [Frontend App]                                  [Public Receipt]
           React Router (Vite SPA)                          /t/:slug & /i/:slug
                      │                                               │
             ┌────────┴────────┐                                      │
             │ <RouteTracker>  │                                      │
             │ Global Listener │                                      │
             └────────┬────────┘                                      │
                      │ (Auto Page-View Beacon)                       │ (Invoice GET / Track)
                      ▼                                               ▼
     ┌───────────────────────────────────────────────────────────────────────┐
     │                      NGINX REVERSE PROXY                              │
     │   `trust proxy = true` -> Extracts real client IP via X-Forwarded-For │
     └───────────────────────────────────┬───────────────────────────────────┘
                                         │
     ┌───────────────────────────────────▼───────────────────────────────────┐
     │                     EXPRESS BACKEND API (:4000)                       │
     │                                                                       │
     │  ┌─────────────────────────┐           ┌───────────────────────────┐  │
     │  │  auditMiddleware (API)  │           │   telemetryController     │  │
     │  │  Intercepts Auth/Admin  │           │   Page Views & Analytics  │  │
     │  └────────────┬────────────┘           └─────────────┬─────────────┘  │
     │               │                                      │                │
     │               └──────────────────┬───────────────────┘                │
     │                                  │ (Non-blocking async dispatch)      │
     │                                  ▼                                    │
     │                       ┌──────────────────────┐                        │
     │                       │ auditService.log()   │                        │
     │                       └──────────┬───────────┘                        │
     └──────────────────────────────────┼────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
                    ▼                                       ▼
     ┌───────────────────────────────┐     ┌─────────────────────────────────┐
     │       REDIS IN-MEMORY         │     │         MYSQL 8.0 AUDIT         │
     │  - Real-time counters         │     │  - audit_logs (auth/security)   │
     │  - Session deduplication      │     │  - panel_page_views (navigation)│
     │  - Rate-limiting throttles    │     │  - invoice_views (receipt hits) │
     └───────────────────────────────┘     │  - action_logs (clicks/reviews) │
                                           └─────────────────────────────────┘
```

---

## 3. Database Schema Design (ACID & Multi-Tenant Isolated)

To ensure high performance and clean isolation, we propose three specialized tables alongside the existing `action_logs`:

### Table 1: `audit_logs` (Authentication & Critical Security Events)
Tracks signups, logins, password resets, API token rotations, and sensitive configuration modifications.
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,                      -- Nullable for superadmin or failed unknown logins
  user_id INT NULL,                        -- ID of user performing the action
  event_category ENUM('auth', 'security', 'billing', 'settings', 'admin') NOT NULL,
  event_name VARCHAR(100) NOT NULL,        -- 'user_signup', 'login_success', 'login_failed', 'logout', 'token_rotated'
  status ENUM('success', 'failed', 'warning') DEFAULT 'success',
  actor_email VARCHAR(255) NULL,           -- Target email or attempted username
  actor_phone VARCHAR(30) NULL,            -- Mobile number used
  actor_role VARCHAR(50) NULL,             -- 'merchant_admin', 'superadmin', 'cashier'
  ip_address VARCHAR(45) NOT NULL,         -- IPv4 or IPv6
  user_agent VARCHAR(500) NULL,            -- Browser & platform string
  device_type VARCHAR(50) NULL,            -- 'desktop', 'mobile', 'tablet'
  failure_reason VARCHAR(255) NULL,        -- e.g. 'invalid_password', 'user_not_found'
  metadata JSON NULL,                      -- Additional payload details
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_tenant (tenant_id, created_at),
  INDEX idx_audit_event (event_name, created_at),
  INDEX idx_audit_ip (ip_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table 2: `panel_page_views` (Panel Navigation & Screen Telemetry)
Tracks merchant and SaaS panel screen usage, frequency, and dwell time.
```sql
CREATE TABLE IF NOT EXISTS panel_page_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NULL,                      -- Store ID (NULL for SuperAdmin panel)
  user_id INT NULL,                        -- Logged-in user
  session_id VARCHAR(64) NOT NULL,         -- Browser session UUID
  panel_type ENUM('merchant_panel', 'saas_admin', 'customer_portal') NOT NULL,
  path VARCHAR(255) NOT NULL,              -- e.g. '/dashboard/invoices', '/saas-admin/stores'
  page_title VARCHAR(150) NULL,            -- e.g. 'Invoices Stream'
  referrer VARCHAR(255) NULL,              -- Previous internal route
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(500) NULL,
  device_type VARCHAR(50) NULL,            -- 'mobile', 'desktop'
  duration_seconds INT DEFAULT 0,          -- Seconds spent on page before next navigation
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ppv_tenant_time (tenant_id, created_at),
  INDEX idx_ppv_path (path),
  INDEX idx_ppv_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table 3: `invoice_views` (End-Customer Digital Receipt Open Audit)
Tracks every customer view of digital receipts at `/t/{shortId}` or `/i/{shortId}`.
```sql
CREATE TABLE IF NOT EXISTS invoice_views (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,                  -- Store ID
  invoice_id INT NULL,                     -- Foreign key to invoices.id
  short_id VARCHAR(50) NOT NULL,           -- Unique short code
  customer_phone VARCHAR(20) NOT NULL,     -- Customer phone associated with bill
  view_number INT NOT NULL DEFAULT 1,      -- 1st view, 2nd view, 3rd view for this specific bill
  is_unique_ip BOOLEAN DEFAULT TRUE,       -- Flag if this IP hasn't viewed this bill before
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(500) NULL,
  is_whatsapp_webview BOOLEAN DEFAULT FALSE, -- WhatsApp In-App Browser detection
  device_type VARCHAR(50) DEFAULT 'mobile',
  referrer VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_iv_short_id (short_id, created_at),
  INDEX idx_iv_tenant (tenant_id, created_at),
  INDEX idx_iv_phone (customer_phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 4. Middleware & Backend Ingestion Engine

### A. Reverse Proxy IP Extractor
Configure Express to properly read the client IP through Nginx/Cloudflare on `95.135.166.109`:
```javascript
// in server.js
app.set('trust proxy', true);

// in utils/requestHelper.js
function extractClientInfo(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] || req.socket.remoteAddress || req.ip || '127.0.0.1');
  const userAgent = req.headers['user-agent'] || '';
  
  // Lightweight device classification
  const isMobile = /mobile|iphone|android|ipad/i.test(userAgent);
  const isWhatsApp = /whatsapp/i.test(userAgent);
  const deviceType = isMobile ? 'mobile' : 'desktop';

  return { ip, userAgent, isWhatsApp, deviceType };
}
```

### B. Authentication Logging Hooks
Directly integrate non-blocking audit records into `authController.js`:
- **On Signup (`/api/v1/auth/register`)**:
  - Automatically records `audit_logs` record with `event_name = 'user_signup'`, IP, device, store name, generated `tenant_id`, and `user_id`.
- **On Login (`/api/v1/auth/login`)**:
  - On Successful Login: logs `login_success` with IP, timestamp, role, user_id, tenant_id.
  - On Failed Login: logs `login_failed` with IP, timestamp, attempted email/phone, failure reason (`invalid_credentials`, `user_not_found`).
- **On Customer OTP Request & Verification**:
  - Audits customer login attempts on `/my-bills` and `/t/{shortId}`.

### C. Universal Page-View Telemetry Endpoint
Create an ultra-lightweight endpoint:
- `POST /api/v1/telemetry/page-view`
- Accepts: `{ path, pageTitle, referrer, sessionId, duration }`
- Extracts caller from JWT (if logged in) or session token.
- Inserts asynchronously into `panel_page_views`.
- Responds with `204 No Content` in < 2ms so client navigation is instantaneous.

### D. Digital Receipt View Incrementor & Logger
In `invoiceController.getInvoice`:
1. Check Redis for past IP views of this `shortId` to determine if view is unique.
2. Increment `invoices.view_count = view_count + 1`.
3. In a background `setImmediate`, write an entry to `invoice_views` with `short_id`, `customer_phone`, `ip_address`, `is_whatsapp_webview`, and timestamp.
4. Return invoice JSON immediately to the customer without waiting for MySQL write!

---

## 5. Frontend Automatic Route Tracking ("Will continue even if we add new pages")

To satisfy the user requirement that logging **"will continue even if we implement new pages"**, we do NOT add logging code to individual page components.

Instead, we create a centralized **`<RouteTracker />`** component placed at the root level of `src/App.jsx` right inside `<BrowserRouter>`:

```jsx
// src/components/RouteTracker.jsx
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function RouteTracker() {
  const location = useLocation();
  const lastPathRef = useRef(location.pathname);
  const pageStartTimeRef = useRef(Date.now());

  useEffect(() => {
    const currentPath = location.pathname;
    const dwellDuration = Math.round((Date.now() - pageStartTimeRef.current) / 1000);

    // Send telemetry for current route transition
    sendPageBeacon({
      path: currentPath,
      referrer: lastPathRef.current,
      duration: dwellDuration,
      pageTitle: document.title || currentPath
    });

    // Reset tracking pointers
    lastPathRef.current = currentPath;
    pageStartTimeRef.current = Date.now();
  }, [location.pathname, location.search]);

  return null;
}
```

### Why this satisfies the requirement:
- Any new route registered in `App.jsx` (`<Route path="/dashboard/new-feature" ... />`) automatically triggers `useLocation()`.
- The developer never needs to remember to add tracking code to `NewFeature.jsx`.
- It works for merchant pages, admin pages, customer bill pages, and public marketing pages.

---

## 6. UI Visualization & Dashboards

### 1. SaaS SuperAdmin Platform Panel (`/saas-admin/logs`)
Upgrade the existing logs tab to a comprehensive **Audit & Security Command Center**:
- **Sub-tab 1: Security & Auth Logs** (Signups, Logins, IP Addresses, Failed Attempts, Geolocation hints).
- **Sub-tab 2: Panel Navigation Stream** (Staff/Merchant page visits, frequency, session dwell time, popular screens).
- **Sub-tab 3: Customer Invoice Open Stream** (Real-time feed of shoppers opening receipts on WhatsApp, device types, view counts).
- **Sub-tab 4: Action & Engagement Clicks** (Google reviews, social link clicks).
- **Search & Filters**: Filter by Store Name, IP Address, Action Type, Date Range.

### 2. Merchant Store Panel (`/dashboard`)
Give retail store owners full visibility into their operations:
- **Invoices Table (`/dashboard/invoices`)**: Add a dynamic **"Customer Opens"** column badge showing:
  - e.g. `👁️ 3 Views (Opened via WhatsApp Mobile)`
  - Hover or click to open a modal detailing each view: "First opened Oct 15 at 11:20 AM from Mobile, Last opened 5 mins ago".
- **Store Settings / Security Tab**:
  - "Recent Login Activity": Lists recent logins to their store account with IP, device, and timestamp.

---

## 7. Step-by-Step Implementation Roadmap (Upon Approval)

1. **Step 1: Database Setup & Migrations**
   - Update `setupDb.js` to create `audit_logs`, `panel_page_views`, and `invoice_views`.
   - Update `.agents/SCHEMA_DICTIONARY.md` and `HISTORY.md`.
2. **Step 2: Backend Telemetry & Ingestion Services**
   - Create `src/utils/requestHelper.js` for reverse proxy IP & device detection.
   - Create `src/services/auditService.js` for asynchronous, batch-safe database logging.
   - Create `src/controllers/telemetryController.js` and route `POST /api/v1/telemetry/page-view`.
   - Update `authController.js` for signup and login logging.
   - Update `invoiceController.js` to record invoice views asynchronously.
3. **Step 3: Frontend Universal Route Tracker**
   - Create `src/components/RouteTracker.jsx`.
   - Mount `<RouteTracker />` inside `<BrowserRouter>` in `src/App.jsx`.
4. **Step 4: SaaS SuperAdmin Logs Screen Enhancement**
   - Enhance `/saas-admin/logs` with sub-tab toggles (Auth/Security, Panel Navigation, Invoice Views).
5. **Step 5: Merchant Invoices & Security View**
   - Show view count details and login history in Merchant Dashboard.
6. **Step 6: End-to-End Testing & Verification**
   - Test signup, login, navigation across multiple routes, and invoice opening from mobile/desktop.
   - Verify logs in database and SaaS panel.

---

> **Awaiting User Review & Sign-Off:**  
> Review the architectural plan above. Upon your approval, we will proceed with implementation step-by-step.
