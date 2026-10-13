# Task List: Customer Billing Message SaaS Platform

## Status Legend
- [x] Completed
- [/] In Progress
- [ ] Planned

---

## Phase 1: Architectural Audit & Brain Setup (COMPLETED)
- [x] **Technical Audit**: Detailed review of `/Users/ratan/Developer/billintegration/digital-invoice-system` (`backend-api`, `web-receipt`, `print-agent`, `docker-compose.yml`).
- [x] **RetailNodeV2 Cross-Audit**: Reviewed `/Users/ratan/Downloads/RetailNodeV2` architecture, CTO rules, WABA integrations (`waba.mpocket.in`), and database schema standards.
- [x] **Domain & IP Configuration**: Documented production domain `bill.retailnode.in` and server IP `95.135.166.109`.
- [x] **CTO Rules & Brain Setup**:
  - [x] Created master `.agents/AGENTS.md` (CTO Lead Enterprise SaaS Architect rules).
  - [x] Created `.agents/SCHEMA_DICTIONARY.md`.
  - [x] Created `.agents/rules/git-sync.md`.
  - [x] Created `.agents/rules/cto-standards.md`.
  - [x] Created `.agents/skills/deployment/SKILL.md` (Targeting `95.135.166.109` / `bill.retailnode.in`).
  - [x] Created `.agents/skills/billing-messaging/SKILL.md` (WABA & SMS dispatch protocols).
  - [x] Created `.agents/skills/page-creation/SKILL.md` & `.agents/skills/form-accessibility/SKILL.md`.
  - [x] Created `.agents/scripts/save_transcript.py` & `.agents/hooks.json`.
- [x] **Chat History & Artifact Preservation**:
  - [x] Preserved active conversation transcript `2ccf087c-9b59-49d3-b5c8-f4393c93c30f.jsonl` into `.agents/conversations/`.
  - [x] Preserved historical invoice audit transcript `8cfc030c-b5c9-47b2-8b65-41b5cafc7d82.jsonl` into `.agents/conversations/`.
  - [x] Created `.agents/plans/architecture_plan.md`, `task.md`, and `walkthrough.md`.

---

## Phase 2: Core Billing Messaging Engine Implementation
- [ ] **Database Migration (`setupDb.js`)**:
  - [ ] Add `billing_messages` table to log all outbound message dispatches, message IDs, and delivery statuses.
  - [ ] Add `waba_provider` and `waba_template_name` columns to `tenants` table.
- [ ] **Dual WABA Gateway Service (`services/wabaService.js`)**:
  - [ ] Implement `sendBillingWhatsAppMessage(recipientPhone, templateParams, tenantConfig)`.
  - [ ] Support Provider 1: `waba_custom` (`https://waba.mpocket.in/messages`).
  - [ ] Support Provider 2: `waba_graph` (`https://graph.facebook.com/v20.0/{phone_id}/messages`).
  - [ ] SMS fallback connector interface.
- [ ] **Controller Refactoring (`invoiceController.js`)**:
  - [ ] Replace hardcoded `localhost:3000` URLs with dynamic `process.env.APP_URL || 'https://bill.retailnode.in'`.
  - [ ] Wrap invoice upload + customer CRM upsert + loyalty calculation in a MySQL transaction (`START TRANSACTION` ... `COMMIT`).
  - [ ] Dispatch billing message via `wabaService` and persist audit entry into `billing_messages`.
- [ ] **Webhook Controller (`routes/webhookRoutes.js`)**:
  - [ ] Handle WABA incoming delivery status callbacks (`sent`, `delivered`, `read`, `failed`) and update `billing_messages`.

---

## Phase 3: Web-Receipt & POS Integration
- [ ] **Web Receipt UI Refinement**:
  - [ ] Ensure Next.js metadata and OpenGraph tags generate rich WhatsApp link preview cards when `https://bill.retailnode.in/t/{shortId}` is delivered.
  - [ ] Ensure Tally-style keyboard shortcuts on merchant dashboard forms.
- [ ] **Desktop Print Agent Update**:
  - [ ] Update default target API endpoint to `https://bill.retailnode.in/api/v1/invoices/upload`.

---

## Phase 4: Production Deployment & Verification
- [ ] Verify local tests and builds (`npm run build`).
- [ ] Configure Nginx reverse proxy on `95.135.166.109` for `bill.retailnode.in`.
- [ ] Provision SSL with Let's Encrypt Certbot.
- [ ] Live end-to-end billing message dispatch verification.
