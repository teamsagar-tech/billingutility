const express = require('express');
const cors = require('cors');
require('dotenv').config();

const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const setupDatabase = require('./config/setupDb');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Database
setupDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/store', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Print Interceptor API' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  logger.info(`🚀 Backend API running on http://localhost:${PORT}`);
});
