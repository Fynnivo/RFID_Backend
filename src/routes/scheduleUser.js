const express = require('express');
const router = express.Router();
const scheduleUserController = require('../controllers/scheduleUserController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Semua endpoint di-protect admin
router.use(auth, adminAuth);

// Assign user ke schedule
router.post('/', scheduleUserController.assignUserToSchedule);

// List user dalam satu schedule
router.get('/by-schedule/:scheduleId', scheduleUserController.getUsersBySchedule);

// List schedule yang diikuti user
router.get('/by-user/:userId', scheduleUserController.getSchedulesByUser);

// Unassign user dari schedule
router.delete('/:id', scheduleUserController.unassignUserFromSchedule);

module.exports = router;