const prisma = require('../lib/prisma');

const STATUS = ['PRESENT', 'LATE', 'ABSENT', 'EXCUSED'];

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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 7 hari terakhir (harian)
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(new Date(d));
      }

      const daily = [];
      for (const day of days) {
        const nextDay = new Date(day);
        nextDay.setDate(day.getDate() + 1);
        const counts = await prisma.attendance.groupBy({
          by: ['status'],
          where: {
            scanTime: {
              gte: day,
              lt: nextDay
            }
          },
          _count: { _all: true }
        });
        const row = { label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) };
        STATUS.forEach(status => {
          row[status] = counts.find(c => c.status === status)?._count._all || 0;
        });
        daily.push(row);
      }

      // 4 minggu terakhir (mingguan)
      const weekly = [];
      for (let w = 3; w >= 0; w--) {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - (w * 7) + 1); // Monday
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);

        const counts = await prisma.attendance.groupBy({
          by: ['status'],
          where: {
            scanTime: {
              gte: start,
              lt: end
            }
          },
          _count: { _all: true }
        });
        const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        const row = { label };
        STATUS.forEach(status => {
          row[status] = counts.find(c => c.status === status)?._count._all || 0;
        });
        weekly.push(row);
      }

      // 12 bulan terakhir (bulanan)
      const monthly = [];
      for (let m = 11; m >= 0; m--) {
        const start = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const end = new Date(today.getFullYear(), today.getMonth() - m + 1, 1);

        const counts = await prisma.attendance.groupBy({
          by: ['status'],
          where: {
            scanTime: {
              gte: start,
              lt: end
            }
          },
          _count: { _all: true }
        });
        const label = start.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        const row = { label };
        STATUS.forEach(status => {
          row[status] = counts.find(c => c.status === status)?._count._all || 0;
        });
        monthly.push(row);
      }

      res.json({
        success: true,
        data: {
          daily,
          weekly,
          monthly
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new DashboardController();