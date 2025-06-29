const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Helpers = require('../utils/helpers');

class UsersController {
  async createUser(req, res) {
    try {
      const { username, fullName, email, rfidCard, password, role, isActive } = req.body;
      const exists = await prisma.user.findFirst({
        where: { OR: [{ username }, { email }, { rfidCard }] }
      });
      if (exists) return res.status(400).json({ success: false, message: 'Username, email, atau RFID sudah terdaftar' });

      const hashedPassword = await Helpers.hashPassword(password);
      const user = await prisma.user.create({
        data: { username, fullName, email, rfidCard, password: hashedPassword, role, isActive }
      });
      res.status(201).json({ success: true, user: { ...user, password: undefined } });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async getUsers(req, res) {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, fullName: true, email: true, rfidCard: true, role: true, isActive: true, createdAt: true, updatedAt: true }
    });
    res.json({ success: true, users });
  }

  async getUserById(req, res) {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, fullName: true, email: true, rfidCard: true, role: true, isActive: true, createdAt: true, updatedAt: true }
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  }

  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, fullName, email, rfidCard, password, role, isActive } = req.body;
      let data = { username, fullName, email, rfidCard, role, isActive };
      if (password) data.password = await Helpers.hashPassword(password);
      Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
      const user = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, username: true, fullName: true, email: true, rfidCard: true, role: true, isActive: true, createdAt: true, updatedAt: true }
      });
      res.json({ success: true, user });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  async deleteUser(req, res) {
    try {
      await prisma.user.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'User deleted' });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
}

module.exports = new UsersController();