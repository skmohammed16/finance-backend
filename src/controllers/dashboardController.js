const Record = require('../models/Record');

const getSummary = (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = Record.getSummary({ startDate, endDate });
    res.json({ summary });
  } catch (err) {
    next(err);
  }
};

const getCategoryBreakdown = (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.query;
    const categories = Record.getCategoryTotals({ type, startDate, endDate });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
};

const getMonthlyTrends = (req, res, next) => {
  try {
    const { year } = req.query;
    const trends = Record.getMonthlyTrends({ year });
    res.json({ trends });
  } catch (err) {
    next(err);
  }
};

const getWeeklyTrends = (req, res, next) => {
  try {
    const trends = Record.getWeeklyTrends();
    res.json({ trends });
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const activity = Record.getRecentActivity(limit);
    res.json({ activity });
  } catch (err) {
    next(err);
  }
};

const getFullDashboard = (req, res, next) => {
  try {
    const summary  = Record.getSummary();
    const activity = Record.getRecentActivity(5);
    const monthly  = Record.getMonthlyTrends({ year: new Date().getFullYear() });
    const byCategory = Record.getCategoryTotals();

    res.json({ summary, recent_activity: activity, monthly_trends: monthly, category_breakdown: byCategory });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getWeeklyTrends,
  getRecentActivity,
  getFullDashboard,
};
