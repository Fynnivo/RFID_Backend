const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class DashboardController {
  // Statistik kehadiran harian/mingguan/bulanan
  async attendanceStats(req, res) {
    try {
      // Total user aktif
      const totalUsers = await prisma.user.count({ where: { isActive: true } });

      // Total absensi hari ini
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const totalAttendanceToday = await prisma.attendance.count({
        where: { scanTime: { gte: today } }
      });

      // Statistik mingguan (7 hari terakhir)
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 6);
      weekAgo.setHours(0, 0, 0, 0);
      const attendanceWeekly = await prisma.attendance.groupBy({
        by: ['status'],
        where: { scanTime: { gte: weekAgo } },
        _count: { _all: true }
      });

      // Statistik bulanan (30 hari terakhir)
      const monthAgo = new Date();
      monthAgo.setDate(today.getDate() - 29);
      monthAgo.setHours(0, 0, 0, 0);
      const attendanceMonthly = await prisma.attendance.groupBy({
        by: ['status'],
        where: { scanTime: { gte: monthAgo } },
        _count: { _all: true }
      });

      // User aktif per hari (7 hari terakhir)
      const activeUsersPerDay = await prisma.attendance.groupBy({
        by: ['scanTime'],
        where: { scanTime: { gte: weekAgo } },
        _count: { userId: true }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          totalAttendanceToday,
          attendanceWeekly,
          attendanceMonthly,
          activeUsersPerDay
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // Grafik absensi per status (untuk chart)
  async attendanceChart(req, res) {
    try {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 29);
      monthAgo.setHours(0, 0, 0, 0);

      const chart = await prisma.attendance.groupBy({
        by: ['status'],
        where: { scanTime: { gte: monthAgo } },
        _count: { _all: true }
      });

      res.json({ success: true, chart });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new DashboardController();