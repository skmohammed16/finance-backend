const { body, query, param, validationResult } = require('express-validator');

// Collect validation errors and respond
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
};

// ── Auth validators ───────────────────────────────────────────────────────────
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── User validators ───────────────────────────────────────────────────────────
const updateUserRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['viewer', 'analyst', 'admin']).withMessage('Invalid role'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

// ── Record validators ─────────────────────────────────────────────────────────
const recordRules = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('date').isISO8601().toDate().withMessage('Date must be a valid ISO8601 date'),
  body('notes').optional().trim(),
];

const updateRecordRules = [
  body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('date').optional().isISO8601().toDate().withMessage('Date must be a valid ISO8601 date'),
  body('notes').optional().trim(),
];

const recordQueryRules = [
  query('type').optional().isIn(['income', 'expense']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  updateUserRules,
  recordRules,
  updateRecordRules,
  recordQueryRules,
};
