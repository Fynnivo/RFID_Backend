const prisma = require("../lib/prisma");
const notificationService = require("../services/notificationService");
const AuditLogController = require("./auditLogController");

class AttendanceController {
  // Scan absensi (input: userId/scheduleId/rfidCard)
  async scanAttendance(req, res) {
    try {
      const { rfidCard } = req.body;

      if (!rfidCard) {
        return res.status(400).json({
          success: false,
          message: "RFID card number is required",
        });
      }

      // 1. Find user by RFID (field: rfidCard)
      const user = await prisma.user.findFirst({
        where: { rfidCard: rfidCard.toString() },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found with this RFID card",
        });
      }

      // 2. Find active schedule for user from scheduleUser for TODAY
      const today = new Date();
      const todayStart = new Date(today.setHours(0, 0, 0, 0));
      const todayEnd = new Date(today.setHours(23, 59, 59, 999));

      const userScheduleAssignments = await prisma.scheduleUser.findMany({
        where: {
          userId: user.id,
          schedule: {
            isActive: true,
            scheduleDate: {
              gte: todayStart,
              lte: todayEnd
            }
          }
        },
        include: {
          schedule: true
        }
      });

      if (userScheduleAssignments.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User doesn't have any active schedule assignments for today",
        });
      }

      // 3. Check for existing attendance today
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: user.id,
          scheduleId: userScheduleAssignments[0].scheduleId,
          scanTime: {
            gte: todayStart,
            lte: todayEnd
          }
        }
      });

      if (existingAttendance) {
        return res.status(400).json({
          success: false,
          message: "User has already scanned attendance today",
          data: existingAttendance
        });
      }

      // 4. Check if late
      const now = new Date();
      const scheduleStartTime = new Date(userScheduleAssignments[0].schedule.startTime);
      
      // Extract time from schedule (HH:MM) and combine with today's date
      const scheduleTimeMatch = userScheduleAssignments[0].schedule.startTime.match(/T(\d{2}):(\d{2})/);
      if (scheduleTimeMatch) {
        const [_, hours, minutes] = scheduleTimeMatch;
        const todayScheduleTime = new Date();
        todayScheduleTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const isLate = now > todayScheduleTime;
        const status = isLate ? "LATE" : "PRESENT";

        // 5. CREATE attendance record
        const attendance = await prisma.attendance.create({
          data: {
            userId: user.id,
            scheduleId: userScheduleAssignments[0].scheduleId,
            scanTime: now,
            status: status,
            isLate: isLate
          },
          include: {
            user: {
              select: { id: true, username: true, email: true }
            },
            schedule: {
              select: { id: true, className: true, subject: true, instructor: true }
            }
          }
        });

        return res.status(201).json({
          success: true,
          message: `Attendance recorded successfully with status ${status}`,
          data: attendance,
          status
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Invalid schedule time format"
        });
      }

    } catch (error) {
      console.error("Attendance scan error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get attendance by schedule
  async getAttendanceBySchedule(req, res) {
    try {
      const { scheduleId } = req.params;
      const { date } = req.query;

      let dateFilter = {};
      if (date) {
        // Pastikan date adalah string yang valid
        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid date format. Use YYYY-MM-DD",
          });
        }

        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        dateFilter = {
          scanTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }

      // 1. Get all users assigned to this schedule from scheduleUser
      const assignedUsers = await prisma.scheduleUser.findMany({
        where: { scheduleId: scheduleId },
        include: {
          user: {
            select: { id: true, username: true, email: true, rfidCard: true }
          }
        }
      });

      // 2. Get attendance records
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          scheduleId: scheduleId,
          ...dateFilter
        },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { scanTime: 'desc' }
      });

      // 3. Combine data
      const attendanceData = assignedUsers.map(assignment => {
        const attendance = attendanceRecords.find(att => att.userId === assignment.user.id);

        return {
          userId: assignment.user.id,
          userName: assignment.user.username,
          userEmail: assignment.user.email,
          rfidCard: assignment.user.rfidCard,
          assignedAt: assignment.createdAt,
          attendance: attendance ? {
            id: attendance.id,
            scanTime: attendance.scanTime,
            status: attendance.status,
            isLate: attendance.isLate,
            notes: attendance.notes
          } : null,
          hasScanned: !!attendance
        };
      });

      const stats = {
        totalAssigned: assignedUsers.length,
        totalScanned: attendanceRecords.length,
        totalNotScanned: assignedUsers.length - attendanceRecords.length,
        totalPresent: attendanceRecords.filter(att => att.status === 'PRESENT').length,
        totalLate: attendanceRecords.filter(att => att.status === 'LATE').length
      };

      // 4. Get schedule details
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: {
          id: true,
          className: true,
          subject: true,
          instructor: true,
          room: true,
          scheduleDate: true,
          startTime: true,
          endTime: true,
          isActive: true
        }
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found"
        });
      }

      res.json({
        success: true,
        data: {
          schedule,
          attendance: attendanceData,
          stats,
          selectedDate: date || new Date().toISOString().split('T')[0]
        }
      });

    } catch (error) {
      console.error("Error getting attendance by schedule:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Update attendance
  async updateAttendance(req, res) {
    try {
      const { id } = req.params;
      const { status, notes, isLate } = req.body;

      // Validate attendance exists
      const existingAttendance = await prisma.attendance.findUnique({
        where: { id: id }
      });

      if (!existingAttendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found"
        });
      }

      // Update data
      const updatedAttendance = await prisma.attendance.update({
        where: { id: id },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes }),
          ...(isLate !== undefined && { isLate })
        },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          },
          schedule: {
            select: { id: true, className: true, subject: true, instructor: true }
          }
        }
      });

      res.json({
        success: true,
        message: "Attendance updated successfully",
        data: updatedAttendance
      });

    } catch (error) {
      console.error("Error updating attendance:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Delete attendance
  async deleteAttendance(req, res) {
    try {
      const { id } = req.params;

      // Validate attendance exists
      const existingAttendance = await prisma.attendance.findUnique({
        where: { id: id }
      });

      if (!existingAttendance) {
        return res.status(404).json({
          success: false,
          message: "Attendance record not found"
        });
      }

      // Delete
      await prisma.attendance.delete({
        where: { id: id }
      });

      res.json({
        success: true,
        message: "Attendance deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting attendance:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Get attendance by user
  async getAttendanceByUser(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate, scheduleId } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          scanTime: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        };
      }

      let scheduleFilter = {};
      if (scheduleId) {
        scheduleFilter = {
          scheduleId: scheduleId
        };
      }

      const attendances = await prisma.attendance.findMany({
        where: {
          userId: userId,
          ...dateFilter,
          ...scheduleFilter
        },
        include: {
          schedule: {
            select: {
              id: true,
              className: true,
              subject: true,
              instructor: true,
              scheduleDate: true,
              startTime: true,
              endTime: true
            }
          }
        },
        orderBy: { scanTime: 'desc' }
      });

      // Get user info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true, rfidCard: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Statistics
      const stats = {
        totalAttendance: attendances.length,
        totalPresent: attendances.filter(att => att.status === 'PRESENT').length,
        totalLate: attendances.filter(att => att.status === 'LATE').length,
        attendanceRate: attendances.length > 0 ?
          ((attendances.filter(att => att.status === 'PRESENT' || att.status === 'LATE').length / attendances.length) * 100).toFixed(2) + '%' : '0%'
      };

      res.json({
        success: true,
        data: {
          user,
          attendances,
          stats
        }
      });

    } catch (error) {
      console.error("Error getting user attendance:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Get attendance summary/report
  async getAttendanceSummary(req, res) {
    try {
      const { startDate, endDate, scheduleId } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          scanTime: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        };
      }

      let scheduleFilter = {};
      if (scheduleId) {
        scheduleFilter = {
          scheduleId: scheduleId
        };
      }

      // Get all attendances in period
      const attendances = await prisma.attendance.findMany({
        where: {
          ...dateFilter,
          ...scheduleFilter
        },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          },
          schedule: {
            select: {
              id: true,
              className: true,
              subject: true,
              instructor: true
            }
          }
        }
      });

      // Group by date
      const attendanceByDate = attendances.reduce((acc, attendance) => {
        const date = attendance.scanTime.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            total: 0,
            present: 0,
            late: 0,
            attendances: []
          };
        }
        acc[date].total++;
        if (attendance.status === 'PRESENT') acc[date].present++;
        if (attendance.status === 'LATE') acc[date].late++;
        acc[date].attendances.push(attendance);
        return acc;
      }, {});

      // Overall stats
      const stats = {
        totalRecords: attendances.length,
        totalPresent: attendances.filter(att => att.status === 'PRESENT').length,
        totalLate: attendances.filter(att => att.status === 'LATE').length,
        uniqueUsers: [...new Set(attendances.map(att => att.userId))].length,
        uniqueSchedules: [...new Set(attendances.map(att => att.scheduleId))].length
      };

      res.json({
        success: true,
        data: {
          summary: Object.values(attendanceByDate).sort((a, b) => new Date(b.date) - new Date(a.date)),
          stats,
          filters: {
            startDate,
            endDate,
            scheduleId
          }
        }
      });

    } catch (error) {
      console.error("Error getting attendance summary:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Manual attendance entry (for admin)
  async createManualAttendance(req, res) {
    try {
      const { userId, scheduleId, status, notes, scanTime } = req.body;

      // Validate required fields
      if (!userId || !scheduleId || !status) {
        return res.status(400).json({
          success: false,
          message: "userId, scheduleId, and status are required"
        });
      }

      // Validate user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Validate schedule exists
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId }
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found"
        });
      }

      // Check if attendance already exists for this user/schedule/date
      const attendanceDate = scanTime ? new Date(scanTime) : new Date();
      const startOfDay = new Date(attendanceDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(attendanceDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          userId: userId,
          scheduleId: scheduleId,
          scanTime: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      });

      if (existingAttendance) {
        return res.status(400).json({
          success: false,
          message: "Attendance already exists for this user on this date"
        });
      }

      // Create attendance
      const finalScanTime = scanTime ? new Date(scanTime) : new Date();
      const isLate = status === 'LATE';

      const attendance = await prisma.attendance.create({
        data: {
          userId: userId,
          scheduleId: scheduleId,
          scanTime: finalScanTime,
          status,
          isLate: isLate,
          notes: notes || null
        },
        include: {
          user: {
            select: { id: true, username: true, email: true }
          },
          schedule: {
            select: { id: true, className: true, subject: true, instructor: true }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: "Manual attendance created successfully",
        data: attendance
      });

    } catch (error) {
      console.error("Error creating manual attendance:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }

  // Get available users for assignment with search
  async getAvailableUsers(req, res) {
    try {
      const { scheduleId, search = '' } = req.query;

      // Get already assigned users
      const assignedUsers = await prisma.scheduleUser.findMany({
        where: { scheduleId },
        select: { userId: true }
      });

      const assignedUserIds = assignedUsers.map(u => u.userId);

      // Find available users matching search
      const users = await prisma.user.findMany({
        where: {
          NOT: { id: { in: assignedUserIds } },
          OR: [
            { username: { contains: search } },
            { email: { contains: search } },
            { rfidCard: { contains: search } }
          ]
        },
        select: {
          id: true,
          username: true,
          email: true,
          rfidCard: true
        }
      });

      res.json({ success: true, users });
    } catch (error) {
      console.error("Error fetching available users:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching users",
        error: error.message
      });
    }
  }

  async getLastAttendanceBySchedule(req, res) {
    try {
      const { scheduleId } = req.params;

      // Validasi apakah schedule ada
      const schedule = await prisma.schedule.findUnique({
        where: { id: scheduleId },
        select: { 
          id: true, 
          className: true, 
          subject: true,
          scheduleDate: true
        }
      });

      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: "Schedule not found"
        });
      }

      // Ambil 5 absensi terakhir untuk schedule ini
      const lastAttendances = await prisma.attendance.findMany({
        where: { scheduleId },
        orderBy: { scanTime: 'desc' },
        take: 5,
        include: {
          user: {
            select: { id: true, username: true, email: true }
          }
        }
      });

      // Jika tidak ada data, return empty array (bukan error)
      if (lastAttendances.length === 0) {
        return res.json({
          success: true,
          data: {
            schedule,
            lastAttendances: []
          }
        });
      }

      res.json({
        success: true,
        data: {
          schedule,
          lastAttendances
        }
      });
    } catch (error) {
      console.error("Error fetching last attendance by schedule:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message
      });
    }
  }
}

module.exports = new AttendanceController();
