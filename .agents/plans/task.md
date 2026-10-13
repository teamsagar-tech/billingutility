# Task List: Customer Billing Message Utility SaaS Platform

## Status Legend
- [x] Completed
- [/] In Progress
- [ ] Planned

---

## Phase 1: Architectural Audit, Brain & Standards Setup (COMPLETED)
- [x] **Technical Audit**: Audited `digital-invoice-system` (`backend-api`, `web-receipt`, `print-agent`, `docker-compose.yml`).
- [x] **ERP vs. Billing Utility Definition**: Clarified that RetailNode is ERP, while this platform is the high-performance Billing & Customer Messaging Utility SaaS.
- [x] **Dual Panel Architecture**: Formulated User/Merchant Admin Panel (`/dashboard`) and SaaS SuperAdmin Panel (`/saas-admin`).
- [x] **Domain & IP Setup**: Targeted production domain `bill.retailnode.in` and server IP `95.135.166.109`.
- [x] **CTO Rules & Brain Synchronization**:
  - [x] Updated master `.agents/AGENTS.md`.
  - [x] Updated `.agents/SCHEMA_DICTIONARY.md` (superadmin role, global_configs, tenant quotas).
  - [x] Updated `.agents/rules/cto-standards.md` & `.agents/rules/git-sync.md`.
  - [x] Created skills: `billing-messaging`, `deployment`, `page-creation`, `form-accessibility`.
  - [x] Configured `save_transcript.py` and `hooks.json`.
  - [x] Synced transcripts to `.agents/conversations/`.
  - [x] Created `architecture_plan.md`, `task.md`, and `walkthrough.md`.

---

## Phase 2: Database Schema & Core Messaging Engine (COMPLETED)
- [x] **Database Schema Extensions**:
  - [x] `action_logs` table for tracking Google review clicks, Instagram/YouTube actions, and customer logins.
  - [x] `google_place_id`, `youtube_url`, `store_address`, `gstin`, `store_phone`, `store_email` in `tenants` table.
  - [x] Added `role ENUM('superadmin', 'merchant_admin', 'cashier')` and nullable `tenant_id` to `users` table.
  - [x] Seeded administrative accounts for SuperAdmin and Store Admin.
- [x] **Dual WABA Gateway Service & Ingestion**:
  - [x] Implemented `waba_custom` gateway integration (`https://waba.mpocket.in/messages`).
  - [x] Implemented `meta_cloud` WhatsApp Graph API integration.
  - [x] 72-hour session security lock for invoice viewing.
  - [x] Action tracking API: `POST /api/v1/invoices/:slug/track` and `GET /api/v1/invoices/:slug/track-status`.
- [x] **Smart Review Resolution & First-Visit Modal**:
  - [x] Direct Place ID dialog resolution (`https://search.google.com/local/writereview?placeid={id}`).
  - [x] First-visit customer engagement modal with Google review, Instagram, and YouTube buttons.
  - [x] Zero hardcoding across frontend and backend.

---

## Phase 3: Dual Admin Panels (Merchant Dashboard & SaaS SuperAdmin) (COMPLETED)
- [x] **Merchant Admin Dashboard (`/dashboard`)**:
  - [x] 100% full-width layout without artificial containers.
  - [x] Real-time Billing Stream with invoice #, date, customer phone, total (₹), WhatsApp status badge, and Google Review conversion badge.
  - [x] Store Branding & Google Reviews Tab (Name, Address, GSTIN, Place ID, Review URL, Instagram, YouTube, Facebook, Meta Pixel).
  - [x] WhatsApp Gateway Tab (WABA provider selector, access token, phone number ID, template name).
  - [x] Customer CRM & Loyalty Engine Tab (Customer lifetime spend table, points balance, earning & redemption rules).
  - [x] POS & ERP Interceptor Integration Tab (API key copy, Print Interceptor Agent download, sample cURL payload).
- [x] **SaaS SuperAdmin Platform Panel (`/saas-admin`)**:
  - [x] Protected with `superadmin` role verification guard.
  - [x] Platform telemetry KPI cards (Active stores, Invoices processed, WhatsApp dispatched, Review clicks).
  - [x] Tenants Directory with quota usage meter, active/suspended toggle, and Top-Up modal.
  - [x] Onboard New Retail Store modal (10-second store provisioning with auto-generated `sk_live_...` API token).
  - [x] Platform Live Action Audit stream from `action_logs`.
  - [x] Global Gateway configuration editor.
- [x] **Routing & Authentication**:
  - [x] Registered `/dashboard` and `/saas-admin` in `src/App.jsx`.
  - [x] Connected to `/login` (`UnifiedLogin.jsx`) for automatic role-based redirection.

---

## Phase 4: Production Deployment & Verification (COMPLETED)
- [x] Local Vite build check (`npm run build` in 567ms).
- [x] Rsync `dist/` to `/var/www/billintegration/dist` on `95.135.166.109`.
- [x] Rsync `backend-api/src/` to `/var/www/billintegration/backend-api/src/`.
- [x] Restarted PM2 `bill-backend` (service ID 6).
- [x] End-to-end live testing:
  - SuperAdmin login & analytics verified.
  - Merchant login & invoice streaming verified.
  - HTTP 200 confirmed on `/login`, `/dashboard`, and `/saas-admin`.
