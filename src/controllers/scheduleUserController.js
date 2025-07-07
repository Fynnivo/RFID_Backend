const prisma = require('../lib/prisma');

class ScheduleUserController {
  // Assign user ke schedule
  async assignUserToSchedule(req, res) {
    try {
      const { userId, scheduleId } = req.body;
      // Cek apakah sudah pernah di-assign
      const exists = await prisma.scheduleUser.findFirst({
        where: { userId, scheduleId }
      });
      if (exists) {
        return res.status(400).json({ success: false, message: 'User sudah terdaftar di schedule ini' });
      }
      const scheduleUser = await prisma.scheduleUser.create({
        data: { userId, scheduleId }
      });
      res.status(201).json({ success: true, scheduleUser });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // List user dalam satu schedule
  async getUsersBySchedule(req, res) {
    const { scheduleId } = req.params;
    const users = await prisma.scheduleUser.findMany({
      where: { scheduleId },
      include: { user: true }
    });
    res.json({ success: true, users });
  }

  // List schedule yang diikuti user
  async getSchedulesByUser(req, res) {
    const { userId } = req.params;
    const schedules = await prisma.scheduleUser.findMany({
      where: { userId },
      include: { schedule: true }
    });
    res.json({ success: true, schedules });
  }

  // Unassign user dari schedule
  async unassignUserFromSchedule(req, res) {
    try {
      const { id } = req.params; // id dari ScheduleUser
      await prisma.scheduleUser.delete({ where: { id } });
      res.json({ success: true, message: 'User dihapus dari schedule' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ScheduleUserController();