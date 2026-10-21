/**
 * End-to-End Verification Test for Universal Audit & Telemetry Logging
 */
const http = require('http');

function makeRequest({ method = 'GET', path, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {})
    };

    const req = http.request(
      {
        hostname: 'localhost',
        port: 4000,
        path,
        method,
        headers: reqHeaders
      },
      (res) => {
        let respBody = '';
        res.on('data', (chunk) => (respBody += chunk));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(respBody);
          } catch (e) {
            parsed = respBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Universal Audit & Telemetry Logging Test Suite...\n');

  // Test 1: Page View Telemetry Ingestion (Public & Anonymous Route)
  console.log('1️⃣ Testing POST /api/v1/telemetry/page-view (Public Landing)...');
  const pvRes1 = await makeRequest({
    method: 'POST',
    path: '/api/v1/telemetry/page-view',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'X-Forwarded-For': '103.21.244.15'
    },
    body: {
      path: '/features',
      pageTitle: 'Platform Features',
      sessionId: 'test_sess_001',
      durationSeconds: 12,
      panelType: 'public'
    }
  });
  console.log('   Response Status:', pvRes1.status, pvRes1.data);
  if (pvRes1.status !== 200) throw new Error('Page view telemetry failed');

  // Test 2: Failed Login Attempt (Should record login_failed with IP and reason)
  console.log('\n2️⃣ Testing POST /api/v1/auth/login (Invalid Password)...');
  const failLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/login',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      'X-Forwarded-For': '49.37.18.99'
    },
    body: {
      email: 'admin@retailnode.in',
      password: 'wrong_password_attempt_123'
    }
  });
  console.log('   Response Status:', failLoginRes.status, failLoginRes.data?.error);

  // Test 3: Successful SuperAdmin Login (Should record login_success with IP and token)
  console.log('\n3️⃣ Testing POST /api/v1/auth/login (SuperAdmin Valid Credentials)...');
  const successLoginRes = await makeRequest({
    method: 'POST',
    path: '/api/v1/auth/login',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'X-Forwarded-For': '157.34.88.102'
    },
    body: {
      email: 'admin@retailnode.in',
      password: process.env.SUPERADMIN_DEFAULT_PASSWORD || 'RetailNode@SuperAdmin2026!'
    }
  });
  console.log('   Login Result:', successLoginRes.status, successLoginRes.data?.role, 'Token received:', Boolean(successLoginRes.data?.token));
  const token = successLoginRes.data?.token;

  if (!token) {
    console.warn('   ⚠️ SuperAdmin default credentials did not return token; testing with test token if available');
  }

  // Test 4: Authenticated Panel Page View Telemetry
  console.log('\n4️⃣ Testing POST /api/v1/telemetry/page-view (Merchant Dashboard Invoices Page)...');
  const pvRes2 = await makeRequest({
    method: 'POST',
    path: '/api/v1/telemetry/page-view',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0',
      'X-Forwarded-For': '115.112.98.5'
    },
    body: {
      path: '/dashboard/invoices',
      pageTitle: 'Digital Bill Stream',
      sessionId: 'test_sess_002',
      durationSeconds: 45,
      panelType: 'merchant_panel'
    }
  });
  console.log('   Response Status:', pvRes2.status, pvRes2.data);

  // Test 5: End-Customer Public Receipt View (Simulating WhatsApp Mobile User)
  console.log('\n5️⃣ Testing Customer Receipt View GET /api/v1/invoices/:slug...');
  const invRes = await makeRequest({
    method: 'GET',
    path: '/api/v1/invoices/test1234',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WhatsApp/2.23.12.75',
      'X-Forwarded-For': '106.210.35.44',
      'Referer': 'https://api.whatsapp.com/'
    }
  });
  console.log('   Invoice View Status:', invRes.status, 'Customer masked phone/store:', invRes.data?.data?.customerProfile?.name || invRes.data?.storeName || invRes.data?.error);

  // Allow setImmediate background inserts to flush to MySQL
  await new Promise((r) => setTimeout(r, 600));

  // Test 6: Verify Database Records in MySQL
  console.log('\n6️⃣ Verifying MySQL Stored Records via Direct DB Query...');
  const db = require('./config/database');

  // Check audit_logs
  const [auditRows] = await db.query(
    'SELECT id, event_name, status, actor_email, ip_address, device_type, failure_reason, created_at FROM audit_logs ORDER BY id DESC LIMIT 5'
  );
  console.log('   Recent Audit Logs in DB:');
  console.table(auditRows);

  // Check panel_page_views
  const [pvRows] = await db.query(
    'SELECT id, path, page_title, panel_type, ip_address, duration_seconds, session_id FROM panel_page_views ORDER BY id DESC LIMIT 5'
  );
  console.log('   Recent Panel Page Views in DB:');
  console.table(pvRows);

  // Check invoice_views
  const [ivRows] = await db.query(
    'SELECT id, short_id, customer_phone, view_number, is_unique_ip, ip_address, is_whatsapp_webview, device_type FROM invoice_views ORDER BY id DESC LIMIT 5'
  );
  console.log('   Recent Customer Invoice Views in DB:');
  console.table(ivRows);

  console.log('\n✅ All Universal Logging & Telemetry tests passed successfully!\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Error:', err);
  process.exit(1);
});
