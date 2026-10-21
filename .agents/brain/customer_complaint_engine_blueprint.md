# Architectural Blueprint: Omnichannel Customer Complaint & Grievance Resolution Desk ("RetailNode Care")

> **Document Type:** Future Add-On Module Blueprint & Implementation Specification  
> **Status:** Approved for Implementation (Scheduled)  
> **Author:** CTO & Lead Enterprise SaaS Architect  
> **Date:** October 14, 2026  
> **Target Module:** `RetailNode Care` / Omnichannel Grievance Desk Add-On

---

## 1. Executive Summary & Commercial Strategy

Basic billing dispatches and 5-star customer reviews drive post-purchase marketing, but **unresolved complaints directly degrade customer retention, harm repeat purchase frequency, and trigger public social media/Google review backlash**.

### The Add-On Package Model
Rather than bundling this complex engine into the entry-tier plan, this module will be packaged as a **Premium Add-On Module** (*e.g., ₹2,999/year or ₹399/month per retail outlet*):
- Turns RetailNode into an **omnichannel mini-Freshdesk/Zendesk purpose-built for retail brick-and-mortar stores**.
- Unifies **Digital Bills**, **WhatsApp (2-Way Conversational WABA)**, and **Transactional Email**.
- Automates customer retention through **instant goodwill compensation (Loyalty Points & Apology Coupons)**.

---

## 2. Omnichannel Ingestion Architecture (3 Capture Channels)

```
                       ┌──────────────────────────────────────────────────────────┐
                       │                   CUSTOMER CHANNELS                      │
                       └──────────────────────────────────────────────────────────┘
                                │                       │                      │
               1. Digital Receipt Form        2. WhatsApp 2-Way Bot      3. Email Channel
             (/t/{shortId}#complaint)         (Reply to Bill on WABA)    (care@store / Resend)
                                │                       │                      │
                                └───────────────────────┼──────────────────────┘
                                                        ▼
                                   ┌───────────────────────────────┐
                                   │  CENTRAL TICKETING ENGINE     │
                                   │   Unique ID: TKT-2610-8857    │
                                   │   SLA Timer: 2h First Response│
                                   └───────────────────────────────┘
                                                        │
                                                        ▼
                                   ┌───────────────────────────────┐
                                   │   MERCHANT RESOLUTION DESK    │
                                   │   • Threaded Chat Timeline    │
                                   │   • 1-Click Goodwill Voucher  │
                                   │   • Store Manager Assignment  │
                                   └───────────────────────────────┘
```

### Channel A: Embedded Digital Receipt Grievance Drawer
- **Trigger**: Directly below the bill items on `/t/{shortId}`, customers see a discrete link: *"Need assistance with this purchase? Report an Issue / Raise a Complaint"*.
- **Structured Intake Form**:
  - **Issue Category**:
    - *Billing Discrepancy / Overcharge*
    - *Damaged or Defective Item*
    - *Staff Misbehavior / Rude Service*
    - *Exchange / Return Assistance*
    - *Missing Promotional Discount / Points*
  - **Item Attribution**: Multi-select dropdown auto-populated with the itemized SKUs from their invoice.
  - **Photo Proof Upload**: Direct attachment upload for damaged garments, broken packaging, or faulty tags.
  - **Preferred Resolution Channel**: WhatsApp, Phone Call, or Email.

### Channel B: Conversational WhatsApp 2-Way Bot (Core Differentiator)
- **Problem**: Retail shoppers rarely check email; they are already looking at their digital invoice on WhatsApp.
- **Mechanism**:
  - Customer replies to the WABA invoice dispatch with keywords: *"issue"*, *"complaint"*, *"wrong bill"*, *"damaged"*, *"return"*, *"exchange"*.
  - Incoming WABA webhook (`/api/v1/waba/webhook`) intercepts the message and triggers an **Interactive WhatsApp List Menu**:
    > *"Hello! We are sorry to hear you're experiencing an issue with your recent purchase at [Store Name]. Please select how our team can help you:"*
    > 1. 💳 Billing Discrepancy
    > 2. 👗 Damaged / Defective Item
    > 3. 👔 Staff / In-Store Service
    > 4. 🔄 Return or Exchange Assistance
  - Customer can reply with text or upload a **photo / voice note**.
  - WABA media webhook downloads the attachment securely and threads it directly into the merchant's resolution dashboard.

### Channel C: Transactional Email Helpdesk
- Automated ticket generation via `care@retailnode.in` or merchant custom domain.
- Generates standard subject format: `[Ticket #TKT-1042] We have received your query regarding Bill #INV-982`.
- Two-way email parsing: Replies from customer automatically thread into the dashboard timeline.

---

## 3. Ticketing Lifecycle & SLA State Machine

| Status | Trigger | Automated Action & SLA |
| :--- | :--- | :--- |
| **New (Unassigned)** | Form submission or WhatsApp issue | Instant acknowledgment via WhatsApp/SMS. Auto-assigns to Store Manager. Starts SLA clock. |
| **Under Review** | Manager opens ticket in panel | Displays invoice snapshot, cashier ID, customer lifetime spends, and uploaded photos. |
| **Action Taken** | Manager responds / issues voucher | Dispatches WhatsApp response to customer. Offers exchange pickup or goodwill voucher. |
| **Escalated** | SLA breached (> 6h with no manager reply) | Dispatches high-priority SMS/WhatsApp escalation alert to Store Owner / Regional Head. |
| **Resolved** | Staff completes action | Triggers automated CSAT verification: *"Was your issue resolved? [Yes] [No]"*. |
| **Closed** | Customer confirms satisfaction | Ticket archived. Recovery metrics logged into merchant analytics. |

---

## 4. The 2-Way WhatsApp Resolution Bridge

When store management responds from the dashboard:
1. **Threaded Chat Timeline**:
   - Displays customer profile, past invoices, lifetime value, cashier who generated the bill, and complaint timeline.
   - Staff types a response: *"Dear Priya, we checked with our billing cashier. The extra ₹120 charged was an accidental double-scan. We are issuing an instant refund + ₹200 apology store credit."*
2. **Delivery Handling**:
   - **Active 24h Window**: Dispatched instantly as a freeform session WhatsApp message directly into customer's chat.
   - **Closed Window (> 24h)**: Dispatched using an approved WABA Utility template `grievance_status_update` containing an interactive button to view update.
3. **In-Chat Customer Replies**:
   - Incoming webhook captures customer response and appends it to the ticket thread in real time.

---

## 5. Automated Customer Compensation & Retention Loop

1. **1-Click Goodwill Loyalty Points**:
   - Store manager clicks `[Grant +100 Goodwill Loyalty Points]`.
   - Points are credited immediately to customer's wallet in `customers` table, with automated WhatsApp confirmation.
2. **1-Click Apology Voucher Generator**:
   - Store manager clicks `[Issue Apology Coupon]`.
   - Generates a single-use promo code (e.g. `CARE15` — 15% OFF on next purchase, valid for 30 days) and dispatches via WhatsApp.
3. **Automated CSAT Recovery Verification**:
   - Upon marking ticket resolved, customer receives a WhatsApp rating prompt:
     > *"Did our store team resolve your concern satisfactorily?*  
     > *[👍 Yes, Satisfied]  [👎 Need More Help]"*
   - **If Yes**: Retention recorded; negative Google review avoided.
   - **If No**: Automatically re-opens ticket with `CRITICAL` priority for owner direct intervention.

---

## 6. Merchant Dashboard: "Care & Grievance Desk" UI (`/dashboard/complaints`)

1. **Dense Ticket Inbox (Split View & Kanban)**:
   - Left panel: Ticket list sorted by urgency, showing SLA countdown timers (`⏱️ 42m left`, `⚠️ SLA Breached`, `✓ Resolved`), customer name, and bill number.
   - Right panel: Complete threaded conversation, photo proof viewer, bill summary, and action bar.
2. **Store Staff Attribution**:
   - Identifies which cashier and counter processed the original invoice, exposing recurring operational issues (e.g. Counter 3 has high price mismatch complaints).
3. **Root-Cause Analytics**:
   - Breakdown: Billing Speed vs Defective Garment vs Staff Attitude vs Pricing Error.
   - Average First-Response Time & Average Resolution Time.
   - Customer Recovery Rate: % of complainants who make a repeat purchase within 60 days.

---

## 7. Phased Implementation Roadmap

### Phase 1: Core Ticketing Engine & Digital Receipt Form
- Database schemas: `complaint_tickets`, `ticket_messages`, `ticket_attachments`.
- Embedded complaint drawer in `BillReceipt.jsx` with photo upload and category picker.
- Backend API endpoints: `POST /api/v1/invoices/:slug/complaints`, `GET /api/v1/complaints/list`.

### Phase 2: Merchant Care Desk UI & Manager Actions
- Dedicated panel: `src/pages/merchant/CustomerComplaints.jsx` (`/dashboard/complaints`).
- Ticket lifecycle transitions, manager resolution notes, and SLA tracking.
- Automated goodwill voucher generation (`coupons` integration).

### Phase 3: Conversational WhatsApp WABA 2-Way Bot
- Webhook parser for inbound complaint keywords in `webhookController.js`.
- Interactive WhatsApp list menu dispatch.
- Media webhook handling for photo uploads from customer WhatsApp to S3/local storage.
- Automated CSAT post-resolution survey loop via WABA.
