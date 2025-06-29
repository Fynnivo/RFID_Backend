const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(auth, adminAuth);

router.get('/attendance-stats', dashboardController.attendanceStats);
router.get('/attendance-chart', dashboardController.attendanceChart);

module.exports = router;