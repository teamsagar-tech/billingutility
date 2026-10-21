#!/usr/bin/env node
/**
 * Script to create and submit both RetailNode Utility Templates to Meta WhatsApp Cloud API
 * on the default WABA account (378243102032704).
 * 
 * 1. retailnode_invoice_image (Category: UTILITY, Header: IMAGE, Footer: Powered by RetailNode)
 * 2. retailnode_invoice_pdf   (Category: UTILITY, Header: DOCUMENT, Footer: Powered by RetailNode)
 * 
 * This script runs securely on the WABA server without exposing Meta tokens to client applications.
 */

const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const GRAPH_API_BASE = 'https://graph.facebook.com';
const GRAPH_API_VERSION = 'v20.0';
const SYSTEM_WABA_ID = '378243102032704';

async function uploadResumableMedia(appId, systemToken, fileBuffer, fileType) {
    console.log(`[Upload] Creating upload session for ${fileType} (${fileBuffer.length} bytes)...`);
    const sessionUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${appId}/uploads?file_length=${fileBuffer.length}&file_type=${fileType}`;
    const sessionRes = await axios.post(sessionUrl, {}, {
        headers: { 'Authorization': `Bearer ${systemToken}` }
    });
    const uploadSessionId = sessionRes.data.id;
    console.log(`[Upload] Upload session ID: ${uploadSessionId}`);

    console.log(`[Upload] Uploading binary data...`);
    const uploadUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${uploadSessionId}`;
    const uploadRes = await axios.post(uploadUrl, fileBuffer, {
        headers: {
            'Authorization': `OAuth ${systemToken}`,
            'file_offset': '0',
            'Content-Type': fileType
        }
    });
    console.log(`[Upload] Header handle obtained: ${uploadRes.data.h}`);
    return uploadRes.data.h;
}

// Minimal valid single-page PDF generator
function createSamplePdfBuffer() {
    const header = "%PDF-1.4\n";
    const body = 
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n" +
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n" +
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >> endobj\n" +
        "4 0 obj << /Length 73 >> stream\n" +
        "BT /F1 14 Tf 70 700 Td (RetailNode Tax Invoice Receipt - Sample Document) Tj ET\n" +
        "endstream\n" +
        "endobj\n";
    const xref = 
        "xref\n0 5\n0000000000 65535 f \n" +
        "0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000266 00000 n \n" +
        "trailer << /Size 5 /Root 1 0 R >>\nstartxref\n390\n%%EOF\n";
    return Buffer.from(header + body + xref);
}

// Minimal 1x1 valid PNG buffer
function createSamplePngBuffer() {
    return Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
}

async function main() {
    let pool;
    try {
        pool = mysql.createPool({
            host: 'localhost',
            user: 'waba_user_local',
            password: 'India@1990',
            database: 'waba_saas',
            waitForConnections: true,
            connectionLimit: 10
        });

        const [configRows] = await pool.query(
            'SELECT app_id, token FROM phone_number_details WHERE whatsapp_business_account_id = ? LIMIT 1',
            [SYSTEM_WABA_ID]
        );

        if (!configRows.length || !configRows[0].token) {
            throw new Error(`No credentials found for WABA ID: ${SYSTEM_WABA_ID}`);
        }

        const systemToken = configRows[0].token;
        const appId = configRows[0].app_id || '928805991617173';
        console.log(`[Init] WABA ID: ${SYSTEM_WABA_ID}, App ID: ${appId}`);

        // Generate or load sample image
        let imageBuffer = createSamplePngBuffer();
        if (fs.existsSync('/home/ubuntu/waba-nodejs/frontend/src/assets/hero.png')) {
            imageBuffer = fs.readFileSync('/home/ubuntu/waba-nodejs/frontend/src/assets/hero.png');
        }
        const imageHandle = await uploadResumableMedia(appId, systemToken, imageBuffer, 'image/png');

        // Generate sample PDF
        const pdfBuffer = createSamplePdfBuffer();
        const pdfHandle = await uploadResumableMedia(appId, systemToken, pdfBuffer, 'application/pdf');

        const templatesUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${SYSTEM_WABA_ID}/message_templates`;

        // ==========================================
        // 1. Template: retailnode_invoice_image
        // ==========================================
        console.log('\n--- Submitting retailnode_invoice_image (UTILITY) ---');
        const imageTemplatePayload = {
            name: 'retailnode_invoice_image',
            language: 'en',
            category: 'UTILITY',
            components: [
                {
                    type: 'HEADER',
                    format: 'IMAGE',
                    example: { header_handle: [imageHandle] }
                },
                {
                    type: 'BODY',
                    text: 'Dear Customer,\n\nThank you for your transaction with {{1}}.\n\nTo see your Invoice, click the button below :\n\nFor any queries, pls contact us at {{2}} for assistance.',
                    example: {
                        body_text: [
                            ['V R Pawar Sarees Chatti Galli', '+91 8857808284']
                        ]
                    }
                },
                {
                    type: 'FOOTER',
                    text: 'Powered by RetailNode'
                },
                {
                    type: 'BUTTONS',
                    buttons: [
                        {
                            type: 'URL',
                            text: 'See Invoice',
                            url: 'https://bill.retailnode.in/t/{{1}}',
                            example: ['zGxupOTK']
                        }
                    ]
                }
            ]
        };

        try {
            const res1 = await axios.post(templatesUrl, imageTemplatePayload, {
                headers: {
                    'Authorization': `Bearer ${systemToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('[SUCCESS] retailnode_invoice_image created:', res1.data);
        } catch (e) {
            console.warn('[Response] retailnode_invoice_image:', e.response?.data || e.message);
        }

        // ==========================================
        // 2. Template: retailnode_invoice_pdf
        // ==========================================
        console.log('\n--- Submitting retailnode_invoice_pdf (UTILITY) ---');
        const pdfTemplatePayload = {
            name: 'retailnode_invoice_pdf',
            language: 'en',
            category: 'UTILITY',
            components: [
                {
                    type: 'HEADER',
                    format: 'DOCUMENT',
                    example: { header_handle: [pdfHandle] }
                },
                {
                    type: 'BODY',
                    text: 'Hi {{1}}, thank you for shopping with {{2}}! 🛍️\n\nYour invoice is attached below. We hope you loved your experience with us. We would be incredibly grateful if you could take a moment to share your feedback or view your digital invoice:',
                    example: {
                        body_text: [
                            ['Valued Customer', 'Deepak Sarees Panvel']
                        ]
                    }
                },
                {
                    type: 'FOOTER',
                    text: 'Powered by RetailNode'
                },
                {
                    type: 'BUTTONS',
                    buttons: [
                        {
                            type: 'URL',
                            text: 'View Invoice',
                            url: 'https://bill.retailnode.in/t/{{1}}',
                            example: ['zGxupOTK']
                        }
                    ]
                }
            ]
        };

        try {
            const res2 = await axios.post(templatesUrl, pdfTemplatePayload, {
                headers: {
                    'Authorization': `Bearer ${systemToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('[SUCCESS] retailnode_invoice_pdf created:', res2.data);
        } catch (e) {
            console.warn('[Response] retailnode_invoice_pdf:', e.response?.data || e.message);
        }

        // ==========================================
        // Sync templates into waba_saas.message_templates
        // ==========================================
        console.log('\n--- Fetching live templates from Meta to sync local DB ---');
        const fetchUrl = `${GRAPH_API_BASE}/${GRAPH_API_VERSION}/${SYSTEM_WABA_ID}/message_templates?limit=100`;
        const fetchRes = await axios.get(fetchUrl, {
            headers: { 'Authorization': `Bearer ${systemToken}` }
        });

        const liveTemplates = fetchRes.data?.data || [];
        console.log(`Fetched ${liveTemplates.length} templates from Meta Graph API.`);

        for (const t of liveTemplates) {
            if (t.name.startsWith('retailnode_')) {
                console.log(`Syncing ${t.name} (Status: ${t.status}, Category: ${t.category})...`);
                await pool.query(
                    `INSERT INTO message_templates (
                        id, whatsapp_business_account_id, name, category, language, status, components
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        status = VALUES(status),
                        components = VALUES(components),
                        category = VALUES(category),
                        updated_at = NOW()`,
                    [
                        t.id,
                        SYSTEM_WABA_ID,
                        t.name,
                        t.category,
                        t.language,
                        t.status,
                        JSON.stringify(t.components)
                    ]
                );
            }
        }

        console.log('\n[DONE] Templates successfully submitted and synced!');

    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        if (pool) await pool.end();
        process.exit(0);
    }
}

main();
