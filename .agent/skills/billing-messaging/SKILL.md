---
name: billing-messaging
description: Standard Operating Procedure for customer billing message delivery, WhatsApp Business API (WABA) integrations, short-link receipt generation, and POS/ERP webhooks.
---

# Customer Billing Messaging & Notification SOP

This skill defines the end-to-end architecture and execution protocol for delivering instant digital invoices and billing notifications to retail customers over WhatsApp and SMS.

## Core Architectural Role
- **RetailNode (`RetailNodeV2`) is the ERP**: Handles sales orders, inventory, GST, ledgers, and barcode labels.
- **BillIntegration is the Billing Utility Microservice**: Pluggable high-throughput engine that ingests completed sales invoices from RetailNode ERP (or any POS terminal), computes loyalty bonuses, generates short receipt links (`https://bill.retailnode.in/t/{shortId}`), and dispatches automated WhatsApp/SMS messages to retail shoppers.

---

## 1. The Billing Message Lifecycle

```
[RetailNode ERP / POS Terminal] 
         │  (POST /api/v1/invoices/upload with API Token)
         ▼
[Billing Utility Ingestion API]
   ├── 1. Validate API Token (`x-api-token`) & Check Idempotency Key
   ├── 2. Check Tenant Message Quota (`message_quota > messages_used`)
   ├── 3. Generate Base62 Short Slug (e.g. "aB7k9XyZ")
   ├── 4. MySQL Transaction: Save Invoices + Upsert Customer CRM + Credit Loyalty
   ├── 5. Cache Receipt JSON in Redis (`invoice:{shortId}` TTL 86400s)
   ├── 6. Queue Billing Message Dispatch
   └── 7. Return 201 Created to POS (< 150ms latency)
         │
         ▼
[Messaging Dispatch Worker]
   ├── Formulate Receipt URL: https://bill.retailnode.in/t/{shortId}
   ├── Select Active Gateway:
   │   ├── 1. Custom WABA (https://waba.mpocket.in/messages)
   │   ├── 2. Meta WhatsApp Cloud API (Graph API)
   │   └── 3. SMS Gateway Fallback
   ├── Format Approved Utility Template
   ├── Dispatch API Request & Increment `tenants.messages_used`
   └── Insert Audit Record into `billing_messages` (status: 'sent')
```

---

## 2. Supported Messaging Gateways

### Gateway 1: WABA Custom Gateway (`waba_custom`)
- **Endpoint**: `https://waba.mpocket.in/messages`
- **Method**: `POST`
- **Headers**:
  - `Authorization: Bearer <tenant.waba_access_token>`
  - `Content-Type: application/json`
- **Payload Structure**:
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "digital_bill_receipt",
      "language": { "code": "en_US" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "Customer Name" },
            { "type": "text", "text": "Store Name" },
            { "type": "text", "text": "INV-1092" },
            { "type": "text", "text": "1,450.00" },
            { "type": "text", "text": "14" },
            { "type": "text", "text": "https://bill.retailnode.in/t/aB7k9XyZ" }
          ]
        }
      ]
    }
  }
  ```

### Gateway 2: Meta WhatsApp Cloud API (`waba_graph`)
- **Endpoint**: `https://graph.facebook.com/v20.0/{phone_number_id}/messages`
- **Method**: `POST`
- **Headers**:
  - `Authorization: Bearer <tenant.waba_access_token>`
  - `Content-Type: application/json`

### Gateway 3: Plain-Text Fallback (During 24-hr customer service window)
```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "text",
  "text": {
    "body": "Thank you for shopping at *{StoreName}*!\n\nYour digital bill for *₹{BillTotal}* (Bill #{InvoiceNumber}) is ready.\n\nPoints Earned: *{PointsEarned}* | Total Balance: *{TotalPoints}*\n\nView and download your receipt here:\nhttps://bill.retailnode.in/t/{shortId}"
  }
}
```

---

## 3. Mandatory Audit Logging
Every attempt to dispatch a billing message MUST create a record in `billing_messages`:
```sql
INSERT INTO billing_messages 
(tenant_id, invoice_id, customer_phone, gateway, template_name, message_id, status)
VALUES (?, ?, ?, ?, ?, ?, 'sent');
```

---

## 4. RetailNode ERP Integration Webhook
When RetailNode ERP creates a sales voucher:
- The ERP calls `POST https://bill.retailnode.in/api/v1/invoices/upload`
- Passing header `x-api-token: <firm_api_token>`
- Body:
  ```json
  {
    "receiptData": {
      "storeName": "Pankhudi Fashion Store",
      "invoiceNumber": "RN-2026-0891",
      "customerPhone": "919876543210",
      "customerName": "Ramesh Kumar",
      "billAmount": 2499.00,
      "taxAmount": 299.88,
      "paymentMode": "UPI",
      "items": [
        { "name": "Pure Silk Kanjivaram", "qty": 1, "rate": 2499.00, "amount": 2499.00 }
      ],
      "date": "2026-10-13T17:45:00.000Z"
    }
  }
  ```
