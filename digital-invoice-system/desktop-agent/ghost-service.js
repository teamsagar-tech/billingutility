/**
 * RetailNode Ghost Spooler Service
 * Silent, Zero-UI, Background Windows Spool Interceptor
 * 
 * Intercepts print jobs directly from Windows Print Spooler (C:\Windows\System32\spool\PRINTERS)
 * without requiring any UI popups, middleware dialogs, or cashier interaction.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

// Determine base directory (handles pkg standalone binary or node script)
const appDir = path.dirname(process.execPath || process.argv[1]);
const configPath = path.join(appDir, 'config.json');
const logFile = path.join(appDir, 'ghost-service.log');
const queueFile = path.join(appDir, 'offline-queue.json');

// Default Configuration
let config = {
  apiUrl: 'https://bill.retailnode.in/api/v1',
  apiToken: 'rn_live_store_token_here',
  storeName: 'Retail Store',
  storeAddress: 'Main Market Road',
  spoolDir: process.env.SYSTEMROOT 
    ? path.join(process.env.SYSTEMROOT, 'System32', 'spool', 'PRINTERS') 
    : 'C:\\Windows\\System32\\spool\\PRINTERS',
  duplicateWindowSeconds: 300, // 5 minutes duplicate protection
  pollIntervalMs: 1500,
  minBillAmount: 10
};

// Load user config if present
if (fs.existsSync(configPath)) {
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    config = { ...config, ...JSON.parse(raw) };
  } catch (e) {
    log(`[Config] Error reading config.json: ${e.message}`, 'WARN');
  }
} else {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (e) {}
}

// In-memory cache to prevent duplicate dispatches for duplicate/merchant copies
const processedHashes = new Map();

// Helper: Logging with timestamp
function log(msg, level = 'INFO') {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
  if (process.stdout && !process.env.SILENT_DAEMON) {
    process.stdout.write(line);
  }
}

// Helper: Clean non-printable ESC/POS binary codes and extract clean readable text
function sanitizeEscPos(buffer) {
  let text = '';
  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    // Filter ESC/POS commands (ESC = 0x1B, GS = 0x1D, FS = 0x1C)
    if (byte === 0x1B || byte === 0x1D || byte === 0x1C) {
      i++; // skip next byte (command argument)
      continue;
    }
    // Printable ASCII or newline/tab/carriage return
    if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13 || byte === 9) {
      text += String.fromCharCode(byte);
    }
  }
  return text;
}

// Parser: Extract Invoice Metadata from plain text
function parseInvoiceText(rawText) {
  // 1. Mobile Number (Indian 10-digit mobile starting with 6, 7, 8, 9)
  let phone = null;
  const phoneMatch = rawText.match(/(?:(?:\+|0{0,2})91[\s-]*)?([6789]\d{9})\b/);
  if (phoneMatch) {
    phone = phoneMatch[1];
  }

  // 2. Grand Total / Bill Amount
  let amount = 0;
  const amtMatch = rawText.match(/(?:Grand\s*Total|Net\s*Payable|Net\s*Amount|Total\s*Amount|Total|Amt|Bill\s*Amount)[\s:]*([0-9,.]+)/i);
  if (amtMatch) {
    const parsed = parseFloat(amtMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      amount = parsed;
    }
  }

  // 3. Invoice Number
  let invNo = null;
  const invMatch = rawText.match(/(?:Inv(?:oice)?[\s#:\.\/-]*)([A-Z0-9\/-]{3,20})/i);
  if (invMatch) {
    invNo = invMatch[1].trim();
  } else {
    invNo = `SPOOL-${Date.now().toString().slice(-6)}`;
  }

  // 4. Store Name (falls back to config if not detectable)
  let storeName = config.storeName;
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && lines[0].length >= 3 && lines[0].length <= 50 && !lines[0].match(/tax|invoice|memo|cash/i)) {
    storeName = lines[0];
  }

  return {
    CustomerPhone: phone,
    BillTotal: amount.toFixed(2),
    InvoiceNumber: invNo,
    StoreName: storeName,
    StoreAddress: config.storeAddress,
    rawText: rawText.slice(0, 4000), // retain excerpt for debugging
    LineItems: [
      { ItemName: 'Thermal POS Print Item', Qty: 1, Rate: amount, Amount: amount }
    ]
  };
}

// Dispatch to RetailNode Cloud API
function postToRetailNode(receipt) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(`${config.apiUrl}/invoices/upload`);
    const protocol = targetUrl.protocol === 'https:' ? https : http;
    const bodyStr = JSON.stringify({ receiptData: receipt });

    const req = protocol.request({
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: targetUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr),
        'X-API-Token': config.apiToken,
        'User-Agent': 'RetailNodeGhostSpooler/1.0.0 (Windows Service)'
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

// Offline queue manager
function saveToOfflineQueue(receipt) {
  let queue = [];
  if (fs.existsSync(queueFile)) {
    try {
      queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
    } catch (e) { queue = []; }
  }
  queue.push({ receipt, timestamp: Date.now() });
  try {
    fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));
    log(`[Offline Queue] Invoice ${receipt.InvoiceNumber} saved to queue. Total pending: ${queue.length}`, 'INFO');
  } catch (e) {}
}

async function processOfflineQueue() {
  if (!fs.existsSync(queueFile)) return;
  let queue = [];
  try {
    queue = JSON.parse(fs.readFileSync(queueFile, 'utf8'));
  } catch (e) { return; }

  if (!queue.length) return;

  log(`[Offline Queue] Attempting to flush ${queue.length} pending invoices...`, 'INFO');
  const remaining = [];

  for (const item of queue) {
    try {
      const res = await postToRetailNode(item.receipt);
      if (res.status === 200 || res.status === 201) {
        log(`[Offline Queue Flush] Successfully delivered ${item.receipt.InvoiceNumber}`, 'INFO');
      } else {
        remaining.push(item);
      }
    } catch (e) {
      remaining.push(item);
    }
  }

  try {
    fs.writeFileSync(queueFile, JSON.stringify(remaining, null, 2));
  } catch (e) {}
}

// Core Spool Processor
async function processSpoolFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  try {
    // Read raw print stream
    const buffer = fs.readFileSync(filePath);
    if (!buffer || buffer.length === 0) return;

    const cleanText = sanitizeEscPos(buffer);
    if (!cleanText || cleanText.length < 20) return;

    const receipt = parseInvoiceText(cleanText);

    // Filter non-receipt prints or missing phone numbers
    if (!receipt.CustomerPhone || receipt.CustomerPhone === '9876543210') {
      log(`[Spool Skip] No valid customer phone found in print job (${filePath}). Skipping.`, 'DEBUG');
      return;
    }

    if (parseFloat(receipt.BillTotal) < (config.minBillAmount || 1)) {
      log(`[Spool Skip] Bill total ₹${receipt.BillTotal} below minimum threshold. Skipping.`, 'DEBUG');
      return;
    }

    // Anti-duplicate protection: compute hash of (InvoiceNumber + CustomerPhone + BillTotal)
    const hash = crypto.createHash('md5').update(`${receipt.InvoiceNumber}_${receipt.CustomerPhone}_${receipt.BillTotal}`).digest('hex');
    const now = Date.now();

    if (processedHashes.has(hash)) {
      const lastSeen = processedHashes.get(hash);
      if (now - lastSeen < (config.duplicateWindowSeconds * 1000)) {
        log(`[Duplicate Prevented] Invoice ${receipt.InvoiceNumber} for ${receipt.CustomerPhone} already processed ${Math.round((now - lastSeen)/1000)}s ago.`, 'INFO');
        return;
      }
    }
    processedHashes.set(hash, now);

    log(`[Spool Intercepted] Invoice #${receipt.InvoiceNumber} | Phone: ${receipt.CustomerPhone} | Amount: ₹${receipt.BillTotal}`, 'INFO');

    // Upload to Cloud
    try {
      const res = await postToRetailNode(receipt);
      if (res.status === 200 || res.status === 201) {
        log(`[SUCCESS] Digital Invoice & WhatsApp Dispatched! Short ID: ${res.data?.data?.shortId || res.data?.shortId} | URL: ${res.data?.data?.url || res.data?.url}`, 'INFO');
      } else {
        log(`[Cloud Error] HTTP ${res.status}: ${JSON.stringify(res.data)}`, 'WARN');
        saveToOfflineQueue(receipt);
      }
    } catch (netErr) {
      log(`[Network Error] Could not connect to RetailNode API: ${netErr.message}`, 'WARN');
      saveToOfflineQueue(receipt);
    }

  } catch (err) {
    log(`[Spool Read Error] Failed to read ${filePath}: ${err.message}`, 'ERROR');
  }
}

// Active Monitor
function startMonitoring() {
  log(`========================================================================`, 'INFO');
  log(`   RETAILNODE GHOST SPOOLER SERVICE (HEADLESS BACKGROUND DAEMON)        `, 'INFO');
  log(`========================================================================`, 'INFO');
  log(`Target Server  : ${config.apiUrl}`, 'INFO');
  log(`Store Token    : ${config.apiToken.slice(0, 15)}...`, 'INFO');
  log(`Spool Dir      : ${config.spoolDir}`, 'INFO');
  log(`Zero UI Mode   : ACTIVE (No popups, zero cashier interaction)`, 'INFO');
  log(`========================================================================`, 'INFO');

  if (!fs.existsSync(config.spoolDir)) {
    log(`[Directory Warning] Spool directory ${config.spoolDir} not accessible yet. Will keep retrying.`, 'WARN');
  }

  const seenFiles = new Set();

  // Polling loop (safest against Windows system folder locking)
  setInterval(async () => {
    try {
      if (!fs.existsSync(config.spoolDir)) return;
      const files = fs.readdirSync(config.spoolDir);

      for (const file of files) {
        if (file.toLowerCase().endsWith('.spl')) {
          const fullPath = path.join(config.spoolDir, file);
          const stat = fs.statSync(fullPath);

          // If file is fresh (modified within the last 15 seconds) and not yet seen
          if (!seenFiles.has(file)) {
            seenFiles.add(file);
            // Allow 200ms for spool write completion
            setTimeout(() => {
              processSpoolFile(fullPath);
            }, 300);
          }
        }
      }

      // Memory cleanup for seen files set
      if (seenFiles.size > 2000) {
        seenFiles.clear();
      }

      // Periodic check of offline queue
      if (Math.random() < 0.1) {
        processOfflineQueue();
      }
    } catch (e) {
      // System folders can occasionally throw EBUSY during high write volume
    }
  }, config.pollIntervalMs || 1500);

  // FileSystemWatcher for instant low-latency capture
  try {
    if (fs.existsSync(config.spoolDir)) {
      fs.watch(config.spoolDir, (eventType, filename) => {
        if (filename && filename.toLowerCase().endsWith('.spl')) {
          const fullPath = path.join(config.spoolDir, filename);
          if (!seenFiles.has(filename)) {
            seenFiles.add(filename);
            setTimeout(() => {
              processSpoolFile(fullPath);
            }, 250);
          }
        }
      });
      log(`[FileWatcher] Native Windows FileSystemWatcher active on spool folder.`, 'INFO');
    }
  } catch (e) {
    log(`[FileWatcher Notice] Native watcher fallback to polling: ${e.message}`, 'DEBUG');
  }
}

// Start
startMonitoring();
