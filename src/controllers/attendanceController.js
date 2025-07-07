const prisma = require('../lib/prisma');
const notificationService = require('../services/notificationService');
const AuditLogController = require('./auditLogController');

class AttendanceController {
  // Scan absensi (input: userId/scheduleId/rfidCard)
  async scanAttendance(req, res) {
    try {
      const { userId, scheduleId, rfidCard } = req.body;

      // Validasi user & schedule
      const user = await prisma.user.findUnique({ where: { id: userId, rfidCard } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found or RFID tidak cocok' });

      const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
      if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });

      // Cek apakah sudah absen hari ini di schedule ini
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const already = await prisma.attendance.findFirst({
        where: {
          userId,
          scheduleId,
          scanTime: { gte: today }
        }
      });
      if (already) return res.status(400).json({ success: false, message: 'Sudah absen hari ini' });

      // Hitung status hadir/telat
      const now = new Date();
      const isLate = now > schedule.startTime;
      const status = isLate ? 'LATE' : 'PRESENT';

      const attendance = await prisma.attendance.create({
        data: {
          userId,
          scheduleId,
          scanTime: now,
          status,
          isLate
        }
      });

      await notificationService.sendToUser({
        userId,
        title: 'Absensi Berhasil',
        message: `Anda telah ${status === 'LATE' ? 'terlambat' : 'hadir'} pada jadwal ${schedule.className} (${schedule.subject})`,
        type: status === 'LATE' ? 'WARNING' : 'SUCCESS',
        priority: status === 'LATE' ? 'HIGH' : 'LOW'
      });

      await AuditLogController.log({
        userId,
        action: 'SCAN_ATTENDANCE',
        description: `User scan absensi pada schedule ${scheduleId} dengan status: ${status}`,
        ip: req.ip,
        scheduleId, 
        status
      })

      res.status(201).json({ success: true, attendance, status });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // List riwayat absensi per user
  async getUserAttendance(req, res) {
    const { userId } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { userId },
      include: { schedule: true },
      orderBy: { scanTime: 'desc' }
    });
    res.json({ success: true, attendance });
  }

  // List riwayat absensi per schedule
  async getScheduleAttendance(req, res) {
    const { scheduleId } = req.params;
    const attendance = await prisma.attendance.findMany({
      where: { scheduleId },
      include: { user: true },
      orderBy: { scanTime: 'desc' }
    });
    res.json({ success: true, attendance });
  }

  // Rekap absensi user (statistik sederhana)
  async getUserAttendanceRecap(req, res) {
    const { userId } = req.params;
    const present = await prisma.attendance.count({ where: { userId, status: 'PRESENT' } });
    const late = await prisma.attendance.count({ where: { userId, status: 'LATE' } });
    const absent = await prisma.attendance.count({ where: { userId, status: 'ABSENT' } });
    res.json({ success: true, recap: { present, late, absent } });
  }
}

module.exports = new AttendanceController();