# Architecture Plan: RetailNode Customer Billing Messaging SaaS Platform

**Target Environment:**
- **Domain**: `bill.retailnode.in`
- **Server IP**: `95.135.166.109`
- **CTO Role**: Lead Enterprise SaaS Architect
- **Mission**: End-to-end digital invoice generation and automated customer billing messaging (WhatsApp/SMS) across thousands of multi-tenant retail stores.

---

## 1. System Topology & Data Flow

```
┌───────────────────────────────────────┐
│     POS Terminals & ERP Systems       │
│  - RetailNode ERP (Vouchers)          │
│  - Desktop Print Agent (Spooler)      │
│  - Direct Ingestion API               │
└──────────────────┬────────────────────┘
                   │ HTTPS POST /api/v1/invoices/upload
                   │ Header: x-api-token: <sk_live_...>
                   ▼
┌────────────────────────────────────────────────────────┐
│   Backend Ingestion Engine (Port 4000)                 │
│  - Idempotency & Auth Verification                     │
│  - Base62 Short Slug Generator (e.g. 8-char slug)       │
│  - MySQL Transaction (START TRANSACTION ... COMMIT)    │
│    • Insert into `invoices`                            │
│    • Upsert into `customers` (CRM total spend & visits)│
│    • Calculate Loyalty Points (rupees_per_point)       │
│    • Convert Referrals & Award Bonuses                 │
│  - Cache Receipt JSON in Redis (`invoice:{shortId}`)   │
└──────────────────┬─────────────────────────────────────┘
                   │
         ┌─────────┴────────────────────────┐
         │                                  │
         ▼                                  ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ Messaging Dispatch Worker       │ │ Customer Web Receipt (Port 3000)│
│ - Select Gateway:               │ │ Route: /t/{shortId}             │
│   1. WABA Custom (waba.mpocket) │ │ - Dynamic itemized digital bill │
│   2. Meta Graph API (Cloud API) │ │ - Interactive loyalty balance   │
│   3. SMS Gateway Fallback       │ │ - 1-Click WhatsApp share / PDF  │
│ - Render Utility Template       │ │ - Google Review redirect (4★+) │
│ - Record in `billing_messages`  │ │ - Purchase history accordion    │
│ - Webhook updates (delivered)   │ │ - Brand social channels         │
└─────────────────────────────────┘ └─────────────────────────────────┘
```

---

## 2. API Contract Specification

### `POST /api/v1/invoices/upload`
**Headers:**
```http
Content-Type: application/json
x-api-token: sk_live_a1b2c3d4e5f6g7h8
X-Idempotency-Key: pos-tx-994821-20261013
```

**Request Body:**
```json
{
  "receiptData": {
    "storeName": "Pankhudi Fashion Store",
    "storeAddress": "Shop 4, MG Road, Mumbai",
    "invoiceNumber": "INV-2026-1049",
    "customerPhone": "919876543210",
    "customerName": "Ananya Sharma",
    "billAmount": 3499.00,
    "taxAmount": 419.88,
    "paymentMode": "UPI",
    "cashierName": "Rahul S.",
    "items": [
      {
        "name": "Designer Silk Saree",
        "qty": 1,
        "rate": 2999.00,
        "amount": 2999.00,
        "hsn": "5007"
      },
      {
        "name": "Matching Blouse Piece",
        "qty": 1,
        "rate": 500.00,
        "amount": 500.00,
        "hsn": "5208"
      }
    ],
    "discounts": 0.00,
    "date": "2026-10-13T17:45:00.000Z"
  },
  "referralCode": "919811122233"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Invoice processed and billing notification queued",
  "data": {
    "shortId": "xK9mP2qL",
    "url": "https://bill.retailnode.in/t/xK9mP2qL",
    "loyalty": {
      "earned": 34,
      "balance": 210
    },
    "messaging": {
      "status": "queued",
      "gateway": "waba_custom"
    }
  }
}
```

---

### `GET /api/v1/invoices/:slug` (Public Web Receipt Ingestion)
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "shortId": "xK9mP2qL",
    "receiptData": { ... },
    "loyalty": { "balance": 210 },
    "createdAt": "2026-10-13T17:45:00.000Z",
    "history": [
      { "shortId": "a9Z1b8K2", "date": "2026-09-28T14:20:00.000Z" }
    ],
    "tenantProfile": {
      "store_name": "Pankhudi Fashion Store",
      "logo_url": "https://bill.retailnode.in/assets/logo.png",
      "instagram_url": "https://instagram.com/pankhudi_fashion",
      "facebook_url": "https://facebook.com/pankhudifashion",
      "google_review_url": "https://g.page/r/pankhudi/review",
      "feedback_enabled": true
    }
  }
}
```

---

## 3. WhatsApp Message Template Matrix

### Production Template: `digital_bill_receipt` (Utility Category)
**Header:** None or Image (Brand Logo)
**Body:**
```
Dear {{1}}, thank you for shopping at *{{2}}*!

🧾 *Bill Number*: {{3}}
💰 *Total Amount*: ₹{{4}}
⭐ *Loyalty Points Earned*: {{5}} (Total: {{6}})

View, download, and review your digital receipt here:
👉 {{7}}
```

**Variables:**
1. `{{1}}`: Customer Name / Shopper
2. `{{2}}`: Store Name
3. `{{3}}`: Invoice Number
4. `{{4}}`: Formatted Bill Total
5. `{{5}}`: Points Earned
6. `{{6}}`: Total Available Points
7. `{{7}}`: `https://bill.retailnode.in/t/{shortId}`

---

## 4. Multi-Tenant Database Schema Reference
- `tenants`: Store credentials & WABA tokens.
- `users`: Merchant admin login.
- `customers`: CRM shopper records & loyalty balances.
- `invoices`: Receipt json & short_id.
- `billing_messages`: Messaging dispatch audit trail.
- `loyalty_settings`: Point calculation rules.
- `referrals` & `referral_settings`: Word of mouth referrals.
- `feedback_responses`: Customer ratings and Google review routing.
- `action_logs`: Immutable audit trails.
