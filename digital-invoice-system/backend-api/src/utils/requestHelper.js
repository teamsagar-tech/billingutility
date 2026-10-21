/**
 * Request Helper Utilities
 * Accurate Client IP Extraction & Device Telemetry Classification
 * Supports Cloudflare, Nginx Reverse Proxies (95.135.166.109), and Mobile WebViews
 */

/**
 * Extracts the real client IP address from Express request
 * @param {import('express').Request} req
 * @returns {string} Clean IPv4 or IPv6 address
 */
function getClientIp(req) {
  if (!req) return '127.0.0.1';

  // 1. Check standard reverse proxy headers
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // If multiple IPs are listed (client, proxy1, proxy2), take the first one (original client)
    const clientIp = forwarded.split(',')[0].trim();
    if (clientIp) return cleanIp(clientIp);
  }

  // 2. Check Cloudflare / Nginx specific headers
  if (req.headers['cf-connecting-ip']) {
    return cleanIp(req.headers['cf-connecting-ip']);
  }

  if (req.headers['x-real-ip']) {
    return cleanIp(req.headers['x-real-ip']);
  }

  // 3. Fallback to socket remote address or req.ip
  const raw = req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
  return cleanIp(raw);
}

/**
 * Strips IPv6-mapped IPv4 prefix (::ffff:)
 */
function cleanIp(ip) {
  if (typeof ip !== 'string') return '127.0.0.1';
  const trimmed = ip.trim();
  if (trimmed.startsWith('::ffff:')) {
    return trimmed.substring(7);
  }
  return trimmed;
}

/**
 * Analyzes User-Agent to extract device type, browser, and WhatsApp WebView status
 * @param {import('express').Request} req
 */
function extractClientInfo(req) {
  const ip = getClientIp(req);
  const userAgent = (req.headers && req.headers['user-agent']) || '';
  const uaLower = userAgent.toLowerCase();

  // Detect WhatsApp In-App Browser (common for bill links dispatched over WABA)
  const isWhatsApp = uaLower.includes('whatsapp') || uaLower.includes('fb_iab') || uaLower.includes('fban');

  // Detect Device Type
  let deviceType = 'desktop';
  if (/ipad|tablet|(android(?!.*mobile))/i.test(uaLower)) {
    deviceType = 'tablet';
  } else if (/iphone|ipod|android.*mobile|windows phone|blackberry|mobile/i.test(uaLower)) {
    deviceType = 'mobile';
  }

  // Detect Primary Browser Family
  let browser = 'Unknown';
  if (isWhatsApp) {
    browser = 'WhatsApp WebView';
  } else if (uaLower.includes('edg/')) {
    browser = 'Edge';
  } else if (uaLower.includes('chrome/') && !uaLower.includes('edg/')) {
    browser = 'Chrome';
  } else if (uaLower.includes('safari/') && !uaLower.includes('chrome/')) {
    browser = 'Safari';
  } else if (uaLower.includes('firefox/')) {
    browser = 'Firefox';
  }

  return {
    ip,
    userAgent: userAgent.slice(0, 500),
    deviceType,
    browser,
    isWhatsApp
  };
}

module.exports = {
  getClientIp,
  extractClientInfo
};
