import fs from 'fs';

async function fetchSubtabs() {
  const cookieRes = await fetch('https://billfree.in/site/login');
  const getCookies = cookieRes.headers.get('set-cookie');
  const phpSess = getCookies.match(/PHPSESSID=([^;]+)/)?.[1] || '';
  const text = await cookieRes.text();
  const devToken = text.match(/name="dev_token" value="([^"]+)"/)?.[1] || '';
  const devInfo = text.match(/name="dev_info" value="([^"]+)"/)?.[1] || '';

  const params = new URLSearchParams();
  params.append('LoginForm[username]', '8857808284');
  params.append('LoginForm[password]', '8857808284');
  params.append('dev_token', devToken);
  params.append('dev_info', devInfo);

  const postRes = await fetch('https://billfree.in/site/login', {
    method: 'POST',
    headers: {
      'Cookie': 'PHPSESSID=' + phpSess,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString(),
    redirect: 'manual'
  });

  const postCookies = postRes.headers.get('set-cookie');
  const identity = postCookies?.match(/_identity-frontend=([^;]+)/)?.[1] || '';
  const sess = postCookies?.match(/PHPSESSID=([^;]+)/)?.[1] || phpSess;
  const cookieHeader = 'PHPSESSID=' + sess + '; _identity-frontend=' + identity;

  const urls = [
    'https://billfree.in/profiles/index',
    'https://billfree.in/customer-journey/overview?mobile=8857808284',
    'https://billfree.in/optout-customers/index',
    'https://billfree.in/segmentation/list',
    'https://billfree.in/loyalty-dashboard/points-transaction',
    'https://billfree.in/coupon-dashboard/index',
    'https://billfree.in/download-center/index',
    'https://billfree.in/roi-explorer/index'
  ];

  for (const url of urls) {
    const res = await fetch(url, { headers: { 'Cookie': cookieHeader } });
    const content = await res.text();
    const title = content.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || '';
    const fname = 'bf_' + url.split('/').slice(-2).join('_').replace(/[^a-zA-Z0-9_]/g, '_') + '.html';
    fs.writeFileSync(fname, content);
    console.log(`Fetched ${url} -> ${fname} (Title: "${title}", Size: ${content.length})`);
  }
}

fetchSubtabs().catch(console.error);
