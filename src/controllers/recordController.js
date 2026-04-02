const Record = require('../models/Record');

const getAllRecords = (req, res, next) => {
  try {
    const { type, category, startDate, endDate, page, limit } = req.query;
    const result = Record.findAll({ type, category, startDate, endDate, page, limit });
    res.json({
      ...result,
      totalPages: Math.ceil(result.total / result.limit),
    });
  } catch (err) {
    next(err);
  }
};

const getRecordById = (req, res, next) => {
  try {
    const record = Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    res.json({ record });
  } catch (err) {
    next(err);
  }
};

const createRecord = (req, res, next) => {
  try {
    const { amount, type, category, date, notes } = req.body;
    const record = Record.create({
      amount,
      type,
      category,
      date: typeof date === 'object' ? date.toISOString().split('T')[0] : date,
      notes,
      created_by: req.user.id,
    });
    res.status(201).json({ message: 'Record created', record });
  } catch (err) {
    next(err);
  }
};

const updateRecord = (req, res, next) => {
  try {
    const existing = Record.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    // Only admin or the creator can update
    if (req.user.role !== 'admin' && existing.created_by !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own records' });
    }

    const { amount, type, category, date, notes } = req.body;
    const record = Record.update(req.params.id, {
      amount,
      type,
      category,
      date: date instanceof Date ? date.toISOString().split('T')[0] : date,
      notes,
    });
    res.json({ message: 'Record updated', record });
  } catch (err) {
    next(err);
  }
};

const deleteRecord = (req, res, next) => {
  try {
    const existing = Record.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Record not found' });

    // Only admin can delete
    Record.softDelete(req.params.id);
    res.json({ message: 'Record deleted (soft delete)' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord };
