const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const { validateUser, validateUserUpdate } = require('../middleware/validation');

// Semua endpoint di-protect admin
router.use(auth, adminAuth);

router.post('/', validateUser, usersController.createUser);
router.get('/', usersController.getUsers);
router.get('/:id', usersController.getUserById);
router.put('/:id', validateUserUpdate, usersController.updateUser);
router.delete('/:id', usersController.deleteUser);

module.exports = router;