const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Kirim notifikasi ke semua user dengan role tertentu (hanya admin)
router.post('/role', auth, adminAuth, notificationController.sendToRole);

// Kirim notifikasi ke user tertentu (hanya admin)
router.post('/user', auth, adminAuth, notificationController.sendToUser);

// List notifikasi untuk user yang sedang login
router.get('/me', auth, notificationController.getMyNotifications);

// Tandai notifikasi sudah dibaca
router.put('/:id/read', auth, notificationController.markAsRead);

module.exports = router;