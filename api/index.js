const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const serverless = require('serverless-http');

// Import routes
const authRoutes = require('../src/routes/auth');
const usersRoutes = require('../src/routes/users');
const scheduleRoutes = require('../src/routes/schedule');
const scheduleUserRoutes = require('../src/routes/scheduleUser');
const attendanceRoutes = require('../src/routes/attendance');
const auditLogRoutes = require('../src/routes/auditLog');
const dashboardRoutes = require('../src/routes/dashboard');
const notificationRoutes = require('../src/routes/notification');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Logging (simplified for serverless)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Rate limiting (more conservative for serverless)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Terlalu banyak permintaan dari IP ini, coba lagi nanti.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', globalLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/schedule-users', scheduleUserRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Attendance API is running',
    version: '1.0.0'
  });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack || err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});


module.exports.handler = serverless(app);