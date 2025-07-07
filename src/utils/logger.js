const winston = require('winston');

// Simplified logger for serverless environment
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // In serverless, we primarily use console logging
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Only add file transports in non-serverless environments
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const path = require('path');
  
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error'
  }));
  
  logger.add(new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log')
  }));
}

module.exports = logger;