const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'finance_secret_key_change_in_production';

// ── Attach user from JWT ──────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = User.findById(payload.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (user.status === 'inactive') return res.status(403).json({ error: 'Account is inactive' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ── Role hierarchy ────────────────────────────────────────────────────────────
const ROLE_LEVEL = { viewer: 1, analyst: 2, admin: 3 };

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

const requireMinRole = (minRole) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if ((ROLE_LEVEL[req.user.role] || 0) < (ROLE_LEVEL[minRole] || 0)) {
    return res.status(403).json({
      error: `Access denied. Minimum role required: ${minRole}`,
    });
  }
  next();
};

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });

module.exports = { authenticate, requireRole, requireMinRole, signToken };
