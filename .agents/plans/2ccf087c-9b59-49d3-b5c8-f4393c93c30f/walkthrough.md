# Walkthrough: RetailNode Digital Invoice & Customer Billing Messaging SaaS

## 1. Executive Summary & Audit of Existing Systems

We conducted a complete architectural audit of what has been developed so far across both repositories:

### A. Digital Invoice System (`/Users/ratan/Developer/billintegration/digital-invoice-system`)
1. **`backend-api` (Express + MySQL + Redis)**:
   - **Ingestion Route (`POST /api/v1/invoices/upload`)**: Validates merchant API token (`x-api-token`), generates an 8-character base62 short slug, saves receipt payload in MySQL, upserts customer CRM profile, calculates loyalty points, and handles referral conversions.
   - **Public Receipt Route (`GET /api/v1/invoices/:slug`)**: Fetches receipt data, customer loyalty balance, visit history, and store branding.
   - **Redis Cache Layer**: Invoices cached under `invoice:{shortId}` with a 24-hour TTL for high-speed retrieval.
   - **Merchant Modules**: Store profile, analytics, CRM customers, loyalty settings, referral rewards, feedback ratings, and WhatsApp WABA credentials management.
2. **`web-receipt` (Next.js 15+ / React / Tailwind)**:
   - **Customer Digital Receipt (`/t/[slug]`)**: Itemized bill display, loyalty balance badge, referral sharing, feedback star rating, Google Review redirect, WhatsApp share, and PDF export.
   - **Store Dashboard (`/dashboard`)**: Admin metrics, CRM, loyalty settings, and WABA configuration.
3. **`print-agent` (.NET / C# WPF)**:
   - Desktop spool listener that intercepts raw print jobs from POS software (Tally, Busy, Marg), extracts customer details and line items via regex, and transmits them to the backend API.
4. **Marketing Web App (`billintegration` root)**:
   - Modern React + Vite showcase portal with dedicated landing pages for Digital Bills, Smart CRM, Marketing Automation, Loyalty Programs, and Solutions for Retail Stores.

### B. RetailNode ERP (`/Users/ratan/Downloads/RetailNodeV2`)
1. **Enterprise Standards**: Established 24 strict CTO rules, multi-tenancy (`firm_id`/`tenant_id`), ACID transactions, row-level locks (`SELECT ... FOR UPDATE`), and Tally-style keyboard-first navigation.
2. **Messaging Infrastructure**:
   - Production WABA gateway integration using `https://waba.mpocket.in` with utility templates (`ticket_created`, etc.).
   - Meta Graph API connector (`https://graph.facebook.com/v20.0/`).

---

## 2. Infrastructure & Production Configuration
- **Domain**: `bill.retailnode.in`
- **Server IP**: `95.135.166.109`
- **Digital Receipt URL**: `https://bill.retailnode.in/t/{shortId}`
- **Backend API**: Port 4000
- **Web Receipt Frontend**: Port 3000
- **Database**: MySQL 8.0 (Port 3306)
- **Cache**: Redis (Port 6379)

---

## 3. Brain, Rules, and Skills Setup (`.agents/`)
We established the exact brain, skill, and rule framework inside `/Users/ratan/Developer/billintegration/.agents`:

| Path | Purpose |
| :--- | :--- |
| [`.agents/AGENTS.md`](file:///Users/ratan/Developer/billintegration/.agents/AGENTS.md) | CTO & Lead Enterprise SaaS Architect persona and 24 strict architecture rules. |
| [`.agents/SCHEMA_DICTIONARY.md`](file:///Users/ratan/Developer/billintegration/.agents/SCHEMA_DICTIONARY.md) | Authoritative database dictionary for all tables: `tenants`, `users`, `customers`, `invoices`, `billing_messages`, `loyalty_settings`, `referrals`, `feedback`, and `action_logs`. |
| [`.agents/rules/git-sync.md`](file:///Users/ratan/Developer/billintegration/.agents/rules/git-sync.md) | Continuous brain & skill synchronization with Git. |
| [`.agents/rules/cto-standards.md`](file:///Users/ratan/Developer/billintegration/.agents/rules/cto-standards.md) | Plan-First halt protocol, ACID transactions, data isolation, and keyboard UX. |
| [`.agents/skills/deployment/SKILL.md`](file:///Users/ratan/Developer/billintegration/.agents/skills/deployment/SKILL.md) | Production deployment SOP for `bill.retailnode.in` on IP `95.135.166.109`. |
| [`.agents/skills/billing-messaging/SKILL.md`](file:///Users/ratan/Developer/billintegration/.agents/skills/billing-messaging/SKILL.md) | SOP for billing message delivery over WABA (`waba.mpocket.in`), Meta Cloud API, and SMS fallback. |
| [`.agents/skills/page-creation/SKILL.md`](file:///Users/ratan/Developer/billintegration/.agents/skills/page-creation/SKILL.md) | UI page creation, routing, and styling SOP. |
| [`.agents/skills/form-accessibility/SKILL.md`](file:///Users/ratan/Developer/billintegration/.agents/skills/form-accessibility/SKILL.md) | Auto-focus, financial field formatting, and escape navigation SOP. |
| [`.agents/scripts/save_transcript.py`](file:///Users/ratan/Developer/billintegration/.agents/scripts/save_transcript.py) | Python script that syncs transcripts and artifacts into `.agents/`. |
| [`.agents/hooks.json`](file:///Users/ratan/Developer/billintegration/.agents/hooks.json) | Stop hook triggers automatic transcript synchronization. |
| [`.agents/conversations/`](file:///Users/ratan/Developer/billintegration/.agents/conversations/) | Preserved JSONL transcripts of active and historical sessions. |
| [`.agents/plans/`](file:///Users/ratan/Developer/billintegration/.agents/plans/) | Project architectural plans (`architecture_plan.md`, `task.md`, `walkthrough.md`). |

---

## 4. Next Implementation Steps
1. Execute database migration adding `billing_messages` table and tenant gateway configurations.
2. Implement `services/wabaService.js` with dual gateway support (`waba_custom` via `waba.mpocket.in` + Meta Graph API).
3. Update `invoiceController.js` to replace localhost URLs with `https://bill.retailnode.in/t/{shortId}` and wrap billing ingestion in MySQL transactions with message audit logs.
4. Setup WhatsApp delivery status callback webhook.
