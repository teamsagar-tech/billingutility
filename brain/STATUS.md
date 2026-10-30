# Digital Bills & Invoice System (RetailNode Digital Bills)

## Status: Live & Fully Operational
- **Domains & SEO / Analytics**:
  - Web POS & Merchant Dashboard: `https://bill.retailnode.in`
  - Backend API: `https://bill.retailnode.in/api/v1` (Port 4000, PM2 `bill-backend`)
  - Google Search Console: Property `https://bill.retailnode.in/` registered and managed via service account `retailnode-ai-analyst@sound-district-104009.iam.gserviceaccount.com`.
  - Google Analytics 4: Web stream `G-DR5XYJXXVJ` integrated into `index.html` for invoice views, payments, and portal visits.
- **Tech Stack**: React + Vite, Node.js + Express, MySQL (`digital_invoice`), Redis, Razorpay SDK, WABA WhatsApp API, Resend Email API.
- **Key Modules**:
  1. **Subscription & Payments**:
     - Dedicated **Subscription & Billing** tab in `MerchantDashboard.jsx` under "Manage".
     - Active plan overview card with plan tier (Growth Annual Plan ₹6,000/yr vs Free Trial), status badge, validity countdown, and WhatsApp message quota progress bar.
     - Live Razorpay Checkout integration with instant verification pipeline (`POST /api/v1/payments/verify`) that extends `plan_valid_until` by +365 days and increments `message_quota` by +5,000.
     - Dual-channel payment confirmation receipt dispatch to both Resend Email (`store_email`) and WhatsApp (`store_phone`) via WABA gateway.
     - Verified payment history ledger queryable via `GET /api/v1/payments/history`.
     - Live test receipt dispatch (`POST /api/v1/payments/test-receipt`) for verification without incurring gateway fees.
  2. **Automated Renewal & Expiry Notices (`cronScheduler.js`)**:
     - Automated background runner inspecting expiry dates in IST:
       - **Trial Pre-Expiry (Days 3, 2, 1)**: Dispatches countdown warning emails + WhatsApp notices.
       - **Trial Post-Expiry (Day 5)**: Dispatches win-back offer (save ₹3,000) via Email + WhatsApp.
       - **Growth Plan Renewal (Days 7, 3, 1)**: Dispatches renewal reminders via Email + WhatsApp.
  3. **Store Hub & Google Review Smart Standee**:
     - 10 selectable visual standee themes with tabletop print layout, SVG QR code, and monthly PDF audit reports.
     - Centralized MySQL synchronization between `tenants` and `gmb_locations` (zero MongoDB dependency).
  4. **SaaS Admin Google Review & User Management Hub (`/saas-admin`)**:
     - Dedicated **Google Review & GMB Management** tab (`/saas-admin/gmb`):
       - Locations Directory with Google Place ID, ratings, review counts, 10 theme selections, standee print links, and monthly audit PDF reports.
       - Live Reviews Stream (758 reviews) with rating filters and SuperAdmin review reply modal.
       - Private Negative Feedback Funnel (1-3 star submissions caught before public Google Maps posting) with customer contact and direct WhatsApp chat links.
     - Dedicated **Users & Store Access** tab (`/saas-admin/users`):
       - Full platform & merchant user directory with roles (`superadmin`, `merchant_admin`, `cashier`), assigned store mappings, and credential management.
     - **Dynamic Plan & Package Assignment**:
       - 1-Click "Apply 1-Year Free Promotional Grant" (365 Days) directly from Plan & Validity modal on any tenant store.
       - "1-Year Free Promotional Subscription" published as active promotional campaign on `bill.retailnode.in/pricing`.
       - Resilient dynamic date updates in `updatePricingCampaign` and `updateTenant`.
  5. **Native Gmail "Copy Code" OTP Email Standard (`otp-email-copy-code`)**:
     - Standardized all OTP, PIN, and Password Reset emails across `digital-bills`, `google-review`, `waba-gateway`, `insta-auto`, and `retailnode-v2` to trigger Gmail's native **"Code Requested" + `[7][4][5][3][7][5]` + `Copy code`** header card.
     - Enforces `${firstName}, here's your PIN ${otp}` subject line, `text/plain` multipart body, contiguous `letter-spacing: 0` top-of-body OTP block, and `X-Entity-Ref-ID` anti-threading header.
