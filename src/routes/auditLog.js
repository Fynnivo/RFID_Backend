const express = require('express');
const router = express.Router();
const AuditLogController = require('../controllers/auditLogController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Hanya admin bisa lihat log
router.get('/', auth, adminAuth, (req, res) => AuditLogController.prototype.getLogs(req, res));

module.exports = router;