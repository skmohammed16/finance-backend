const router = require('express').Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');
const { updateUserRules, validate } = require('../middleware/validate');

// All user routes require authentication
router.use(authenticate);

// Admin only: list all users
router.get('/',    requireRole('admin'), getAllUsers);

// Any authenticated user can view a specific user profile
router.get('/:id', getUserById);

// Update: admins can update anyone, others can update only themselves (role/status stripped in controller)
router.put('/:id', updateUserRules, validate, updateUser);

// Admin only: delete user
router.delete('/:id', requireRole('admin'), deleteUser);

module.exports = router;
