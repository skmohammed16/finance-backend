const User = require('../models/User');

const getAllUsers = (req, res, next) => {
  try {
    const { status } = req.query;
    const users = User.findAll({ status });
    res.json({ users, total: users.length });
  } catch (err) {
    next(err);
  }
};

const getUserById = (req, res, next) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

const updateUser = (req, res, next) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Non-admins can only update themselves and cannot change roles
    if (req.user.role !== 'admin') {
      if (req.user.id !== Number(req.params.id)) {
        return res.status(403).json({ error: 'You can only update your own profile' });
      }
      delete req.body.role;
      delete req.body.status;
    }

    const updated = User.update(req.params.id, req.body);
    res.json({ message: 'User updated', user: updated });
  } catch (err) {
    next(err);
  }
};

const deleteUser = (req, res, next) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (req.user.id === Number(req.params.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
