# Architecture Plan: RetailNode Customer Billing Messaging Utility SaaS Platform

**Target Environment:**
- **Domain**: `bill.retailnode.in`
- **Server IP**: `95.135.166.109`
- **CTO Role**: Lead Enterprise SaaS Architect
- **Mission**: High-throughput digital invoice ingestion, interactive receipt generation, and automated customer WhatsApp/SMS billing message delivery.

---

## 1. Core Architectural Positioning: ERP vs. Billing Utility

| Layer | System | Core Responsibilities |
| :--- | :--- | :--- |
| **Enterprise ERP** | **RetailNode (`RetailNodeV2`)** | Inventory, Purchase Invoices, Accounting Ledgers, GST Reporting, Barcode Label Generation, Logistics, and Store Management. |
| **Billing Utility SaaS** | **`billintegration` (`bill.retailnode.in`)** | High-concurrency Invoice Ingestion API (< 150ms), Base62 shortlink receipt generation (`/t/{shortId}`), WhatsApp WABA billing notifications, shopper CRM, and review generation. |

---

## 2. Portal & Panel Architecture

```
                                  bill.retailnode.in
                                          │
       ┌──────────────────────────────────┼──────────────────────────────────┐
       │                                  │                                  │
       ▼                                  ▼                                  ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│  Public Digital Receipt │   │  User Store Dashboard   │   │  SaaS SuperAdmin Panel  │
│      Route: /t/[slug]   │   │   Route: /dashboard     │   │   Route: /saas-admin    │
├─────────────────────────┤   ├─────────────────────────┤   ├─────────────────────────┤
│ • Interactive Bill View │   │ • Live Invoices Stream  │   │ • All Tenant Accounts   │
│ • Itemized GST Details  │   │ • Message Delivery Logs │   │ • Plan Quotas & Credits │
│ • Loyalty Points Badge  │   │ • WhatsApp Credentials  │   │ • Global WABA Gateways  │
│ • Referral Generator    │   │ • Loyalty & Referral UI │   │ • Multi-Store Analytics │
│ • 4★+ Google Reviews    │   │ • Store Branding Profile│   │ • Redis & Server Health │
│ • 1-Click WhatsApp/PDF  │   │ • Store API Key Token   │   │ • God-Mode Audit Trail  │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

---

## 3. High-Concurrency Ingestion & Messaging Pipeline

```
[RetailNode ERP / POS Terminals]
         │ HTTPS POST /api/v1/invoices/upload (x-api-token)
         ▼
[Express Ingestion Controller]
   ├── 1. Verify `x-api-token` & Check Idempotency Key
   ├── 2. Verify Tenant Quota (`message_quota > messages_used`)
   ├── 3. Generate 8-character Base62 `shortId`
   ├── 4. MySQL Transaction (`START TRANSACTION`):
   │       • INSERT INTO `invoices`
   │       • UPSERT INTO `customers` (CRM total spend & visit count)
   │       • Calculate Loyalty points & convert active referrals
   │       • COMMIT
   ├── 5. Cache Receipt Payload in Redis (`invoice:{shortId}` TTL 86400s)
   ├── 6. Queue Billing Message Dispatch
   └── 7. Immediate 201 Response to ERP/POS (< 150ms)
         │
         ▼
[WABA Messaging Worker]
   ├── Construct URL: https://bill.retailnode.in/t/{shortId}
   ├── Dispatch via Gateway 1 (`waba_custom` via `waba.mpocket.in`)
   │   or Gateway 2 (Meta Graph API) or SMS fallback
   ├── Log dispatch into `billing_messages` (status: 'sent')
   └── Increment tenant `messages_used`
```

---

## 4. API Contract: SuperAdmin & Merchant Endpoints

### SuperAdmin Endpoints (`requireAuth` + `requireSuperAdmin`)
- `GET /api/v1/saas-admin/tenants`: List all retail stores with plan tier, message quota, used count, and status.
- `POST /api/v1/saas-admin/tenants/:id/quota`: Add or adjust messaging credits for a store.
- `PUT /api/v1/saas-admin/tenants/:id/status`: Suspend or activate a tenant.
- `GET /api/v1/saas-admin/analytics`: Aggregated platform statistics (total bills, total WhatsApp sent, success rate %, active stores).
- `GET /api/v1/saas-admin/configs`: Read system-wide default WABA providers and platform configs.
- `PUT /api/v1/saas-admin/configs`: Update platform-wide messaging gateways.

### Merchant Store Admin Endpoints (`requireAuth`)
- `GET /api/v1/auth/me`: Store info and API token.
- `GET /api/v1/invoices`: List store invoices with search, date filters, and delivery status.
- `GET /api/v1/invoices/messages`: Audit log of sent WhatsApp/SMS messages.
- `GET /api/v1/customers`: Store shopper CRM list.
- `GET / PUT /api/v1/loyalty`: Loyalty point calculation settings.
- `GET / PUT /api/v1/waba`: Store WABA provider credentials.
- `GET / PUT /api/v1/profile`: Store branding (logo, social links, Google review URL).

### Ingestion & Public Endpoints
- `POST /api/v1/invoices/upload`: Ingestion from RetailNode ERP / POS print-agents (`requireApiToken`).
- `GET /api/v1/invoices/:slug`: Public digital receipt lookup (Redis cached).
- `POST /api/v1/invoices/public/feedback`: Shopper star rating submission.
- `POST /api/v1/webhooks/waba`: Inbound WhatsApp delivery status callback (`delivered`, `read`, `failed`).
