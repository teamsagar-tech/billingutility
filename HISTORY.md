# Project History & Architectural Log

## Environment Reference
- **Domain**: `bill.retailnode.in`
- **Server IP**: `95.135.166.109`
- **CTO Role**: Lead Enterprise SaaS Architect
- **Repository**: `/Users/ratan/Developer/billintegration`

---

## [2026-10-13] Architectural Audit, CTO Brain Setup & Customer Billing Messaging Initialization

### 1. Context & Motivation
The user requested an architectural audit of what has been developed so far in `digital-invoice-system` and how it relates to `RetailNodeV2`. Additionally, the mission was defined to develop the enterprise customer billing messaging SaaS platform targeting production domain `bill.retailnode.in` on server IP `95.135.166.109`, adopting the identical CTO standards, brain rules, skills, and chat history tracking used in RetailNode.

### 2. Audit of Existing Codebase
- **`backend-api`**:
  - Express.js backend on port 4000.
  - MySQL database with tables for `tenants`, `users`, `customers`, `invoices`, `loyalty_settings`, `referral_settings`, `referrals`.
  - Redis cache under `invoice:{shortId}` (24-hour TTL).
  - Ingestion endpoint `POST /api/v1/invoices/upload` with store API token authentication (`x-api-token`).
  - Public invoice retrieval endpoint `GET /api/v1/invoices/:slug` returning receipt payload, customer loyalty balance, visit history, and store branding.
  - Early-stage WhatsApp dispatch using Meta Graph API with hardcoded `localhost:3000` URLs.
- **`web-receipt`**:
  - Next.js 15+ application on port 3000.
  - Interactive digital receipt at `/t/[slug]` featuring line items, taxes, loyalty badges, referral coupons, star feedback rating, Google review routing, and PDF/WhatsApp sharing.
  - Merchant dashboard at `/dashboard` for analytics, customers, loyalty, referrals, and WABA credentials.
- **`print-agent`**:
  - C# WPF Windows print spooler interceptor for retail POS environments (Tally, Busy, Marg) parsing customer phone, invoice number, and line items from ESC/POS print streams.
- **Marketing App (`billintegration` root)**:
  - React + Vite web application showcasing Digital Bills, CRM, Marketing Automation, Loyalty Programs, and retail industry solutions.
- **RetailNodeV2 ERP Comparison**:
  - RetailNodeV2 possesses 24 strict CTO rules, multi-tenancy (`firm_id`/`tenant_id`), ACID transactions, pessimistic locking (`SELECT ... FOR UPDATE`), and production WABA gateway integrations via `https://waba.mpocket.in` with utility message templates.

### 3. Brain, Rules, and Skills Setup (`.agents/`)
Successfully established the full enterprise brain framework inside the project root:
- `.agents/AGENTS.md`: Full CTO Lead Enterprise SaaS Architect instructions with all 24 strict rules adapted for billing SaaS.
- `.agents/SCHEMA_DICTIONARY.md`: Complete database dictionary including `tenants`, `users`, `customers`, `invoices`, `billing_messages`, `loyalty_settings`, `referrals`, `feedback_responses`, and `action_logs`.
- `.agents/rules/git-sync.md`: Continuous syncing of brain artifacts, plans, and skills.
- `.agents/rules/cto-standards.md`: Plan-First halt protocol, ACID transactions, and keyboard UX standards.
- `.agents/skills/deployment/SKILL.md`: Production deployment SOP targeting `95.135.166.109` and `bill.retailnode.in`.
- `.agents/skills/billing-messaging/SKILL.md`: End-to-end SOP for billing message delivery over WABA (`waba.mpocket.in`), Meta Cloud API, and SMS fallback.
- `.agents/skills/page-creation/SKILL.md` & `.agents/skills/form-accessibility/SKILL.md`: Frontend standards for rapid keyboard navigation and accessibility.
- `.agents/scripts/save_transcript.py` & `.agents/hooks.json`: Automated transcript and plan synchronization.
- `.agents/conversations/`: Transcripts preserved for active (`2ccf087c-9b59-49d3-b5c8-f4393c93c30f`) and historical (`8cfc030c-b5c9-47b2-8b65-41b5cafc7d82`) conversations.
- `.agents/plans/`: Created `architecture_plan.md`, `task.md`, and `walkthrough.md`.

### 5. Architectural Clarification: ERP vs. Billing Utility & Dual Panels
- **ERP Decoupling**: Re-emphasized that RetailNode (`RetailNodeV2`) is the complete ERP system, while this project (`billintegration` / `bill.retailnode.in`) is an ultra-fast, high-concurrency Billing & Customer Messaging Utility SaaS.
- **Dual-Panel Architecture**:
  1. **User Admin Panel (Merchant Dashboard `/dashboard`)**: For retail stores to view billing streams, delivery logs, loyalty points, customer CRM, branding, and integration tokens.
  2. **SaaS SuperAdmin Panel (`/saas-admin`)**: For SaaS operators to manage all tenant accounts, subscription plans, message quotas, global WABA gateways, and multi-store analytics.
- **Rule & Brain Updates**: Updated `AGENTS.md`, `SCHEMA_DICTIONARY.md`, `cto-standards.md`, and `billing-messaging` skill to permanently encode this design.

### 9. Digital Receipt Privacy & Page Title Enforcement (`/i/:slug`)
- **Document Title Format**: Dynamically sets browser tab title to `${invoiceNumber} - ${storeName}` (e.g. `DS-2026-8842 - Deepak Sarees`).
- **Comprehensive Search Engine Crawl Prevention**:
  1. **Nginx HTTP Response Header**: Configured `add_header X-Robots-Tag "noindex, nofollow, noarchive, nosnippet" always;` on `bill.retailnode.in`.
  2. **`robots.txt`**: Added `robots.txt` disallowing all search crawlers (`Googlebot`, `Bingbot`, `*`) from `/i/`, `/t/`, `/api/`, and admin panels.
  3. **HTML Meta Tags**: Injected `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />` and `<meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />` both in `index.html` and dynamically via React `useEffect` in `BillReceipt.jsx`.
- Deployed live to server `95.135.166.109`.

### 10. Client-Side PDF Download, Mobile PDF Communication Share & DPDP Legal Compliance
- **Download Invoice as PDF (Strictly No Browser Print)**:
  - Replaced browser `window.print()` with client-side canvas-to-vector PDF compilation using `html2pdf.js`.
  - Scoped exclusively to the invoice bill container (`#printable-bill`), excluding headers, offer banners, social follow buttons, and review prompts.
  - Automatically names the file `Invoice_${invoiceNumber}.pdf` with high-resolution 2x rendering and crisp typography.
- **Mobile PDF File Sharing with RetailNode Branding**:
  - Integrated the Web Share API Level 2 (`navigator.share` with `files: [pdfFile]`).
  - On mobile devices, clicking "Share Bill" generates the standalone invoice PDF file on the fly and opens the native OS share sheet to share directly into all communication apps (WhatsApp, Telegram, Gmail, SMS, Slack, etc.).
  - Accompanied by a formatted message ending with RetailNode branding:
    ```
    *Invoice #{invoiceNo}*
    Store: {storeName}
    Total: ₹{total}

    View Online Bill:
    {billUrl}

    Powered by RetailNode
    https://retailnode.in
    ```
  - Graceful fallbacks for desktop and non-file-sharing browsers: automatically triggers file download and copies branded invoice text to the clipboard.
- **Invoice PDF Authenticity Footer**:
  - Embedded `Verified Digital Invoice • Powered by RetailNode` at the bottom of the invoice card so exported PDFs carry SaaS provenance and verification details.
- **India DPDP Act 2023 & Meta Terms Legal Pages**:
  - Implemented `/privacy-policy` covering transactional receipts, lack of PII in Meta Pixel event dispatch, customer rights, and data storage on Indian sovereign servers.
  - Implemented `/terms-and-conditions` establishing merchant billing utility rights and anti-spam compliance.
  - Linked across all platform footers (`BillReceipt.jsx`, `UnifiedLogin.jsx`, `Footer.jsx`).
- **Production Deployment**: Built and synchronized to production host `95.135.166.109` at `/var/www/billintegration/dist`.

### 11. 72-Hour Digital Receipt Privacy Gate & Customer Mobile Verification
- **Security Requirement**: Digital receipt URLs (`/i/:slug`) open friction-free for the first 72 hours from invoice generation (for immediate cashier/customer verification via WhatsApp/SMS). After 72 hours, the invoice automatically locks and requires authentication using the customer mobile number assigned to that invoice.
- **Backend Enforcement (`invoiceController.js`)**:
  - In `getInvoice`: Checks `TIMESTAMPDIFF(HOUR, created_at, NOW()) as age_hours`.
  - If `age_hours >= 72`:
    - Checks for signed JWT unlock token (`x-invoice-token` / `Authorization`) or verified customer phone.
    - If unauthorized: withholds all line items, amounts, taxes, and raw phone numbers, returning `{ requiresAuth: true, isLocked: true, maskedPhone: '••••••3210' }`.
  - Added `POST /api/v1/invoices/:slug/unlock`:
    - Normalizes entered phone number against `customer_phone` in the MySQL invoice record.
    - If mismatched: returns `401 Unauthorized` with an explicit access denied error.
    - If matched: generates a 30-day signed JWT token and returns the decrypted invoice payload.
- **Frontend Security Card (`BillReceipt.jsx`)**:
  - When locked, presents a dedicated security lock screen with store branding and badge `72-Hour Security Lock Active`.
  - Prompts: *"Registered to: +91 •••••• {last4}"*.
  - Keyboard-first 10-digit mobile number input with `autoFocus` and Enter key submission.
  - On unlock: caches JWT token and verified phone in `localStorage` for uninterrupted access on that device.
- **Verified in Production**: Tested against live invoice `OOe7oJkM` (> 72 hours) and `JiKSx0qM` (< 72 hours). Deployed and restarted PM2 `bill-backend` (PID 63961) on `95.135.166.109`.

### 12. First-Visit Customer Engagement Modal, Action Tracking & Place ID Direct Review Integration
- **Context & Objectives**:
  - Track every customer click on Google Review, Instagram, and YouTube.
  - Automatically display a high-converting first-visit pop-up prompting customers to leave a 5-Star Google Review, follow on Instagram, or subscribe on YouTube.
  - Eliminate all hardcoded tenant details (store names, phone numbers, search links) to enforce true SaaS multi-tenancy.
  - Support Google Place ID and direct review dialog formats (e.g., `https://search.google.com/local/writereview?placeid={place_id}`) so customers are immediately presented with the star rating and comment dialog.
- **Database & Audit Schema (`action_logs` & `tenants`)**:
  - Created `action_logs` table in `digital_invoice` database with columns `id`, `tenant_id`, `short_id`, `customer_phone`, `action_type`, `metadata`, `created_at`.
  - Added indexes `idx_tenant_action (tenant_id, action_type)` and `idx_short_action (short_id, action_type)` for fast querying.
  - Added `google_place_id VARCHAR(100)` column to `tenants` table.
- **Backend API (`invoiceController.js` & `settingsController.js`)**:
  - Implemented `POST /api/v1/invoices/:slug/track` to record customer actions (`google_review_click`, `instagram_click`, `youtube_click`, `facebook_click`) in `action_logs` and increment real-time Redis counters (`tenant:stats:${tenant_id}:${action}` and `platform:stats:${action}`).
  - Implemented `GET /api/v1/invoices/:slug/track-status` and attached `userActions` (`googleReviewClicked`, `instagramClicked`, `youtubeClicked`) directly to public invoice payloads with sub-millisecond Redis lookups.
  - Updated `settingsController.js` to manage `google_place_id` and `youtube_url` with automatic Redis tenant profile cache invalidation on save.
- **Smart Direct Google Review Resolution (`resolveGoogleReviewUrl`)**:
  - **Google Place ID**: Formats to `https://search.google.com/local/writereview?placeid={PLACE_ID}` to trigger the official 5-star write review modal directly on desktop and mobile.
  - **Raw Place ID Detection**: Automatically recognizes raw IDs starting with `ChIJ` pasted into review URL inputs and converts them to the direct write-review format.
  - **Google Business Profile (`g.page`)**: Automatically ensures `/review` suffix is attached to open the write dialog directly.
  - **Google Search Links**: Automatically ensures `,3` parameter is attached to `#lrd=` to open the review dialog directly.
  - **Google Share Links (`share.google/...` / `maps.app.goo.gl/...`)**: Safely supported and opened.
- **First-Visit Engagement Modal & Action Tracking (`BillReceipt.jsx`)**:
  - Pops up 1.2s after bill load on first customer visit (controlled by `rn_engagement_dismissed_${slug}` and `rn_reviewed_${slug}`).
  - Beautiful glassmorphic UI displaying store logo, verified badge, and dynamic action cards:
    1. ⭐ **Google Review**: 5-star review button opening write dialog directly, tracked in backend and Meta Pixel (`GoogleReviewClick`).
    2. 📸 **Instagram**: Follow button for new arrivals, tracked in backend and Meta Pixel (`InstagramFollowClick`).
    3. ▶️ **YouTube**: Subscribe button for video showcases, tracked in backend and Meta Pixel (`YouTubeSubscribeClick`).
    4. 🌟 **Support on Both/All**: Quick multi-action button.
  - Live visual feedback: Instant green checkmark "✓ Review link opened - Thank you!" upon click.
  - Full keyboard accessibility: Closes gracefully on `Escape` key or backdrop click.
  - Centralized tracking dispatcher (`handleTrackAndOpen`) wired to all on-page Google Review cards, star ratings, and dynamic social sliders.
- **Multi-Tenant Zero-Hardcoding Enforcement**:
  - Purged all hardcoded fallbacks to `'Deepak Sarees'` and hardcoded phone numbers or review URLs.
  - Dynamically extracts all branding attributes from `data.tenantProfile` and `data.receiptData`.
- **Production Deployment & Verification**:
  - Built frontend (`npm run build`) in 451ms.
  - Synchronized frontend `dist/` and backend `src/` to `root@95.135.166.109`.
  - Restarted PM2 `bill-backend` and verified real-time tracking with live test calls logging to MySQL `action_logs` and Redis.

### 13. Dual Admin Panels Implementation & Production Launch
- **Architectural Scope**:
  - Built and deployed the two complete management panels specified in the CTO architecture:
    1. **Merchant / Store User Admin Panel (`/dashboard`)**: For retail store owners, managers, and cashiers to manage billing streams, store branding, Google review engine, WhatsApp WABA configuration, customer CRM, loyalty rules, and POS integration credentials.
    2. **SaaS SuperAdmin Platform Panel (`/saas-admin`)**: For platform operators to monitor system-wide telemetry, onboard new stores, manage message quotas, audit real-time action logs, and configure global gateways.
- **Frontend Implementations**:
  - **`MerchantDashboard.jsx` (`/dashboard`)**:
    - 100% full-width layout without artificial containers.
    - **Header**: Store name badge, active status pill, live WhatsApp credit meter with remaining quota bar, 1-click store API token (`sk_live_...`) copy, and sign out.
    - **Live Billing Stream**: Dense table of invoices with invoice #, date/time, customer phone, total amount (₹), WhatsApp delivery status (`sent`, `delivered`, `read`, `failed`), Google Review badge (`Review Clicked ⭐` vs `Pending`), and direct links to public digital receipts. Includes instant search filter by invoice, phone, or short ID.
    - **Store Branding & Google Reviews Tab**: Complete form to configure store name, address, GSTIN, phone, email, logo URL, Google Place ID (with direct 1-click trigger engine), Google Review/Share URL, Instagram, YouTube, Facebook, and Meta Pixel ID.
    - **WhatsApp Gateway Tab**: Select WABA provider (`waba_custom`, `meta_cloud`, `platform_shared`), token, phone number ID, and template name with instant saving.
    - **Customer CRM & Loyalty Engine Tab**: Displays enrolled customer directory with lifetime spends, total visits, and loyalty points. Form to customize earning rules (Rupees spent per 1 point, redemption thresholds, and discount values).
    - **POS & ERP Interceptor Integration Tab**: Live store secret API token display with copy button, Desktop Print Interceptor Agent download button (`DigitalBillAgent.exe`), and sample cURL invoice ingestion payload for ERP integration.
  - **`SaaSAdminPanel.jsx` (`/saas-admin`)**:
    - Protected by role verification guard (`role === 'superadmin'`).
    - **KPI Telemetry Cards**: Total Stores (Active vs Suspended), Invoices Processed, WhatsApp Messages Sent, and Total Google Review Clicks tracked across all stores.
    - **Tenants Directory Tab**: Dense table of all retail stores with ID, contact info, masked API token, invoice count, message quota usage progress bar, active/suspend toggle button, and "Top-Up Quota" action modal.
    - **Onboard New Retail Store Modal**: Provision new retail tenant in seconds with store name, owner phone, login email, temporary password, and initial quota, auto-generating a unique `sk_live_...` API token.
    - **Platform Action Audit Stream Tab**: Real-time cross-store feed of customer interactions (`google_review_click`, `instagram_click`, `youtube_click`, `otp_login`) with timestamp, store name, short ID, customer phone, and metadata.
    - **Global Gateway Configuration Tab**: Manage default WABA provider (`waba.mpocket.in`), global bearer token, and global phone number ID.
  - **Router Integration (`src/App.jsx`)**:
    - Added routes for `/dashboard` and `/saas-admin`.
    - Integrated with `UnifiedLogin.jsx` routing: SuperAdmin sign-in navigates to `/saas-admin`, Store Admin sign-in navigates to `/dashboard`.
- **Backend APIs & Verification**:
  - Validated SuperAdmin authentication (`admin@retailnode.in`) and Store Admin authentication (`store@deepaksarees.com`).
  - Verified `GET /api/v1/admin/analytics`, `GET /api/v1/auth/invoices`, `GET /api/v1/auth/profile`, and all quota endpoints on production server `95.135.166.109`.
  - Built production bundle (`dist/`) in 567ms and synchronized to `/var/www/billintegration/dist`.
  - Restarted PM2 `bill-backend` on port 4000. Verified HTTP 200 OK across `/login`, `/dashboard`, and `/saas-admin`.
  - **Hotfix: Resolved `ReferenceError: Link is not defined`**: In `src/pages/UnifiedLogin.jsx`, imported `Link` alongside `useNavigate` from `react-router-dom`. Rebuilt bundle (`dist/assets/index-qXczMrSb.js`) and deployed to `95.135.166.109`.
  - **SaaS Admin Panel Light Theme Conversion**: Redesigned `SaaSAdminPanel.jsx` to a crisp, modern enterprise light theme with clean `#ffffff` cards, soft `#e2e8f0` borders, `#f8fafc` background, high-contrast typography (`#0f172a`), refined badge colors, and blur modal backdrops. Deployed bundle `index-C4ud0Cfq.js` to production.

### 14. BillFree Live Merchant Portal Audit & Architecture Replication
- **Live Portal Access & Crawl**:
  - Authenticated into `https://billfree.in/site/login` using credentials `8857808284` / `8857808284` for merchant store *V R Pawar Sarees Chatti Galli*.
  - Crawled and mapped all core internal endpoints:
    - `/dashboard-summary/index`: "Business at a Glance ✨" with Sales overview (Revenue, No. of Bills, AOV, New vs Repeat split bars, Revenue vs Sales trend chart) and multi-color metric cards (Loyalty Points, Feedback Received, Google Page Visited, Profiles Completed).
    - `/digital-bill/index`: Digital billing log.
    - `/profiles/customers`: Customer directory (`#`, `Store`, `Profile Status`, `Customer Name`, `Phone`, `No of visit`, `Lifetime Value`, `Avg Trx. Value`, `Last Bill Value`, `Last Bill Date`).
    - `/feedback/index`: Feedback rating and comment table (`#`, `See Bill`, `Store`, `Question Title`, `Customer Comment`, `Rating`, `Invoice No.`, `User Phone`).
    - `/loyalty-dashboard/index`: Points transactions & redemptions.
    - `/coupon-dashboard/index`: Available, assigned, and redeemed coupons.
    - `/sms-ledger/index`: Promo batch ledgers and WhatsApp/SMS delivery counts.
    - `/gupshup-ss/index`: WhatsApp templates (`Template Name`, `Template ID`, `Category`, `Status`).
    - `/download-center/index` & `/merchant/integration-files`: POS agent files and tokens.
- **Backend Analytics & Feedback Enhancements**:
  - Updated `analyticsController.js` to dynamically compute:
    - `totalRevenue`, `newRevenue`, `repeatRevenue`
    - `totalInvoices`, `newBillsCount`, `repeatBillsCount`
    - `avgOrderValue`
    - `googleReviewsVisited` (queried from `action_logs` where `action_type = 'google_review_click'`)
    - `feedbackReceived` & `avgFeedbackRating`
    - `loyaltyPointsEarned`
  - Created `customer_feedback` table in MySQL (`digital_invoice`) on `95.135.166.109`.
  - Updated `feedbackController.js` with full table queries and shortId invoice lookups.
- **Frontend Merchant Dashboard Upgrade (`MerchantDashboard.jsx`)**:
  - Rebuilt `/dashboard` to match BillFree's executive UX:
    - Left Sidebar with Store Profile (`V R Pawar Sarees` / `Deepak Sarees`), Primary Navigation (Home, Quick Links, Invoices, Customers, Downloads), Rewards (Loyalty, Coupons, Redeem), and Channels (WhatsApp).
    - "Business at a Glance ✨" with Sales KPIs, New vs Repeat percentage split bars, and dual-axis chart (Revenue bars + Sales curve).
    - Multi-color metric cards: Loyalty Points Earned (Purple `#8b5cf6`), Feedback Received (Emerald `#10b981`), Google Page Visited (Crisp white with official Google `G` logo), Profiles Completed gauge, Loyalty Points Redeemed (Amber `#f59e0b`), and Avg Feedback Rating (Sky Blue `#0284c7`).
  - Compiled production bundle (`dist/assets/index-MWu4h6qk.js`) and deployed to `95.135.166.109`.

### 15. Solving User Problems in a Simpler, More Advanced Way Than BillFree
- **Core Philosophy**: BillFree is cluttered with complex POS print drivers, rigid desktop agents, manual CSV uploads, confusing multi-step campaign wizards, passive customer tables, and unaddressed negative ratings. RetailNode Digital Invoice solves these exact retail problems with frictionless simplicity and proactive intelligence.
- **1. Zero-Barrier In-Browser Quick Digital Bill POS (⚡)**:
  - Added in-browser manual billing generator directly in the dashboard sticky top bar.
  - Cashier enters Customer Mobile Number (auto-fills returning customer name from existing directory), Bill Amount, and clicks "Generate & Send WhatsApp Bill ⚡".
  - Endpoint `POST /api/v1/auth/invoices/quick-bill` generates invoice, calculates loyalty points, stores in MySQL + Redis (< 20ms), and dispatches branded WhatsApp receipt immediately. Tested live with short link `OHVrHzYL`.
- **2. Automated RFM Customer Retention Intelligence**:
  - Replaced dumb passive tables with dynamic Recency, Frequency, Monetary (RFM) cohorts calculated on every fetch:
    - 👑 **VIP Champions**: High spend, active visits -> 1-click VIP exclusive offer.
    - 🔄 **Loyal Regulars**: Consistent repeat buyers -> 1-click Double Loyalty Points weekend.
    - 🌱 **Promising New**: 1-2 visits -> 1-click 2nd visit incentive (10% off).
    - ⚠️ **At Risk**: Inactive 45-90 days -> 1-click "We Miss You" 15% discount.
    - 💤 **Dormant**: Inactive > 90 days -> 1-click Win-Back campaign.
  - Store owners do not need to configure filters or export CSVs; 1 tap triggers the right campaign.
- **3. Proactive Dissatisfaction Shield (Private Review Interceptor)**:
  - When a shopper rates 1-3 stars on the digital bill, it is intercepted and shielded privately, never reaching Google Maps.
  - Highlights private dissatisfaction alerts in the Merchant Dashboard with instant WhatsApp apology + goodwill voucher link and manager resolution tracking (`in_progress`, `resolved`).
  - 4-5 star happy ratings are automatically accelerated directly to Google Reviews.
- **4. 1-Click Campaigns Hub**:
  - Scraped and integrated all 20 BillFree visual campaign cards into `/public/campaigns/`.
  - Built 4 clear categories: Manual Campaigns, Automated Lifecycle, Event-Driven, and Timely Reminders with instant broadcast modal.
- **Production Deployment**:
  - Built and deployed frontend bundle `index-BhgMYODM.js` to `/var/www/billintegration/dist`.
  - Deployed backend updates to `/var/www/billintegration/backend-api` and restarted PM2 `bill-backend` (service ID 6). All services verified 100% operational on `bill.retailnode.in`.

### 16. Three Segregated Login Pages, Zero Hardcoding & Full Modular URL Separation
- **1. Three Segregated Dedicated Login Portals (Zero Tab Leakage)**:
  - Eliminated all unified tabbed interfaces to prevent public users or store managers from discovering administrative endpoints.
  - **Merchant / Store User Login**: Dedicated route at `/login` & `/merchant/login` (`MerchantLogin.jsx`). Only accepts store email and password, auto-focuses first input, authenticates via `POST /api/v1/auth/login` (`loginType: 'merchant'`), sets `merchant_admin` role, and navigates directly to `/dashboard`.
  - **SaaS SuperAdmin Platform Login**: Isolated route at `/saas-admin/login` & `/platform-admin` (`SuperAdminLogin.jsx`). Dark slate security terminal verifying `superadmin` role, directs to `/saas-admin`.
  - **Customer / Shopper Digital Bills Portal**: Public lookup portal at `/my-bills`, `/customer/login`, and `/i/lookup` (`CustomerBillsLookup.jsx`). Customers enter their 10-digit phone number, see itemized cards for all their verified digital receipts from enrolled retail stores, open receipts (`/t/{shortId}`), download PDFs, and inspect loyalty points.
- **2. Total Eradication of Hardcoded Store Names & Fallbacks**:
  - Completely purged any hardcoded strings (e.g. `V R Pawar Sarees` or `Deepak Sarees`) from all headers, state declarations, skeletons, and receipt components.
  - Slow network states now render pure animated gray skeleton bars (`h-5 w-32 bg-slate-200 animate-pulse rounded`) and fall back cleanly to `"Store"` or `"Retail Store"` until API response resolves.
- **3. Full BillFree Panel Analysis & Archive**:
  - Authenticated session-based deep scrape archived 22 distinct HTML endpoints from `billfree.in`:
    - `/dashboard-summary/index` & `/home/index`: Executive KPIs and Sales overview.
    - `/store-comparison/store-comparision`: Multi-outlet sales benchmarking.
    - `/roi-explorer/index`: Revenue attribution and campaign ROI.
    - `/campaigns-hub/index`: Manual and automated marketing broadcasts.
    - `/profiles/customers`: 14-column customer CRM with dormancy and visit frequency filters.
    - `/profiles/index`: Demographic profiles calendar (birthdays, anniversaries, spouse, children).
    - `/customer-journey/overview`: 360-degree customer interaction timeline.
    - `/optout-customers/index`: DPDP Act 2023 and WhatsApp DND compliance list.
    - `/segmentation/list`: Rule-based audience segmentation.
    - `/digital-bill/index` & `/generate-bill/index`: POS invoice streams.
    - `/loyalty-dashboard/index` & `/points-transaction`: Points earning rules and transaction ledger.
    - `/coupon-dashboard/index`: Promotional vouchers and adhoc discounts.
    - `/redeem-reward/index`: Cashier counter lookup and instant redemption terminal.
    - `/feedback/index`: Star ratings and Google Review prompt tracking.
    - `/greeting-cards/index`: Seasonal creatives catalog.
    - `/download-center/index`: CSV exports and Windows Print Interceptor.
    - `/gupshup-ss/index`: WhatsApp WABA gateway settings.
    - `/account/index`: Branding, social channels, and API tokens.
- **4. Modular Architecture & Dedicated Page URLs**:
  - Deprecated the 4,500-line monolithic tab-switching model in `MerchantDashboard.jsx`.
  - Built `src/layouts/MerchantLayout.jsx` with persistent sidebar navigation, dynamic store name header, quick bill generator modal, and React Router `<Outlet />`.
  - Created 18 dedicated page components under `src/pages/merchant/`:
    - `DashboardHome.jsx` (`/dashboard` & `/dashboard/home`)
    - `StoreComparison.jsx` (`/dashboard/store-comparison`)
    - `RoiExplorer.jsx` (`/dashboard/roi-explorer`)
    - `CampaignsHub.jsx` (`/dashboard/campaigns`)
    - `InvoicesPage.jsx` (`/dashboard/invoices`)
    - `CustomersPage.jsx` (`/dashboard/customers`)
    - `CustomerProfiles.jsx` (`/dashboard/profiles`)
    - `CustomerJourney.jsx` (`/dashboard/customer-journey` & `/dashboard/customer-journey/:phone`)
    - `OptOutCustomers.jsx` (`/dashboard/optout-customers`)
    - `CustomerSegmentation.jsx` (`/dashboard/segmentation`)
    - `LoyaltyDashboard.jsx` (`/dashboard/loyalty`)
    - `CouponDashboard.jsx` (`/dashboard/coupons`)
    - `RedeemReward.jsx` (`/dashboard/redeem`)
    - `CustomerFeedback.jsx` (`/dashboard/feedback`)
    - `GreetingCards.jsx` (`/dashboard/greeting-cards`)
    - `DownloadCenter.jsx` (`/dashboard/downloads`)
    - `StoreSettings.jsx` (`/dashboard/settings`)
    - `WhatsAppSettings.jsx` (`/dashboard/whatsapp`)
  - Configured top-level redirect aliases in `src/App.jsx` (`/customers` -> `/dashboard/customers`, `/invoices` -> `/dashboard/invoices`, etc.).
  - Built production bundle (`dist/assets/index-BIPkbv6z.js`) and deployed to `95.135.166.109:/var/www/billintegration/dist/`. Verified all 19 routes return HTTP 200 OK.

---

## [2026-10-14] BillFree Comprehensive Crawl, Static Data Elimination & System Feedback Alignment

### 1. Full 120-Page Deep Crawl of BillFree Dashboard
- Script `crawl_all_billfree.mjs` crawled 120 distinct application pages from `billfree.in` (saved in `billfree_pages/` and indexed in `billfree_full_site_map.json`).
- Captured complete forms, inputs, tables, action columns, submenus, and data layouts across:
  - Analytics & Store Comparison (`/store-comparison/store-comparision`, `/store-comparison/index`, `/bill/index`, `/trend/index`, `/feedback/index`, `/sms-ledger/index`)
  - Campaigns & Automations (`/campaigns-hub/index`, `/whatsapp-campaign/index`, `/sms-campaign/index`, `/rcs-campaign/index`, and 14 lifecycle triggers)
  - Segmentation (`/segmentation/list`, `/segmentation/sku`)
  - Loyalty & Coupons (`/loyalty-dashboard/index`, `/loyalty-dashboard/points-transaction`, `/loyalty-dashboard/redemption`, `/coupon-dashboard/index`, `/redeem-reward/index`)
  - Download Center (`/download-center/index`, `/merchant/integration-files`)

### 2. Utility SaaS Scope Enforcement (Removed GST Accounting Reports)
- Per the user's explicit directive ("Monthly GST Summary Taxable values, CGST, SGST, IGST calculations formatted for CA audit and GSTR-1 return filing. remove this we are just send utility"):
  - Removed "Monthly GST Summary" card from `DownloadCenter.jsx`.
  - Replaced with "WhatsApp Messaging & Delivery Ledger (CSV)" tailored for billing utility microservice operations.

### 3. Customer System Feedback vs. Google Review Clarification
- Addressed user feedback regarding Google Promoters:
  - Clarified that third-party platforms like Google Maps do not export external reviewer comments back to the bill link without private Google OAuth.
  - Aligned `CustomerFeedback.jsx` to display **System Feedback Comments** submitted by shoppers on their digital bill receipt (`/t/:shortId`).
  - For 4★ & 5★ ratings: Badged as "Google Prompted" (auto-redirected to Google Reviews).
  - For 1-3★ ratings: Badged as "Private Shield" (shielded internally for merchant resolution).
  - Connected `CustomerFeedback.jsx` to live backend API `GET /api/v1/auth/feedback/responses` and `PUT /api/v1/auth/feedback/responses/:id/resolution`.

### 4. Customer Journey Fix & Phone Normalization
- Fixed 500 error in `customerController.js:getCustomerJourney`:
  - Resolved `Unknown column 'created_at' in field list` on `billing_messages` by querying `sent_at as created_at`.
  - Replaced undefined `bill_total` with parsed bill amount for accurate `lifetime_spend`.
  - Added phone normalization supporting both 10-digit (`9876543210`) and 12-digit (`919876543210`) queries.
  - Updated `CustomerJourney.jsx` to handle both wrapped `data.data` and root response formats.

### 5. Date Formatting Refinement (`formatDisplayDate` & `formatInputDate`)
- Resolved raw ISO string display (`1995-10-23T18:30:00.000Z which is wrong`).
- Implemented `formatDisplayDate(d)` in `merchantUtils.js` which parses dates cleanly and outputs `24-Oct-1995`.
- Implemented `formatInputDate(d)` which outputs `YYYY-MM-DD` for `<input type="date">` in `ProfileModal.jsx`.
- Applied across `CustomerProfiles.jsx`, `CustomersPage.jsx`, and `CustomerJourney.jsx`.

### 6. Zero Dummy Data Across Merchant Dashboard Pages
- **`StoreComparison.jsx`**: Wired to real analytics payload (`totalRevenue`, `totalInvoices`, `avgOrderValue`, new vs repeat splits). Removed static 4.9 rating and static 33% bar.
- **`CustomerSegmentation.jsx`**: Dynamically computes segment audience counts and average spends directly from live customer database records. Added member modal.
- **`RoiExplorer.jsx`**: Computes real blended ROI % from live revenue and messaging volume at ~₹0.45/msg.
- **`RedeemReward.jsx`**: Replaced mock timeout with live customer lookup (`/api/v1/auth/customers/:phone/journey`) and live coupons from `/api/v1/auth/coupons`.
- **`CouponDashboard.jsx`**: Connected to live CRUD endpoints (`GET/POST /api/v1/auth/coupons`).
- **`CampaignsHub.jsx`**: Removed static mock campaigns, replaced with empty state for ledger.







