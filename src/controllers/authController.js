const authService = require('../services/authService');
const Helpers = require('../utils/helpers');
const tokenBlacklist = require('../utils/tokenBlacklist');
const AudirLogController = require('./auditLogController');

class AuthController {
  async register(req, res) {
    try {
      const { username, fullName, email, rfidCard, password, role } = req.body;
      const user = await authService.register({ username, fullName, email, rfidCard, password, role });
      res.status(201).json({ success: true, user: { ...user, password: undefined } });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.login({ email, password });
      const token = Helpers.generateToken({
      id: user.id,
      role: user.role,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        username: user.username,
        rfidCard: user.rfidCard,
        isActive: user.isActive,
      }
    });
      if (tokenBlacklist.has(token)) {
        throw new Error('Token is blacklisted, please login again');
      }
      
      await AudirLogController.log({
        userId: user.id,
        action: 'LOGIN',
        description: `User ${user.username} logged in`,
        ip: req.ip
      });

      res.json({ success: true, token, user: { ...user, password: undefined } });
    } catch (err) {
      res.status(401).json({ success: false, message: err.message });
    }
  }

  async logout(req, res) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      tokenBlacklist.add(token);
    }
    res.json({ success: true, message: 'Logout successful' });
  }
}

module.exports = new AuthController();