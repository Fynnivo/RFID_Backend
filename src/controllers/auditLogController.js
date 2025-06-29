const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AuditLogController {
  // Catat log (bisa dipanggil dari service lain)
  static async log({ userId, action, description, ip, scheduleId, status }) {
    try {
      await prisma.auditLog.create({
        data: { userId, action, description, ip, scheduleId, status }
      });
    } catch (err) {
      // Optional: log error ke file jika gagal
      console.error('Failed to write audit log:', err.message);
    }
  }

  // Endpoint: list log untuk admin
  async getLogs(req, res) {
    try {
      const logs = await prisma.auditLog.findMany({
        include: { user: { select: { username: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100 // limit, bisa diubah
      });
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = AuditLogController;