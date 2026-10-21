/**
 * RetailNode Desktop Print & Billing Agent
 * Windows Portable POS Interceptor & Digital Invoice Utility
 * 
 * Supports:
 * 1. Interactive cashier manual test & bill dispatch
 * 2. ESC/POS RAW TCP Port 9100 printer interception
 * 3. File spool directory watcher for Tally / Busy / Marg
 * 4. High-concurrency automated stress testing
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const http = require('http');
const https = require('https');
const readline = require('readline');

// Configuration file resolution
const configPath = path.join(process.cwd(), 'config.json');
let config = {
  apiUrl: 'https://bill.retailnode.in/api/v1',
  apiToken: 'rn_live_store_token_demo_123',
  storeName: 'RetailNode Demo Store',
  storeAddress: '123 Market Road, Mumbai, MH',
  tcpPort: 9100,
  spoolDir: './spool'
};

if (fs.existsSync(configPath)) {
  try {
    const userCfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...userCfg };
  } catch (e) {
    console.error('[Config] Error loading config.json:', e.message);
  }
} else {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {}
}

// HTTP POST helper
function postInvoice(payload) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(`${config.apiUrl}/invoices/upload`);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    const bodyStr = JSON.stringify(payload);

    const req = protocol.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'X-API-Token': config.apiToken,
        'User-Agent': 'RetailNodePrintAgent/1.0.0 (Windows)'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    req.write(bodyStr);
    req.end();
  });
}

// Regex parser for ESC/POS and plain text receipts
function parseReceiptText(text) {
  let phone = '9876543210';
  const phoneMatch = text.match(/(?:(?:\+|0{0,2})91[\s-]*)?([6789]\d{9})\b/);
  if (phoneMatch) phone = phoneMatch[1];

  let amount = 100.00;
  const amtMatch = text.match(/(?:Grand\s*Total|Net\s*Payable|Net\s*Amount|Total|Amt)[\s:]*([0-9,.]+)/i);
  if (amtMatch) {
    const parsed = parseFloat(amtMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) amount = parsed;
  }

  let invNo = `POS-${Date.now().toString().slice(-6)}`;
  const invMatch = text.match(/(?:Inv(?:oice)?[\s#:]*)([A-Z0-9\/-]+)/i);
  if (invMatch) invNo = invMatch[1];

  return {
    CustomerPhone: phone,
    BillTotal: amount.toFixed(2),
    InvoiceNumber: invNo,
    StoreName: config.storeName,
    StoreAddress: config.storeAddress,
    LineItems: [
      { ItemName: 'POS Intercepted Item 1', Qty: 1, Rate: amount, Amount: amount }
    ]
  };
}

// 1. RAW Port 9100 Print Interceptor Server
function startPrintServer() {
  const server = net.createServer((socket) => {
    let buffer = '';
    console.log(`\n[Print Interceptor] Inbound print stream from ${socket.remoteAddress}:${socket.remotePort}`);

    socket.on('data', (chunk) => {
      buffer += chunk.toString('latin1');
    });

    socket.on('end', async () => {
      console.log(`[Print Interceptor] Received ${buffer.length} bytes from POS printer driver.`);
      const receipt = parseReceiptText(buffer);
      console.log(`[Print Interceptor] Extracted Phone: ${receipt.CustomerPhone}, Total: ₹${receipt.BillTotal}, Invoice: ${receipt.InvoiceNumber}`);

      try {
        console.log(`[Print Interceptor] Uploading to RetailNode Cloud (${config.apiUrl})...`);
        const res = await postInvoice({ receiptData: receipt });
        if (res.status === 200 || res.status === 201) {
          console.log(`\x1b[32m[SUCCESS] Digital Invoice Generated!\x1b[0m`);
          console.log(`Receipt URL: ${res.data.url || `https://bill.retailnode.in/t/${res.data.shortId}`}`);
          console.log(`Loyalty Points: ${res.data.loyalty_points || 0} | Status: ${res.data.messagingStatus || 'sent'}\n`);
        } else {
          console.log(`\x1b[31m[Upload Failed]\x1b[0m HTTP ${res.status}:`, res.data);
        }
      } catch (err) {
        console.error(`\x1b[31m[Sync Error]\x1b[0m`, err.message);
      }
    });

    socket.on('error', (err) => {
      console.error(`[Socket Error]`, err.message);
    });
  });

  server.listen(config.tcpPort, '0.0.0.0', () => {
    console.log(`\x1b[36m[ESC/POS Interceptor Server]\x1b[0m Listening on RAW TCP Port ${config.tcpPort}`);
    console.log(`To intercept Tally / Busy / Marg prints: Add a generic network printer pointing to 127.0.0.1:${config.tcpPort}\n`);
  });

  return server;
}

// 2. Spool Directory Watcher
function startSpoolWatcher() {
  if (!fs.existsSync(config.spoolDir)) {
    try { fs.mkdirSync(config.spoolDir, { recursive: true }); } catch (e) {}
  }

  console.log(`\x1b[36m[Folder Spool Watcher]\x1b[0m Watching directory: ${path.resolve(config.spoolDir)}`);
  fs.watch(config.spoolDir, async (eventType, filename) => {
    if (eventType === 'rename' && filename && (filename.endsWith('.txt') || filename.endsWith('.prn') || filename.endsWith('.json'))) {
      const fullPath = path.join(config.spoolDir, filename);
      if (fs.existsSync(fullPath)) {
        setTimeout(async () => {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            let receipt;
            if (filename.endsWith('.json')) {
              receipt = JSON.parse(content);
            } else {
              receipt = parseReceiptText(content);
            }
            console.log(`\n[Spool File Detected] ${filename}`);
            const res = await postInvoice({ receiptData: receipt });
            console.log(`[Spool Upload] Status: ${res.status} | URL: ${res.data?.url || res.data?.shortId}`);
            // Move processed file
            const donePath = path.join(config.spoolDir, 'processed_' + filename);
            fs.renameSync(fullPath, donePath);
          } catch (e) {
            console.error(`[Spool Process Error] ${filename}:`, e.message);
          }
        }, 500);
      }
    }
  });
}

// 3. Interactive CLI
function prompt(rl, question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function runInteractiveTest(rl) {
  console.log('\n========================================');
  console.log('   CREATE & DISPATCH TEST BILL');
  console.log('========================================');

  const phone = (await prompt(rl, 'Enter Customer Phone (10 digits) [default: 9876543210]: ')).trim() || '9876543210';
  const amountStr = (await prompt(rl, 'Enter Bill Amount in ₹ [default: 1250]: ')).trim() || '1250';
  const invNumber = (await prompt(rl, `Enter Invoice Number [default: INV-${Date.now().toString().slice(-6)}]: `)).trim() || `INV-${Date.now().toString().slice(-6)}`;
  const itemName = (await prompt(rl, 'Enter Item Name [default: Formal Cotton Shirt]: ')).trim() || 'Formal Cotton Shirt';

  const amount = parseFloat(amountStr) || 1250;
  const receipt = {
    CustomerPhone: phone,
    BillTotal: amount.toFixed(2),
    InvoiceNumber: invNumber,
    StoreName: config.storeName,
    StoreAddress: config.storeAddress,
    LineItems: [
      { ItemName: itemName, Qty: 1, Rate: amount, Amount: amount }
    ]
  };

  console.log('\n[Dispatching...] Sending invoice to RetailNode Cloud API...');
  const startTime = Date.now();

  try {
    const res = await postInvoice({ receiptData: receipt });
    const latency = Date.now() - startTime;

    if (res.status === 200 || res.status === 201) {
      console.log('\n\x1b[32m========================================================\x1b[0m');
      console.log(`\x1b[32m✔ SUCCESS! Invoice Processed in ${latency}ms\x1b[0m`);
      console.log(`\x1b[32m========================================================\x1b[0m`);
      console.log(`📄 Short Receipt ID : ${res.data.shortId}`);
      console.log(`🔗 Public URL      : ${res.data.url || `https://bill.retailnode.in/t/${res.data.shortId}`}`);
      console.log(`⭐ Loyalty Points  : ${res.data.loyalty_points || 'Calculated'}`);
      console.log(`📲 WhatsApp Status : ${res.data.messagingStatus || 'sent'}`);
      console.log(`\x1b[32m========================================================\x1b[0m\n`);
    } else {
      console.log(`\n\x1b[31m[FAILED]\x1b[0m HTTP ${res.status}:`, res.data);
    }
  } catch (err) {
    console.error('\n\x1b[31m[Connection Error]\x1b[0m', err.message);
    console.log(`Verify that ${config.apiUrl} is reachable and your API Token is active.`);
  }
}

async function runAutomatedStressTest() {
  console.log('\n========================================');
  console.log('   RUNNING HIGH-THROUGHPUT STRESS TEST (5 BILLS)');
  console.log('========================================');

  const sampleItems = ['Silk Saree', 'Linen Kurta', 'Designer Scarf', 'Cotton Trouser', 'Formal Blazer'];
  const testPhones = ['9876543210', '9123456780', '9898989898', '9765432109', '8857808284'];

  for (let i = 0; i < 5; i++) {
    const invNumber = `STRESS-${Date.now().toString().slice(-4)}-${i + 1}`;
    const amount = Math.floor(Math.random() * 4000) + 500;
    const phone = testPhones[i];
    const item = sampleItems[i];

    const receipt = {
      CustomerPhone: phone,
      BillTotal: amount.toFixed(2),
      InvoiceNumber: invNumber,
      StoreName: config.storeName,
      StoreAddress: config.storeAddress,
      LineItems: [{ ItemName: item, Qty: 1, Rate: amount, Amount: amount }]
    };

    const t0 = Date.now();
    try {
      const res = await postInvoice({ receiptData: receipt });
      const elapsed = Date.now() - t0;
      console.log(`[#${i + 1}/5] ${invNumber} | ₹${amount} | ${phone} ➔ ${elapsed}ms | HTTP ${res.status} | URL: ${res.data?.url || res.data?.shortId}`);
    } catch (e) {
      console.log(`[#${i + 1}/5] ${invNumber} ➔ FAILED: ${e.message}`);
    }
  }

  console.log('\n✔ Stress test completed. Check your Merchant Dashboard (/dashboard) for real-time delivery logs!\n');
}

// Banner
function printBanner() {
  console.log('\x1b[34m====================================================================\x1b[0m');
  console.log('\x1b[1m\x1b[37m       RETAILNODE DIGITAL INVOICE & PRINT AGENT (WINDOWS POS)       \x1b[0m');
  console.log('\x1b[34m====================================================================\x1b[0m');
  console.log(` Target Server : \x1b[36m${config.apiUrl}\x1b[0m`);
  console.log(` Store Token   : \x1b[33m${config.apiToken.slice(0, 15)}...\x1b[0m`);
  console.log(` Store Name    : ${config.storeName}`);
  console.log(` RAW TCP Port  : ${config.tcpPort}`);
  console.log(` Spool Folder  : ${path.resolve(config.spoolDir)}`);
  console.log('\x1b[34m====================================================================\x1b[0m\n');
}

async function main() {
  printBanner();
  startPrintServer();
  startSpoolWatcher();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  while (true) {
    console.log('Select an option:');
    console.log('  [1] Send a test digital invoice (Manual entry)');
    console.log('  [2] Run 5-invoice automated stress test');
    console.log('  [3] Show active configuration');
    console.log('  [4] Update API Token or Server URL');
    console.log('  [5] Exit');

    const choice = (await prompt(rl, '\nChoice [1-5]: ')).trim();

    if (choice === '1') {
      await runInteractiveTest(rl);
    } else if (choice === '2') {
      await runAutomatedStressTest();
    } else if (choice === '3') {
      console.log('\nCurrent Configuration:', JSON.stringify(config, null, 2), '\n');
    } else if (choice === '4') {
      const newUrl = await prompt(rl, `Server URL [${config.apiUrl}]: `);
      if (newUrl.trim()) config.apiUrl = newUrl.trim();
      const newToken = await prompt(rl, `API Token [${config.apiToken}]: `);
      if (newToken.trim()) config.apiToken = newToken.trim();
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('\n✔ Configuration saved to config.json!\n');
    } else if (choice === '5' || choice.toLowerCase() === 'exit') {
      console.log('Exiting RetailNode Print Agent. Goodbye!');
      process.exit(0);
    } else {
      console.log('Invalid choice. Please select 1, 2, 3, 4, or 5.\n');
    }
  }
}

main().catch(err => {
  console.error('Fatal agent error:', err);
  process.exit(1);
});
