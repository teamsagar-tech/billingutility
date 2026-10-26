# RetailNode CTO & Enterprise SaaS Standards

## Overview
This platform is the **Billing & Customer Messaging Utility SaaS Microservice** (`bill.retailnode.in`). It is purposefully decoupled from **RetailNode ERP** (`RetailNodeV2`):
- **RetailNode (`RetailNodeV2`)**: Complete ERP handling accounting, inventory, purchase invoices, barcode printing, GST, and logistics.
- **Billing Integration (`billintegration`)**: High-throughput utility service handling invoice ingestion, digital receipt generation (`/t/{shortId}`), instant WhatsApp/SMS billing message delivery, and shopper loyalty/reviews.

---

## 1. Dual-Panel Architecture Standard
The frontend web application MUST support two distinct management environments:
1. **User Admin Panel (Merchant Dashboard `/dashboard`)**:
   - For retail store owners, branch managers, and billing operators.
   - Modules: Invoices Log, WhatsApp Message Delivery Status, Customer CRM, Loyalty Rules, Referrals, Feedback Reviews, Store Profile, and Store API Key.
2. **SaaS SuperAdmin Panel (`/saas-admin`)**:
   - For SaaS platform administrators and operators.
   - Modules: All Tenant Accounts, Store Quotas & Message Credits, Global WABA Gateway Configuration, Platform-wide Traffic Analytics, System Health, and Audit Logs.

---

## 2. Multi-Tenancy & Data Isolation (Zero Leakage)
- Every operational query must filter by `tenant_id = ?`.
- Never trust `tenant_id` from client payloads. Extract it from verified tokens (`req.user.tenantId` for merchant JWT, `req.tenantId` for POS API tokens).
- SuperAdmin queries verify `req.user.role === 'superadmin'` before querying cross-tenant metrics.

---

## 3. High-Concurrency Ingestion (< 150ms POS Response)
- Ingesting an invoice from POS must never block or delay cashier checkout.
- Redis caching (`invoice:{shortId}`) is populated instantly.
- WhatsApp message dispatch is asynchronously queued and tracked in `billing_messages`.
- Ingestion endpoints enforce idempotency via `(tenant_id, invoice_number)` or `X-Idempotency-Key` headers.

---

## 4. Keyboard-First UX & Accessibility
- Master tables and data entry pages must support full keyboard operability:
  - `Enter`: Advance to next field or submit.
  - `Escape`: Quit or back out with unsaved changes confirmation.
  - `Alt+C`: Create new record.
  - `Cmd+A` / `Ctrl+A`: Save form.
- The first input element of every page/modal must be auto-focused on mount.

---

## 5. Shadow Update Documentation Rule
Whenever a code change is made:
1. Update `HISTORY.md` with what changed and why.
2. If database schema was changed, update `.agents/SCHEMA_DICTIONARY.md`.
3. Keep project plans in `.agents/plans/` in sync.
