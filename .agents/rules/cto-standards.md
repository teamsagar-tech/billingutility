# RetailNode CTO & Enterprise SaaS Standards

## Overview
This document outlines the mandatory engineering standards, review protocols, and architectural constraints enforced by the Chief Technology Officer (CTO). Every contributor, agent, and engineer working on the RetailNode Digital Invoice and Billing Messaging platform MUST comply with these standards.

---

## 1. The "Plan-First" Architecture Protocol (Mandatory Halt)
Before writing or modifying any code for a feature, module, or database change:
1. You MUST act as the **CTO / Manager Agent** first.
2. Read `.agents/SCHEMA_DICTIONARY.md` to identify existing entities and avoid schema duplication.
3. Generate a dedicated architecture plan artifact in `.agents/plans/<feature_name>_plan.md` defining:
   - Impacted database tables and migrations.
   - API contract (Request / Response JSON schema).
   - Messaging payload and template mapping.
   - Component tree and user flow.
4. **Halt Protocol**: You MUST wait for explicit user approval before writing code.

---

## 2. Multi-Tenancy & Data Isolation (Zero Leakage)
- Every operational query must filter by `tenant_id = ?`.
- Never trust `tenant_id` from client payloads. Extract it from verified tokens (`req.user.tenantId` for admin JWT, `req.tenantId` for POS API tokens).
- Cross-tenant data access is considered a critical P0 security failure.

---

## 3. High-Concurrency & ACID Compliance
- **Database Transactions**: Any billing or loyalty balance adjustment must run inside a managed MySQL transaction (`START TRANSACTION` ... `COMMIT`).
- **Row-Level Locking**: Acquire a pessimistic lock (`SELECT ... FOR UPDATE`) when modifying customer loyalty points or balance ledgers during concurrent sales bursts.
- **Idempotency**: All invoice ingestion requests must enforce idempotency via `(tenant_id, invoice_number)` or `X-Idempotency-Key` to avoid double-charging or duplicate messaging during POS network retry loops.
- **Connection Pooling**: Use the shared `mysql2` connection pool; never create ad-hoc unpooled connections.

---

## 4. Billing Message Reliability Standards
- Dispatches must be queued or asynchronously processed so POS checkout response time remains under 200ms.
- Every message attempt must be tracked in `billing_messages` with an audit trail of provider response, delivery receipts, and failure codes.
- Receipt URLs must always resolve to `https://bill.retailnode.in/t/{shortId}` in production.

---

## 5. Keyboard-First UX & Accessibility
- Master tables and data entry pages must support full keyboard operability:
  - `Enter`: Advance to next field or submit.
  - `Escape`: Quit or back out.
  - `Alt+C`: Create new record.
  - `Cmd+A` / `Ctrl+A`: Save form.
- The first input element of every page/modal must be auto-focused on mount.
- Unsaved changes must trigger a confirmation prompt before leaving.

---

## 6. Shadow Update Documentation Rule
Whenever a code change is made:
1. Update `HISTORY.md` with what changed and why.
2. If database schema was changed, update `.agents/SCHEMA_DICTIONARY.md`.
3. Never mark a task as completed without syncing documentation.
