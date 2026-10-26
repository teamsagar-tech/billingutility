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

## Phase 2: Database Schema & Core Messaging Engine
- [ ] **Database Migration (`setupDb.js`)**:
  - [ ] Add `billing_messages` table (invoice_id, recipient, gateway, message_id, status, error_reason).
  - [ ] Add `global_configs` table for platform SuperAdmin settings.
  - [ ] Add `plan_tier`, `message_quota`, and `messages_used` to `tenants` table.
  - [ ] Support `role: 'superadmin'` in `users` table.
- [ ] **Dual WABA Gateway Service (`services/wabaService.js`)**:
  - [ ] Implement `waba_custom` gateway integration (`https://waba.mpocket.in/messages`).
  - [ ] Implement `waba_graph` gateway integration (`https://graph.facebook.com/v20.0/{phone_id}/messages`).
  - [ ] Implement quota check before dispatching.
  - [ ] Implement SMS fallback connector.
- [ ] **POS Ingestion Controller (`invoiceController.js`)**:
  - [ ] Dynamic public receipt URL: `https://bill.retailnode.in/t/{shortId}`.
  - [ ] MySQL transactions for atomic invoice save + CRM upsert + loyalty calculation.
  - [ ] Audit logging in `billing_messages`.
- [ ] **WhatsApp Webhook Receiver (`controllers/webhookController.js`)**:
  - [ ] Inbound status updates: `sent` -> `delivered` -> `read` -> `failed`.

---

## Phase 3: Merchant User Dashboard & SaaS SuperAdmin Panel
- [ ] **Merchant Dashboard (`/dashboard`) Updates**:
  - [ ] WhatsApp message delivery audit log table with live filter (`all`, `delivered`, `failed`).
  - [ ] Store quota banner showing messages used / remaining credits.
  - [ ] WABA credentials and gateway selector (`waba.mpocket.in` vs Meta Graph API).
- [ ] **SaaS SuperAdmin Panel (`/saas-admin`) Creation**:
  - [ ] Store overview table: Store Name, Plan, Quota, Used, Status (Active/Suspended), Actions.
  - [ ] Global WABA Gateway configuration interface.
  - [ ] Platform-wide analytics cards (total invoices, delivery %, active stores).
  - [ ] Quota top-up modal.

---

## Phase 4: Production Deployment & Verification
- [ ] Build verification for frontend and backend.
- [ ] Nginx configuration for `bill.retailnode.in` on `95.135.166.109`.
- [ ] End-to-end integration test: Dispatch mock invoice from RetailNode ERP format to customer phone and verify digital receipt rendering.
