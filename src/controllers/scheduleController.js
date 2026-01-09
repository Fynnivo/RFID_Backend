const prisma = require('../lib/prisma');

// Validasi format ISO 8601 date string
function isValidISODate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
}

// Validasi format date string (YYYY-MM-DD)
function isValidDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

class ScheduleController {
  async createSchedule(req, res) {
    try {
      const { className, subject, instructor, room, scheduleDate, startTime, endTime, isActive } = req.body;

      console.log('Received create data:', req.body);

      // Validasi input required
      if (!className || !subject || !instructor || !room) {
        return res.status(400).json({
          success: false,
          message: 'className, subject, instructor, and room are required'
        });
      }

      // Validasi scheduleDate
      if (!scheduleDate || !isValidDate(scheduleDate)) {
        return res.status(400).json({
          success: false,
          message: 'scheduleDate must be a valid date (YYYY-MM-DD or ISO format)'
        });
      }

      // Validasi time format
      if (!isValidISODate(startTime) || !isValidISODate(endTime)) {
        return res.status(400).json({
          success: false,
          message: 'startTime and endTime must be valid ISO date strings'
        });
      }

      // Validasi waktu mulai < waktu selesai
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (end <= start) {
        return res.status(400).json({
          success: false,
          message: 'endTime must be after startTime'
        });
      }

      // Parse scheduleDate to ensure it's a valid Date object
      const parsedScheduleDate = new Date(scheduleDate);
      
      // Validasi scheduleDate tidak di masa lalu (optional, comment out if not needed)
      // const today = new Date();
      // today.setHours(0, 0, 0, 0);
      // if (parsedScheduleDate < today) {
      //   return res.status(400).json({
      //     success: false,
      //     message: 'scheduleDate cannot be in the past'
      //   });
      // }

      const schedule = await prisma.schedule.create({
        data: {
          className: className.trim(),
          subject: subject.trim(),
          instructor: instructor.trim(),
          room: room.trim(),
          scheduleDate: parsedScheduleDate,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          isActive: isActive !== undefined ? Boolean(isActive) : true
        }
      });

      console.log('Created schedule:', schedule);

      res.status(201).json({ 
        success: true, 
        schedule 
      });
    } catch (err) {
      console.error('Create schedule error:', err);
      res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
  }

  async getSchedules(req, res) {
    try {
      const { startDate, endDate, upcoming } = req.query;
      
      let whereClause = {};

      // Filter by date range if provided
      if (startDate && endDate) {
        whereClause.scheduleDate = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      } else if (upcoming === 'true') {
        // Get only upcoming schedules (today and future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        whereClause.scheduleDate = {
          gte: today
        };
      }

      const schedules = await prisma.schedule.findMany({
        where: whereClause,
        orderBy: [
          { scheduleDate: 'asc' },
          { startTime: 'asc' }
        ]
      });
      
      res.json({ success: true, schedules });
    } catch (err) {
      console.error('Get schedules error:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  }

  async getScheduleById(req, res) {
    try {
      const schedule = await prisma.schedule.findUnique({
        where: { id: req.params.id }
      });
      
      if (!schedule) {
        return res.status(404).json({ 
          success: false, 
          message: 'Schedule not found' 
        });
      }
      
      res.json({ success: true, schedule });
    } catch (err) {
      console.error('Get schedule error:', err);
      res.status(500).json({ 
        success: false, 
        message: err.message 
      });
    }
  }

  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { className, subject, instructor, room, scheduleDate, startTime, endTime, isActive } = req.body;

      console.log('Received update data:', req.body);

      // Cek apakah schedule exists
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      // Siapkan data update
      const data = {};

      if (className !== undefined) data.className = className.trim();
      if (subject !== undefined) data.subject = subject.trim();
      if (instructor !== undefined) data.instructor = instructor.trim();
      if (room !== undefined) data.room = room.trim();
      
      // Validasi dan konversi scheduleDate
      if (scheduleDate !== undefined) {
        if (!isValidDate(scheduleDate)) {
          return res.status(400).json({
            success: false,
            message: 'scheduleDate must be a valid date'
          });
        }
        data.scheduleDate = new Date(scheduleDate);
      }

      // Validasi dan konversi waktu
      if (startTime !== undefined) {
        if (!isValidISODate(startTime)) {
          return res.status(400).json({
            success: false,
            message: 'startTime must be a valid ISO date string'
          });
        }
        data.startTime = new Date(startTime).toISOString();
      }

      if (endTime !== undefined) {
        if (!isValidISODate(endTime)) {
          return res.status(400).json({
            success: false,
            message: 'endTime must be a valid ISO date string'
          });
        }
        data.endTime = new Date(endTime).toISOString();
      }

      // Validasi waktu mulai < waktu selesai
      const finalStartTime = data.startTime ? new Date(data.startTime) : new Date(existingSchedule.startTime);
      const finalEndTime = data.endTime ? new Date(data.endTime) : new Date(existingSchedule.endTime);
      
      if (finalEndTime <= finalStartTime) {
        return res.status(400).json({
          success: false,
          message: 'endTime must be after startTime'
        });
      }

      if (isActive !== undefined) {
        data.isActive = Boolean(isActive);
      }

      console.log('Data to update:', data);

      const schedule = await prisma.schedule.update({
        where: { id },
        data
      });

      console.log('Updated schedule:', schedule);

      res.json({
        success: true,
        schedule
      });
    } catch (err) {
      console.error('Schedule update error:', err);
      res.status(400).json({
        success: false,
        message: err.message
      });
    }
  }

  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;

      // Cek apakah schedule exists
      const existingSchedule = await prisma.schedule.findUnique({
        where: { id }
      });

      if (!existingSchedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found'
        });
      }

      await prisma.schedule.delete({ 
        where: { id } 
      });

      res.json({ 
        success: true, 
        message: 'Schedule deleted successfully' 
      });
    } catch (err) {
      console.error('Delete schedule error:', err);
      res.status(400).json({ 
        success: false, 
        message: err.message 
      });
    }
  }
}

module.exports = new ScheduleController();