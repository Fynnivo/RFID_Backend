const Joi = require('joi');

const roleEnum = ['MAIN_TEAM', 'MEMBER', 'CADET', 'ADMIN'];

function validateUser(req, res, next) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    fullName: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    rfidCard: Joi.string().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(...roleEnum).required(),
    isActive: Joi.boolean(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
}

function validateUserUpdate(req, res, next) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    fullName: Joi.string().min(3).max(100),
    email: Joi.string().email(),
    rfidCard: Joi.string(),
    password: Joi.string().min(6),
    role: Joi.string().valid(...roleEnum),
    isActive: Joi.boolean(),
  });
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });
  next();
}

module.exports = {
  validateUser,
  validateUserUpdate,
};