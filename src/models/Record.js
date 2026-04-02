const db = require('./db');

const Record = {
  findAll({ type, category, startDate, endDate, page = 1, limit = 20 } = {}) {
    const conditions = [`r.deleted_at IS NULL`];
    const params = [];

    if (type)      { conditions.push(`r.type = ?`);       params.push(type); }
    if (category)  { conditions.push(`r.category = ?`);   params.push(category); }
    if (startDate) { conditions.push(`r.date >= ?`);      params.push(startDate); }
    if (endDate)   { conditions.push(`r.date <= ?`);      params.push(endDate); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT r.*, u.name AS created_by_name
      FROM financial_records r
      JOIN users u ON u.id = r.created_by
      ${where}
      ORDER BY r.date DESC, r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) AS total FROM financial_records r ${where}
    `).get(...params);

    return { records: rows, total, page: Number(page), limit: Number(limit) };
  },

  findById(id) {
    return db.prepare(`
      SELECT r.*, u.name AS created_by_name
      FROM financial_records r
      JOIN users u ON u.id = r.created_by
      WHERE r.id = ? AND r.deleted_at IS NULL
    `).get(id);
  },

  create({ amount, type, category, date, notes, created_by }) {
    const result = db.prepare(`
      INSERT INTO financial_records (amount, type, category, date, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(amount, type, category, date, notes || null, created_by);
    return this.findById(result.lastInsertRowid);
  },

  update(id, { amount, type, category, date, notes }) {
    const allowed = { amount, type, category, date, notes };
    const updates = [];
    const values = [];
    for (const [key, val] of Object.entries(allowed)) {
      if (val !== undefined) {
        updates.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (!updates.length) return this.findById(id);
    updates.push(`updated_at = datetime('now')`);
    values.push(id);
    db.prepare(`
      UPDATE financial_records SET ${updates.join(', ')}
      WHERE id = ? AND deleted_at IS NULL
    `).run(...values);
    return this.findById(id);
  },

  softDelete(id) {
    return db.prepare(`
      UPDATE financial_records SET deleted_at = datetime('now') WHERE id = ?
    `).run(id);
  },

  // ── Summary / analytics ───────────────────────────────────────────────────

  getSummary({ startDate, endDate } = {}) {
    const conditions = [`deleted_at IS NULL`];
    const params = [];
    if (startDate) { conditions.push(`date >= ?`); params.push(startDate); }
    if (endDate)   { conditions.push(`date <= ?`); params.push(endDate); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const totals = db.prepare(`
      SELECT
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expenses,
        COUNT(*) AS total_records
      FROM financial_records ${where}
    `).get(...params);

    return {
      total_income:   totals.total_income   || 0,
      total_expenses: totals.total_expenses || 0,
      net_balance:    (totals.total_income || 0) - (totals.total_expenses || 0),
      total_records:  totals.total_records  || 0,
    };
  },

  getCategoryTotals({ type, startDate, endDate } = {}) {
    const conditions = [`deleted_at IS NULL`];
    const params = [];
    if (type)      { conditions.push(`type = ?`);   params.push(type); }
    if (startDate) { conditions.push(`date >= ?`);  params.push(startDate); }
    if (endDate)   { conditions.push(`date <= ?`);  params.push(endDate); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    return db.prepare(`
      SELECT category, type, SUM(amount) AS total, COUNT(*) AS count
      FROM financial_records ${where}
      GROUP BY category, type
      ORDER BY total DESC
    `).all(...params);
  },

  getMonthlyTrends({ year } = {}) {
    const conditions = [`deleted_at IS NULL`];
    const params = [];
    if (year) { conditions.push(`strftime('%Y', date) = ?`); params.push(String(year)); }
    const where = `WHERE ${conditions.join(' AND ')}`;

    return db.prepare(`
      SELECT
        strftime('%Y-%m', date) AS month,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses,
        SUM(CASE WHEN type='income'  THEN amount ELSE -amount END) AS net
      FROM financial_records ${where}
      GROUP BY month
      ORDER BY month ASC
    `).all(...params);
  },

  getRecentActivity(limit = 10) {
    return db.prepare(`
      SELECT r.*, u.name AS created_by_name
      FROM financial_records r
      JOIN users u ON u.id = r.created_by
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(limit);
  },

  getWeeklyTrends() {
    return db.prepare(`
      SELECT
        strftime('%Y-W%W', date) AS week,
        SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) AS income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses
      FROM financial_records
      WHERE deleted_at IS NULL
      GROUP BY week
      ORDER BY week DESC
      LIMIT 12
    `).all();
  },
};

module.exports = Record;
