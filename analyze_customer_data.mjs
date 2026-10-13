import fs from 'fs';

function extractPageInfo(filename, label) {
  if (!fs.existsSync(filename)) return;
  const html = fs.readFileSync(filename, 'utf8');
  console.log(`\n========================================`);
  console.log(`PAGE: ${label} (${filename})`);
  console.log(`========================================`);

  // Title
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim();
  console.log(`Title: ${title}`);

  // Sub-tabs / Pills
  const pills = [...html.matchAll(/<a[^>]*class="[^"]*nav-link[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  if (pills.length) console.log('Sub-tabs / Nav Links:', pills);

  // Filter dropdowns & Quick Insights
  const filters = [...html.matchAll(/<select[^>]*name="([^"]+)"[\s\S]*?<\/select>/gi)].map(m => {
    const name = m[1];
    const opts = [...m[0].matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/gi)].map(o => ({ val: o[1], label: o[2].trim() }));
    return { name, opts };
  });
  if (filters.length) console.log('Filters:', JSON.stringify(filters, null, 2));

  // Table Headers
  const ths = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (ths.length) console.log('Table Headers:', ths);

  // Cards / Insights
  const cards = [...html.matchAll(/<div[^>]*class="[^"]*(?:quick-insight|card-body|stat-box|insight-box|progress-bar)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)]
    .slice(0, 10)
    .map(m => m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(s => s.length > 5 && s.length < 200);
  if (cards.length) console.log('Insight/Card snippets:', cards.slice(0, 5));

  // Form Fields
  const formLabels = [...html.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(Boolean);
  if (formLabels.length) console.log('Form Labels:', formLabels);
}

extractPageInfo('billfree_customers.html', 'CUSTOMERS LIST (/profiles/customers)');
extractPageInfo('billfree_profile_create.html', 'CREATE PROFILE (/profiles/create)');
extractPageInfo('bf_profiles_index.html', 'PROFILES LIST (/profiles/index)');
extractPageInfo('bf_customer_journey_overview_mobile_8857808284.html', 'CUSTOMER JOURNEY (/customer-journey/overview)');
extractPageInfo('bf_optout_customers_index.html', 'OPTOUT CUSTOMERS (/optout-customers/index)');
extractPageInfo('bf_segmentation_list.html', 'SEGMENTATIONS (/segmentation/list)');
