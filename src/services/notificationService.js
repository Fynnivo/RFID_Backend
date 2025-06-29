const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sendToUser({ userId, title, message, type = 'INFO', priority = 'LOW' }) {
  return prisma.notification.create({
    data: { userId, title, message, type, priority, isRead: false }
  });
}

module.exports = { sendToUser };