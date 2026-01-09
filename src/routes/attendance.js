const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth } = require('../middleware/auth');

// RFID Scan - No auth required (untuk device RFID)
router.post('/scan', attendanceController.scanAttendance);

// Get attendance by schedule (untuk komponen React)
router.get('/by-schedule/:scheduleId', auth, attendanceController.getAttendanceBySchedule);

// Update attendance
router.patch('/update/:id', auth, attendanceController.updateAttendance);

// Delete attendance
router.delete('/delete/:id', auth, attendanceController.deleteAttendance);

// Manual attendance entry (untuk admin)
router.post('/manual', auth, attendanceController.createManualAttendance);

// Get attendance by user
router.get('/user/:userId', auth, attendanceController.getAttendanceByUser);

// Get attendance summary/report
router.get('/summary', auth, attendanceController.getAttendanceSummary);

// Legacy routes mapping (untuk backward compatibility)
router.get('/schedule/:scheduleId', auth, attendanceController.getAttendanceBySchedule);
router.get('/schedule-details/:scheduleId', auth, attendanceController.getAttendanceBySchedule);

// Backward compatibility untuk parameter yang berbeda
router.patch('/update/:attendanceId', auth, (req, res) => {
  req.params.id = req.params.attendanceId;
  attendanceController.updateAttendance(req, res);
});

router.delete('/delete/:attendanceId', auth, (req, res) => {
  req.params.id = req.params.attendanceId;
  attendanceController.deleteAttendance(req, res);
});

// Legacy route untuk recap (redirect ke user attendance dengan stats)
router.get('/recap/:userId', auth, attendanceController.getAttendanceByUser);

// Legacy route untuk all attendance (redirect ke summary)
router.get('/all', auth, attendanceController.getAttendanceSummary);

router.get('/users/available', auth, attendanceController.getAvailableUsers);

// Route untuk fetch absensi terakhir berdasarkan scheduleId
router.get('/last/schedule/:scheduleId', auth, attendanceController.getLastAttendanceBySchedule);


module.exports = router;
