const prisma = require('../lib/prisma');

class ScheduleController {
  async createSchedule(req, res) {
    try {
      const { className, subject, instructor, room, startTime, endTime, dayOfWeek, isActive } = req.body;
      const schedule = await prisma.schedule.create({
        data: { className, subject, instructor, room, startTime, endTime, dayOfWeek, isActive }
      });
      res.status(201).json({ success: true, schedule });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getSchedules(req, res) {
    const schedules = await prisma.schedule.findMany({
      orderBy: { startTime: 'asc' }
    });
    res.json({ success: true, schedules });
  }

  async getScheduleById(req, res) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: req.params.id }
    });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    res.json({ success: true, schedule });
  }

  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { className, subject, instructor, room, startTime, endTime, dayOfWeek, isActive } = req.body;
      let data = { className, subject, instructor, room, startTime, endTime, dayOfWeek, isActive };
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      const schedule = await prisma.schedule.update({
        where: { id },
        data
      });
      res.json({ success: true, schedule });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteSchedule(req, res) {
    try {
      await prisma.schedule.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Schedule deleted' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new ScheduleController();