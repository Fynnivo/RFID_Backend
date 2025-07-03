const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth } = require('../middleware/auth');

// Scan absensi (bisa diakses user)
router.post('/scan', attendanceController.scanAttendance);

// List riwayat absensi per user
router.get('/user/:userId', auth, attendanceController.getUserAttendance);

// List riwayat absensi per schedule
router.get('/schedule/:scheduleId', auth, attendanceController.getScheduleAttendance);

// Rekap absensi user
router.get('/recap/:userId', auth, attendanceController.getUserAttendanceRecap);

module.exports = router;