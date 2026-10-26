---
name: billintegration-page-creation
description: Standard Operating Procedure for creating and routing new pages, dashboard hubs, and public customer-facing screens in the Digital Invoice platform.
---

# Page Creation & Routing SOP

When instructed to create a new page, customer view, or merchant dashboard module, you **MUST** follow this standardized workflow.

## 1. Directory Structure
- Public receipt views: `web-receipt/src/app/t/[slug]/page.tsx`
- Merchant Dashboard pages: `web-receipt/src/app/dashboard/[module]/page.tsx`
- Root Marketing / Portal pages: `src/pages/[PageName].jsx`

## 2. Layout & Aesthetics Standards
- Always use modern, responsive layouts with tailored color palettes, glassmorphism accents, and smooth transitions.
- All merchant dashboard pages must utilize full width (`w-full px-2` to `px-4`) for tables and forms to maximize data density.
- Never use simple minimum viable placeholders.

## 3. SEO & Head Meta Best Practices
Every public-facing page must include dynamic meta tags:
- Title: `<title>{StoreName} - Digital Receipt #{InvoiceNumber}</title>`
- Description: "View your verified digital bill from {StoreName} on RetailNode."
- OpenGraph tags for rich previews when shared over WhatsApp and social channels.

## 4. Keyboard Shortcuts & Auto-Focus
Every data entry page MUST automatically focus the first interactive input field on mount (`autoFocus` or `ref.current?.focus()`).
Forms must support `Enter` to advance/submit and `Escape` to quit.
