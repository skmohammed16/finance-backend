const router = require('express').Router();
const ctrl = require('../controllers/recordController');
const { authenticate, requireMinRole, requireRole } = require('../middleware/auth');
const { recordRules, updateRecordRules, recordQueryRules, validate } = require('../middleware/validate');

router.use(authenticate);

// Viewer, analyst, admin can all read
router.get('/',    recordQueryRules, validate, ctrl.getAllRecords);
router.get('/:id', ctrl.getRecordById);

// Analyst and admin can create
router.post('/',    requireMinRole('analyst'), recordRules, validate, ctrl.createRecord);

// Analyst can update their own records; admin can update any
router.put('/:id',  requireMinRole('analyst'), updateRecordRules, validate, ctrl.updateRecord);

// Only admin can delete
router.delete('/:id', requireRole('admin'), ctrl.deleteRecord);

module.exports = router;
