const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const productRoutes = require('./routes/productRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const setupDatabase = require('./config/setupDb');
const logger = require('./utils/logger');
const { initCronScheduler } = require('./services/cronScheduler');

const app = express();
const PORT = process.env.PORT || 4000;

// Reverse Proxy Trust for Accurate IP Address Resolution behind Nginx/Cloudflare
app.set('trust proxy', true);

// Initialize Database & Background Cron Scheduler
setupDatabase();
initCronScheduler();

// Middleware
app.use(cors());
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
const { updateMessageStatus } = require('./controllers/webhookController');
app.use(['/webhook', '/api/v1/webhook', '/api/v1/waba/webhook'], webhookRoutes);
app.post(['/status-update', '/api/v1/waba/status-update', '/api/v1/webhook/status-update'], updateMessageStatus);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/store', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/audit', telemetryRoutes);
app.use('/api/v1', authRoutes);

// Health Check
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Digital Invoice & Billing Messaging API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 Backend API running on http://localhost:${PORT}`);
});
