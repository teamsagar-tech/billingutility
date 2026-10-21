const fs = require('fs');
const target = '/home/ubuntu/waba-nodejs/WABA-APP/index-waba.js';

let code = fs.readFileSync(target, 'utf8');

// 1. Remove duplicate additions at the bottom if any
const routeIdentifier = '// Deploy Pre-defined RetailNode Utility Templates';
if (code.includes(routeIdentifier)) {
    // Remove all occurrences
    const parts = code.split(routeIdentifier);
    code = parts[0]; // Keep everything before the first occurrence
}

// 2. Ensure import is present at the top
if (!code.includes('retailnodeTemplateDeployer.js')) {
    code = code.replace(
        "import dotenv from 'dotenv';",
        "import dotenv from 'dotenv';\nimport { deployRetailNodeUtilityTemplates, getRetailNodeTemplateStatuses } from './retailnodeTemplateDeployer.js';"
    );
}

// 3. Define the routes
const routesBlock = `
// Deploy Pre-defined RetailNode Utility Templates (Invoice PDF, Image, Summary, Loyalty)
app.post('/api/tenant/templates/deploy-retailnode-utility', async (req, res) => {
    const { 
        identifier, 
        store_name, 
        store_phone, 
        custom_prefix, 
        footer_text, 
        types 
    } = req.body;

    if (!identifier) {
        return res.status(400).json({ success: false, error: 'WABA identifier (phone_number_id or waba_id) is required' });
    }

    try {
        const results = await deployRetailNodeUtilityTemplates({
            pool,
            identifier,
            store_name,
            store_phone,
            custom_prefix,
            footer_text,
            types: Array.isArray(types) && types.length > 0 ? types : ['invoice_pdf', 'invoice_image', 'invoice_summary', 'loyalty_update'],
            uploadResumableMediaToMeta
        });

        return res.status(200).json({
            success: true,
            message: 'Utility templates processed successfully',
            templates: results
        });
    } catch (err) {
        console.error('Error deploying RetailNode utility templates:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to deploy utility templates'
        });
    }
});

// Check status of RetailNode Utility Templates on Meta
app.get('/api/tenant/templates/retailnode-status', async (req, res) => {
    const { identifier } = req.query;
    if (!identifier) {
        return res.status(400).json({ success: false, error: 'Identifier query param is required' });
    }

    try {
        const templates = await getRetailNodeTemplateStatuses({
            pool,
            identifier
        });

        return res.status(200).json({
            success: true,
            templates
        });
    } catch (err) {
        console.error('Error fetching RetailNode template statuses:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Failed to fetch template statuses'
        });
    }
});
`;

// Insert BEFORE the wildcard route (e.g. right after submit-suggested)
const anchor = "app.post('/api/tenant/templates/submit-suggested',";
if (code.includes(anchor)) {
    // Find the end of submit-suggested handler or insert before it
    code = code.replace(anchor, routesBlock + "\n" + anchor);
} else {
    // Fallback: insert before /api/:whatsapp_business_account_id/*
    code = code.replace("app.get('/api/:whatsapp_business_account_id/*'", routesBlock + "\napp.get('/api/:whatsapp_business_account_id/*'");
}

fs.writeFileSync(target, code, 'utf8');
console.log('Successfully relocated RetailNode template routes BEFORE the wildcard catch-all in index-waba.js');
