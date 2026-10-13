import fs from 'fs';
import path from 'path';

const OUT_DIR = './billfree_pages';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function main() {
  console.log('=== STEP 1: AUTHENTICATING WITH BILLFREE.IN ===');
  const loginUrl = 'https://billfree.in/site/login';
  const getRes = await fetch(loginUrl);
  const getCookies = getRes.headers.get('set-cookie');
  const phpSess = getCookies?.match(/PHPSESSID=([^;]+)/)?.[1] || '';
  const loginHtml = await getRes.text();

  const devToken = loginHtml.match(/name="dev_token" value="([^"]+)"/)?.[1] || '';
  const devInfo = loginHtml.match(/name="dev_info" value="([^"]+)"/)?.[1] || '';

  const params = new URLSearchParams();
  params.append('LoginForm[username]', '8857808284');
  params.append('LoginForm[password]', '8857808284');
  params.append('LoginForm[fresh]', '');
  params.append('login-button', '');
  params.append('dev_token', devToken);
  params.append('dev_info', devInfo);

  const postRes = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Cookie': 'PHPSESSID=' + phpSess,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    body: params.toString(),
    redirect: 'manual'
  });

  const postCookies = postRes.headers.get('set-cookie') || '';
  const newSess = postCookies.match(/PHPSESSID=([^;]+)/)?.[1] || phpSess;
  const identity = postCookies.match(/_identity-frontend=([^;]+)/)?.[1] || '';
  const csrf = postCookies.match(/_csrf=([^;]+)/)?.[1] || '';
  const awsAlb = postCookies.match(/AWSALB=([^;]+)/)?.[1] || '';
  const awsAlbTg = postCookies.match(/AWSALBTG=([^;]+)/)?.[1] || '';

  const cookieHeader = `PHPSESSID=${newSess}; _identity-frontend=${identity}; _csrf=${csrf}; AWSALB=${awsAlb}; AWSALBTG=${awsAlbTg}`;
  console.log('✓ Session established. Authenticated cookie ready.');

  // Seed URLs covering all known sections and tabs
  const initialSeed = [
    'https://billfree.in/dashboard-summary/index',
    'https://billfree.in/home/index',
    'https://billfree.in/store-comparison/store-comparision',
    'https://billfree.in/generate-bill/index',
    'https://billfree.in/campaigns-hub/index',
    'https://billfree.in/profiles/customers',
    'https://billfree.in/profiles/index',
    'https://billfree.in/roi-explorer/index',
    'https://billfree.in/rewards/index',
    'https://billfree.in/segmentation/list',
    'https://billfree.in/download-center/index',
    'https://billfree.in/loyalty-dashboard/index',
    'https://billfree.in/loyalty-dashboard/points-transaction',
    'https://billfree.in/loyalty-dashboard/redemption',
    'https://billfree.in/coupon-dashboard/index',
    'https://billfree.in/redeem-reward/index',
    'https://billfree.in/gupshup-ss/index',
    'https://billfree.in/digital-bill/index',
    'https://billfree.in/greeting-cards/index',
    'https://billfree.in/users/index',
    'https://billfree.in/account/index',
    'https://billfree.in/account/index?tab=subscriptions',
    'https://billfree.in/account/index?tab=store_profile',
    'https://billfree.in/account/index?tab=security',
    'https://billfree.in/merchant/integration-files',
    'https://billfree.in/feedback/index',
    'https://billfree.in/sms-ledger/index',
    'https://billfree.in/optout-customers/index',
    'https://billfree.in/customer-journey/overview?mobile=8857808284',
    'https://billfree.in/customer-journey/overview?mobile=7011496743',
    'https://billfree.in/profiles/create?phone=8857808284',
    'https://billfree.in/profiles/create?phone=7011496743',
    'https://billfree.in/rewards/create',
    'https://billfree.in/campaigns-hub/create',
    'https://billfree.in/coupon-dashboard/create',
    'https://billfree.in/segmentation/create'
  ];

  const queue = [...initialSeed];
  const visited = new Set();
  const pageDetails = {};

  const isAsset = (url) => {
    return /\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|tar|gz|mp4|webm)(\?.*)?$/i.test(url) ||
           url.includes('manifest.json') ||
           url.includes('/assets/') ||
           url.includes('fonts.googleapis') ||
           url.startsWith('javascript:') ||
           url.startsWith('mailto:') ||
           url.startsWith('tel:');
  };

  console.log(`=== STEP 2: CRAWLING UP TO 100 UNIQUE APPLICATION PAGES ===`);

  while (queue.length > 0 && visited.size < 120) {
    const rawUrl = queue.shift();
    let urlObj;
    try {
      urlObj = new URL(rawUrl);
    } catch {
      continue;
    }

    // Keep URL clean but preserve important query params
    const normalizedUrl = urlObj.origin + urlObj.pathname + (urlObj.search || '');

    if (visited.has(normalizedUrl)) continue;
    visited.add(normalizedUrl);

    console.log(`[${visited.size}] Fetching: ${normalizedUrl}`);

    try {
      const res = await fetch(normalizedUrl, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow'
      });

      if (!res.ok) {
        console.log(`   x HTTP ${res.status}`);
        continue;
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
        console.log(`   - Skipped non-html content-type: ${contentType}`);
        continue;
      }

      const html = await res.text();

      // Extract metadata
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || '';
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';
      const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || '';

      // Extract all form inputs
      const inputs = [...html.matchAll(/<(?:input|select|textarea)[^>]*name="([^"]+)"[^>]*>/gi)].map(m => m[1]);
      
      // Extract table headers
      const tableHeaders = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);

      // Extract card titles or headers
      const cardTitles = [...html.matchAll(/<div[^>]*class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());

      // Save HTML to billfree_pages
      const safeFilename = normalizedUrl.replace('https://billfree.in/', '').replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 80) + '.html';
      const filepath = path.join(OUT_DIR, safeFilename);
      fs.writeFileSync(filepath, html);

      // Record detail
      pageDetails[normalizedUrl] = {
        title,
        heading: h1 || h2,
        savedFile: filepath,
        htmlLength: html.length,
        inputs: [...new Set(inputs)],
        tableHeaders: [...new Set(tableHeaders)],
        cardTitles: [...new Set(cardTitles)],
      };

      // Extract new internal links
      const hrefMatches = [...html.matchAll(/href="([^"#][^"]*)"/g)].map(m => m[1]);
      for (let link of hrefMatches) {
        if (isAsset(link)) continue;
        let resolved = '';
        if (link.startsWith('/')) {
          resolved = 'https://billfree.in' + link;
        } else if (link.startsWith('http://') || link.startsWith('https://')) {
          resolved = link;
        } else {
          resolved = 'https://billfree.in/' + link;
        }

        if (resolved.startsWith('https://billfree.in/') && !resolved.includes('/site/logout') && !isAsset(resolved)) {
          if (!visited.has(resolved) && !queue.includes(resolved)) {
            queue.push(resolved);
          }
        }
      }

    } catch (err) {
      console.error(`   ! Error fetching ${normalizedUrl}:`, err.message);
    }
  }

  // Write master summary
  fs.writeFileSync('billfree_full_site_map.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalPagesCrawled: visited.size,
    pages: pageDetails
  }, null, 2));

  console.log(`\n=== CRAWL COMPLETE: ${visited.size} PAGES PROCESSED ===`);
  console.log('Saved to billfree_full_site_map.json');
}

main().catch(console.error);
