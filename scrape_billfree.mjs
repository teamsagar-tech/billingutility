import fs from 'fs';

async function main() {
  console.log('--- Step 1: Login ---');
  const getRes = await fetch('https://billfree.in/site/login');
  const getCookies = getRes.headers.get('set-cookie');
  const phpSess = getCookies.match(/PHPSESSID=([^;]+)/)?.[1] || '';
  const text = await getRes.text();
  
  const devToken = text.match(/name="dev_token" value="([^"]+)"/)?.[1] || '';
  const devInfo = text.match(/name="dev_info" value="([^"]+)"/)?.[1] || '';

  const params = new URLSearchParams();
  params.append('LoginForm[username]', '8857808284');
  params.append('LoginForm[password]', '8857808284');
  params.append('LoginForm[fresh]', '');
  params.append('login-button', '');
  params.append('dev_token', devToken);
  params.append('dev_info', devInfo);

  const postRes = await fetch('https://billfree.in/site/login', {
    method: 'POST',
    headers: {
      'Cookie': 'PHPSESSID=' + phpSess,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    body: params.toString(),
    redirect: 'manual'
  });

  const postCookies = postRes.headers.get('set-cookie');
  const newSess = postCookies?.match(/PHPSESSID=([^;]+)/)?.[1] || phpSess;
  const identity = postCookies?.match(/_identity-frontend=([^;]+)/)?.[1] || '';
  const csrf = postCookies?.match(/_csrf=([^;]+)/)?.[1] || '';
  const awsAlb = postCookies?.match(/AWSALB=([^;]+)/)?.[1] || '';
  const awsAlbTg = postCookies?.match(/AWSALBTG=([^;]+)/)?.[1] || '';

  const sessionCookie = `PHPSESSID=${newSess}; _identity-frontend=${identity}; _csrf=${csrf}; AWSALB=${awsAlb}; AWSALBTG=${awsAlbTg}`;
  console.log('Session Cookie established!');

  const visited = new Set();
  const queue = [
    'https://billfree.in/dashboard-summary/index',
    'https://billfree.in/profiles/customers',
    'https://billfree.in/profiles/create?phone=7011496743',
    'https://billfree.in/home/index',
    'https://billfree.in/roi-explorer/index',
    'https://billfree.in/campaigns-hub/index'
  ];

  const results = {};

  while (queue.length > 0) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    console.log(`\nFetching [${visited.size}/${visited.size + queue.length}]: ${currentUrl}`);
    try {
      const res = await fetch(currentUrl, {
        headers: {
          'Cookie': sessionCookie,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });

      if (!res.ok) {
        console.log(`Failed with status: ${res.status}`);
        continue;
      }

      const html = await res.text();
      const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || '';
      console.log(`Title: "${title}" (Length: ${html.length})`);

      // Extract all links
      const linkMatches = [...html.matchAll(/href="([^"#][^"]*)"/g)].map(m => m[1]);
      const newLinks = [];
      for (let l of linkMatches) {
        if (l.startsWith('javascript:') || l.startsWith('mailto:') || l.startsWith('tel:') || l.endsWith('.css') || l.endsWith('.js') || l.endsWith('.png') || l.endsWith('.jpg') || l.endsWith('.svg')) continue;
        let full = l;
        if (l.startsWith('/')) {
          full = 'https://billfree.in' + l;
        } else if (!l.startsWith('http')) {
          full = 'https://billfree.in/' + l;
        }
        if (full.startsWith('https://billfree.in/') && !full.includes('/site/logout')) {
          newLinks.push(full);
          if (!visited.has(full) && !queue.includes(full)) {
            queue.push(full);
          }
        }
      }

      // Extract page details
      results[currentUrl] = {
        title,
        discoveredLinks: [...new Set(newLinks)],
        htmlSample: html.slice(0, 1000)
      };

      // If this is customers list or profile page, save full HTML to inspection file
      if (currentUrl.includes('/profiles/customers') || currentUrl.includes('/profiles/create')) {
        const fname = currentUrl.includes('customers') ? 'billfree_customers.html' : 'billfree_profile_create.html';
        fs.writeFileSync(fname, html);
        console.log(`Saved full HTML to ${fname}`);
      }

    } catch (err) {
      console.error(`Error fetching ${currentUrl}:`, err.message);
    }

    // Limit initial crawl to first 30 pages to prevent overloading
    if (visited.size >= 30) {
      console.log('Reached 30 pages limit, stopping crawl loop.');
      break;
    }
  }

  fs.writeFileSync('billfree_crawl_summary.json', JSON.stringify({
    totalVisited: visited.size,
    queueRemaining: queue.length,
    pages: results
  }, null, 2));

  console.log('\nCrawl finished! Wrote billfree_crawl_summary.json');
}

main().catch(console.error);
