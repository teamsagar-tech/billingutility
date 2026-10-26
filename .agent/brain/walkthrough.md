# Universal Activity, Security & Telemetry Logging Walkthrough

We have implemented an end-to-end, enterprise-grade **Universal Activity, Security & Telemetry Logging System** across the RetailNode SaaS platform (`bill.retailnode.in`).

---

## 1. What Was Implemented

### A. Database Schemas (`setupDb.js`)
Created 3 high-performance MySQL tables:
1. **`audit_logs`**:
   - Records authentication and security events (`user_signup`, `login_success`, `login_failed`, `customer_otp_requested`, `customer_login_success`).
   - Stores real client IP, user agent, classified device type (`mobile`, `desktop`, `tablet`), failure reason, actor email/phone/role, and metadata.
2. **`panel_page_views`**:
   - Records screen transitions across merchant and SaaS admin panels.
   - Captures route path, screen title, panel type (`merchant_panel`, `saas_admin`, `customer_portal`, `public`), dwell duration in seconds, browser session UUID, and client IP.
3. **`invoice_views`**:
   - Records every customer view of digital receipts at `/t/{shortId}` or `/i/{shortId}`.
   - Captures view number (1st view, 2nd view...), 30-day Redis IP deduplication (`is_unique_ip`), WhatsApp in-app browser detection (`is_whatsapp_webview`), device type, and referrer.
4. **`invoices.view_count`**:
   - Added `view_count INT DEFAULT 0` column to `invoices` table.

---

### B. Client IP & Device Telemetry Helper (`requestHelper.js`)
- Configured Express with `app.set('trust proxy', true)` in `server.js` for reverse proxy resolution behind Nginx/Cloudflare on `95.135.166.109`.
- Created [requestHelper.js](file:///Users/ratan/Developer/billintegration/digital-invoice-system/backend-api/src/utils/requestHelper.js):
  - Extracts clean client IP from `X-Forwarded-For`, `CF-Connecting-IP`, `X-Real-IP`, or socket remote address.
  - Strips IPv6-mapped IPv4 prefixes (`::ffff:`).
  - Detects device type (`mobile`, `desktop`, `tablet`) and flags WhatsApp in-app WebView (`isWhatsApp`).

---

### C. Asynchronous Audit Service (`auditService.js`)
Created [auditService.js](file:///Users/ratan/Developer/billintegration/digital-invoice-system/backend-api/src/services/auditService.js):
- `logAuthEvent()`: Non-blocking audit logger with Redis counters (`tenant:audit:${tenantId}:${eventName}`, `platform:audit:${eventName}`).
- `logPageView()`: Screen transition logger with popular screen counters in Redis.
- `logInvoiceView()`: Customer receipt open logger with Redis 30-day IP deduplication and atomic view count increments (`UPDATE invoices SET view_count = view_count + 1`).

---

### D. Universal Frontend Route Tracker (`RouteTracker.jsx` & `App.jsx`)
- Created [RouteTracker.jsx](file:///Users/ratan/Developer/billintegration/src/components/RouteTracker.jsx):
  - Mounted directly under `<BrowserRouter>` in [`App.jsx`](file:///Users/ratan/Developer/billintegration/src/App.jsx).
  - Listens to React Router's `useLocation()` for **any** URL transition.
  - Manages browser tab session UUID in `sessionStorage` (`rn_session_id`).
  - Calculates screen dwell duration and sends non-blocking beacon to `POST /api/v1/telemetry/page-view`.
  - Also captures `beforeunload` to record time spent on the final exit screen.
- **Future-Proof**: **Any new page added to `App.jsx` in the future is automatically logged without touching a single line of page code.**

---

### E. User Interface Upgrades

#### 1. SaaS SuperAdmin Platform Panel (`/saas-admin/logs`)
Upgraded the logs tab in [`SaaSAdminPanel.jsx`](file:///Users/ratan/Developer/billintegration/src/pages/SaaSAdminPanel.jsx) into a **Universal Activity & Security Audit Command Center** with 4 interactive sub-views:
- 🛡️ **Security & Auth**: Signups, logins, IPs, status (`✓ SUCCESS` vs `✕ FAILED`), actor, failure reason, device.
- 🧭 **Panel Navigation**: Screen routes, page titles, panel type, staff user, dwell time, client IP.
- 👁️ **Invoice Views**: Digital receipt opens, receipt slug, store name, customer phone, view number (`1st Open (New)` vs `2nd Open`), WhatsApp in-app browser badge.
- ⚡ **Clicks & Engagement**: Existing Google review and social clicks from `action_logs`.
- All views feature live search, pagination, and sortable headers.

#### 2. Merchant Store Panel (`/dashboard/invoices`)
Updated [`InvoicesPage.jsx`](file:///Users/ratan/Developer/billintegration/src/pages/merchant/InvoicesPage.jsx):
- Added **Customer Views** column with live badges (e.g. `👁️ 3 views` or `Unopened`).

---

## 2. Verification & Live Test Results

All verification tests passed with 100% success:

### Test 1: User Signup & Login Auditing
```
User Signup Audit Log in DB:
┌─────────┬───────────────┬───────────┬─────────────────────────────────────┬──────────────────┬─────────────┐
│ (index) │ event_name    │ status    │ actor_email                         │ ip_address       │ device_type │
├─────────┼───────────────┼───────────┼─────────────────────────────────────┼──────────────────┼─────────────┤
│ 0       │ 'user_signup' │ 'success' │ 'merchant_9492@testretailstore.com' │ '114.143.180.22' │ 'desktop'   │
└─────────┴───────────────┴───────────┴─────────────────────────────────────┴──────────────────┴─────────────┘

Audit Logs for User Login in DB:
┌─────────┬─────────────────┬───────────┬─────────────────────────────────────┬────────────────┬─────────────┐
│ (index) │ event_name      │ status    │ actor_email                         │ ip_address     │ device_type │
├─────────┼─────────────────┼───────────┼─────────────────────────────────────┼────────────────┼─────────────┤
│ 0       │ 'login_success' │ 'success' │ 'merchant_9492@testretailstore.com' │ '49.36.120.10' │ 'mobile'    │
└─────────┴─────────────────┴───────────┴─────────────────────────────────────┴────────────────┴─────────────┘
```

### Test 2: Panel Navigation Stream
```
Recent Panel Page Views in DB:
┌─────────┬────┬───────────────────────┬───────────────────────┬──────────────────┬─────────────────┬──────────────────┐
│ (index) │ id │ path                  │ page_title            │ panel_type       │ ip_address      │ duration_seconds │
├─────────┼────┼───────────────────────┼───────────────────────┼──────────────────┼─────────────────┼──────────────────┤
│ 0       │ 2  │ '/dashboard/invoices' │ 'Digital Bill Stream' │ 'merchant_panel' │ '115.112.98.5'  │ 45               │
│ 1       │ 1  │ '/features'           │ 'Platform Features'   │ 'public'         │ '103.21.244.15' │ 12               │
└─────────┴────┴───────────────────────┴───────────────────────┴──────────────────┴─────────────────┴──────────────────┘
```

### Test 3: Customer Digital Receipt Opens & Deduplication
```
Invoice Views in DB:
┌─────────┬────────────┬────────────────┬─────────────┬──────────────┬─────────────────┬─────────────────────┬─────────────┐
│ (index) │ short_id   │ customer_phone │ view_number │ is_unique_ip │ ip_address      │ is_whatsapp_webview │ device_type │
├─────────┼────────────┼────────────────┼─────────────┼──────────────┼─────────────────┼─────────────────────┼─────────────┤
│ 0       │ 'tClfKso9' │ '919876543210' │ 1           │ 1            │ '106.210.35.44' │ 1                   │ 'mobile'    │
│ 1       │ 'tClfKso9' │ '919876543210' │ 2           │ 1            │ '106.210.35.45' │ 0                   │ 'mobile'    │
│ 2       │ 'tClfKso9' │ '919876543210' │ 3           │ 0            │ '106.210.35.44' │ 1                   │ 'mobile'    │
└─────────┴────────────┴────────────────┴─────────────┴──────────────┴─────────────────┴─────────────────────┴─────────────┘

Updated Invoice View Count in DB:
┌─────────┬────────────┬────────────┐
│ (index) │ short_id   │ view_count │
├─────────┼────────────┼────────────┤
│ 0       │ 'tClfKso9' │ 2          │
└─────────┴────────────┴────────────┘
```

### Test 4: Frontend Production Bundle
- Ran `npm run build`: Compiled with 0 errors in 391ms.
