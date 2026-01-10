const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const scheduleRoutes = require('./routes/schedule');
const scheduleUserRoutes = require('./routes/scheduleUser');
const attendanceRoutes = require('./routes/attendance');
const auditLogRoutes = require('./routes/auditLog');
const dashboardRoutes = require('./routes/dashboard')

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['*'],
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging
app.use(morgan('dev', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.'
});
app.use(globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/schedule-users', scheduleUserRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

module.exports = app;
