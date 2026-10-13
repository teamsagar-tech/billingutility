const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');

exports.register = async (req, res) => {
  try {
    const { storeName, email, password } = req.body;

    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Generate unique API Token for the tenant
    const apiToken = 'sk_live_' + crypto.randomBytes(24).toString('hex');

    // Create Tenant
    const [tenantResult] = await db.query(
      'INSERT INTO tenants (store_name, api_token) VALUES (?, ?)',
      [storeName, apiToken]
    );
    const tenantId = tenantResult.insertId;

    // Create User
    const passwordHash = await bcrypt.hash(password, 10);
    const [userResult] = await db.query(
      'INSERT INTO users (tenant_id, email, password_hash) VALUES (?, ?, ?)',
      [tenantId, email, passwordHash]
    );

    res.status(201).json({ success: true, message: 'Store registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.query('SELECT id, tenant_id, password_hash FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [tenants] = await db.query('SELECT store_name, api_token FROM tenants WHERE id = ?', [req.user.tenantId]);
    if (tenants.length === 0) return res.status(404).json({ success: false, error: 'Tenant not found' });
    
    res.status(200).json({ success: true, data: tenants[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
