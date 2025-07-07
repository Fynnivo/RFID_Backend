const { PrismaClient } = require('@prisma/client');

// Singleton pattern for Prisma Client in serverless environment
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
} else {
  // In development, use a global variable to preserve the value
  // across module reloads caused by HMR (Hot Module Replacement)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;