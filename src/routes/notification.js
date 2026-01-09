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

// Tandai notifikasi sudah dibaca - perbaiki parameter route
router.put('/:id/read', auth, (req, res, next) => {
  // Validasi bahwa id adalah string yang valid
  if (!req.params.id || typeof req.params.id !== 'string') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid notification ID' 
    });
  }
  next();
}, notificationController.markAsRead);

module.exports = router;