# Walkthrough: RetailNode Customer Billing Messaging Utility SaaS

## 1. System Refinement & Role Clarification

Based on executive direction:
- **RetailNode (`RetailNodeV2`) is the ERP**: Enterprise management of purchase invoices, inventory, parties, ledgers, barcodes, GST taxation, and logistics.
- **`billintegration` is the Billing & Messaging Utility SaaS**: A dedicated, high-speed microservice operating at `bill.retailnode.in` (IP: `95.135.166.109`) providing:
  1. Instant invoice ingestion from RetailNode ERP and third-party POS terminals.
  2. Dynamic public digital receipt generation (`https://bill.retailnode.in/t/{shortId}`).
  3. Automated WhatsApp/SMS customer billing notifications.
  4. Post-billing shopper engagement (Loyalty points, Word-of-Mouth referrals, 4★+ Google review redirection).

---

## 2. Required Dual Management Panels

### A. Merchant User Admin Panel (`/dashboard`)
Enables store owners and managers to:
- Monitor live sales invoices and real-time WhatsApp message delivery states (`sent`, `delivered`, `read`, `failed`).
- Review shopper CRM profiles, purchase history, and customer lifetime spend.
- Configure store branding (logo, social channels, Google review URL).
- Manage WABA credentials (`waba.mpocket.in` or Meta Graph API).
- Configure loyalty earning rules (`rupees_per_point`, redemption thresholds).
- Access store integration API token (`sk_live_...`).

### B. SaaS SuperAdmin Platform Panel (`/saas-admin`)
Enables platform administrators to:
- Monitor all enrolled stores/tenants and their subscription tiers (`starter`, `growth`, `enterprise`).
- Allocate, adjust, and monitor tenant messaging quotas (`message_quota`, `messages_used`).
- Configure global default WABA gateway endpoints and failover SMS providers.
- View platform-wide performance analytics (aggregate billings, message success rate %, server health).
- Review immutable action audit logs across the SaaS platform.

---

## 3. Brain, Rules, and Schema Files Updated

| File | Status | Summary of Updates |
| :--- | :--- | :--- |
| [`.agents/AGENTS.md`](file:///Users/ratan/Developer/billintegration/.agents/AGENTS.md) | **Updated** | CTO persona refined to reflect utility microservice role; dual-panel architecture (Merchant Dashboard + SuperAdmin Panel) codified. |
| [`.agents/SCHEMA_DICTIONARY.md`](file:///Users/ratan/Developer/billintegration/.agents/SCHEMA_DICTIONARY.md) | **Updated** | Added `superadmin` role, `global_configs` table, and tenant quota tracking (`plan_tier`, `message_quota`, `messages_used`, `is_active`). |
| [`.agents/rules/cto-standards.md`](file:///Users/ratan/Developer/billintegration/.agents/rules/cto-standards.md) | **Updated** | Codified decoupling between RetailNode ERP and the Billing Utility service. |
| [`.agents/skills/billing-messaging/SKILL.md`](file:///Users/ratan/Developer/billintegration/.agents/skills/billing-messaging/SKILL.md) | **Updated** | Outlined message dispatch lifecycle with quota verification and dual WABA gateway routing. |
| [`HISTORY.md`](file:///Users/ratan/Developer/billintegration/HISTORY.md) | **Updated** | Architectural log updated with the ERP vs. Utility distinction and panel requirements. |

---

## 4. Next Implementation Step

We are ready to execute **Phase 2 (Database Migration & Messaging Engine Implementation)**:
1. Update [`setupDb.js`](file:///Users/ratan/Developer/billintegration/digital-invoice-system/backend-api/src/config/setupDb.js) with `billing_messages`, `global_configs`, and tenant quota fields.
2. Build the modular `wabaService.js` supporting both `waba.mpocket.in` and Meta Cloud API.
3. Refactor `invoiceController.js` for ACID transactions and dynamic `bill.retailnode.in` URL generation.
