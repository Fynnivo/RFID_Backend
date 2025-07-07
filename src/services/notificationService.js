const prisma = require('../lib/prisma');

async function sendToUser({ userId, title, message, type = 'INFO', priority = 'LOW' }) {
  return prisma.notification.create({
    data: { userId, title, message, type, priority, isRead: false }
  });
}

module.exports = { sendToUser };