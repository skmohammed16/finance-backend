const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { authenticate, requireMinRole } = require('../middleware/auth');

// All dashboard endpoints require at least analyst role
router.use(authenticate, requireMinRole('analyst'));

router.get('/',            ctrl.getFullDashboard);
router.get('/summary',     ctrl.getSummary);
router.get('/categories',  ctrl.getCategoryBreakdown);
router.get('/trends/monthly', ctrl.getMonthlyTrends);
router.get('/trends/weekly',  ctrl.getWeeklyTrends);
router.get('/activity',    ctrl.getRecentActivity);

module.exports = router;
