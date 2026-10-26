---
name: enterprise-reports
description: SOP for generating high-volume, multi-firm, multi-location reports (1000 Cr+ scaling)
---

# Enterprise Reports Skill (1000 Cr+ Scaling)

Use this skill whenever the user requests the creation or modification of a **Report** in the SaaS Platform. Due to the scale of the system (1000 Cr+ records / billions of rows), all reports must follow these strict enterprise guidelines to prevent memory exhaustion, out-of-memory (OOM) errors, and timeouts.

## 1. Backend: Data Aggregation & Pagination
When building a new report endpoint in controllers (e.g. `salesReportController2.js` or `purchaseReportController.js`), you MUST implement:

- **Strict Date Range limits**: You must prevent full collection scans. Enforce a maximum date range (e.g. 31 days) inside the `$match` filter. If the user does not provide dates, default to the last 7 days or today. Throw a 400 error if the range exceeds 31 days.
- **Multi-Firm & Multi-Location**: Always include `firmName` and `location` filters in the `$match` stage if passed from `req.query`.
- **Pre-Unwind Sorting**: If sorting by date or bill number, place the `$sort` stage **BEFORE** `$unwind` and `$lookup` so MongoDB can use indexes rather than doing an in-memory sort of millions of unwound items.
- **Server-Side Pagination**: Use `$skip` and `$limit`.
- **`allowDiskUse(true)`**: You MUST append `.allowDiskUse(true)` to the `.aggregate(pipeline)` call.
- **`$facet` for single-query data extraction**: Use `$facet` to simultaneously get:
  1. `data`: The paginated subset (`$skip` / `$limit`).
  2. `summaryTotals`: The total aggregation (e.g. `$sum: "$qty"`) of the entire date range, ignoring pagination.
  3. `metadata`: Total record count and calculated total pages.
- **Explicit Column Return**: The endpoint response must include a `columns` array so the frontend can dynamically render headers even when `data` is empty.

### Example Backend Response format:
```json
{
  "data": [ { ... } ],
  "metadata": { "totalRecords": 1500, "page": 1, "limit": 100, "totalPages": 15 },
  "summaryTotals": { "totalQty": 45000, "totalAmount": 12500000 },
  "columns": ["billNo", "billDate", "firmName", "location", "qty", "amount"]
}
```

## 2. Frontend: Empty States & Pagination UI
When modifying `GenericReportDashboard.jsx` or creating new report UIs:

- **Always render headers**: Use the `columns` array from the API response to render the `<thead>`. Do NOT rely on `Object.keys(data[0])` because if the `data` array is empty, the table will have no headers.
- **Empty States**: If `data.length === 0`, render the `<thead>` and a single `<tbody><tr>` stating "No data available for this report."
- **Pagination Controls**: Include Next/Prev buttons using `metadata.page` and `metadata.totalPages`.
- **Filter Parameters**: Ensure `page`, `limit`, `firmName`, `location`, `startDate`, and `endDate` are appended to the URL query string when fetching.
- **Global Totals**: Display `summaryTotals` from the backend in the `<tfoot>`, overriding any frontend-calculated totals for numeric columns.

## 3. Database: Compound Indexes
When modifying models (e.g. `SaleInvoice.js`):

- **Index your filters**: Ensure a compound index exists covering the tenant, firm, location, and the date field used for `$match`.
  `schema.index({ tenant_id: 1, firmName: 1, location: 1, billDate: -1 });`
- **Native Fields**: Ensure the document has native `location` and `locationName` string fields (or ObjectIds if using strict relation). Avoid relying solely on sub-documents for top-level report filtering.
