const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationController {
  async sendToRole(req, res) {
    try {
      const { title, message, type, priority, role } = req.body;
      if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

      const users = await prisma.user.findMany({ where: { role, isActive: true } });
      if (!users.length) return res.status(404).json({ success: false, message: 'No user found with that role' });

      const notifications = await Promise.all(
        users.map(user =>
          prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
              type,
              priority,
              isRead: false
            }
          })
        )
      );
      res.status(201).json({ success: true, notifications });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async sendToUser(req, res) {
    try {
      const { userId, title, message, type, priority } = req.body;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const notification = await prisma.notification.create({
        data: { userId, title, message, type, priority, isRead: false }
      });
      res.status(201).json({ success: true, notification });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getMyNotifications(req, res) {
    const userId = req.user.id;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, notifications });
  }

  async markAsRead(req, res) {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true, notification });
  }
}

module.exports = new NotificationController();