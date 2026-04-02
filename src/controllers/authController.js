const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = User.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = User.create({ name, email, password: hashed, role });
    const token = signToken(user);

    res.status(201).json({ message: 'User registered successfully', user, token });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = User.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Account is inactive' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(user);
    const { password: _, ...safeUser } = user;

    res.json({ message: 'Login successful', user: safeUser, token });
  } catch (err) {
    next(err);
  }
};

const getMe = (req, res) => {
  res.json({ user: req.user });
};

module.exports = { register, login, getMe };
