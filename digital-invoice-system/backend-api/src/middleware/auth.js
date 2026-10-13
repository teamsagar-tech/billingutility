const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');

// Middleware for Admin Dashboard (JWT based)
exports.requireAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains userId, tenantId, and role
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};

// Middleware for SaaS SuperAdmin Platform Controls
exports.requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ success: false, error: 'Forbidden: SuperAdmin privileges required' });
  }
  next();
};

// Middleware for Print Agent (API Token based)
exports.requireApiToken = async (req, res, next) => {
  const apiToken = req.header('X-API-Token');

  if (!apiToken) {
    return res.status(401).json({ success: false, error: 'API Token required' });
  }

  try {
    const [rows] = await db.query('SELECT id FROM tenants WHERE api_token = ?', [apiToken]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid API Token' });
    }
    
    req.tenantId = rows[0].id;
    next();
  } catch (error) {
    console.error('API Token Auth Error:', error);
    res.status(500).json({ success: false, error: 'Server error during authentication' });
  }
};
