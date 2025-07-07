const prisma = require('../lib/prisma');

class AuditLogController {
  static async log({ userId, action, description, ip, scheduleId, status }) {
    try {
      await prisma.auditLog.create({
        data: { userId, action, description, ip, scheduleId, status },
      });
    } catch (err) {
      console.error("Failed to write audit log:", err.message);
    }
  }

  async getLogs(req, res) {
    try {
      const logs = await prisma.auditLog.findMany({
        include: { user: { select: { username: true, role: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = AuditLogController;
