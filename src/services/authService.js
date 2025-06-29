const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Helpers = require('../utils/helpers');

class AuthService {
  async register({ username, fullName, email, rfidCard, password, role }) {
    const hashedPassword = await Helpers.hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        rfidCard,
        password: hashedPassword,
        role,
      },
    });
    return user;
  }

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('User not found');
    const valid = await Helpers.comparePassword(password, user.password);
    if (!valid) throw new Error('Invalid password');
    if (!user.isActive) throw new Error('User is not active');
    return user;
  }
}

module.exports = new AuthService();