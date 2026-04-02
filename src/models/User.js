const db = require('./db');

const User = {
  findAll({ status } = {}) {
    let sql = `SELECT id, name, email, role, status, created_at FROM users`;
    const params = [];
    if (status) {
      sql += ` WHERE status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    return db.prepare(sql).all(...params);
  },

  findById(id) {
    return db.prepare(
      `SELECT id, name, email, role, status, created_at FROM users WHERE id = ?`
    ).get(id);
  },

  findByEmail(email) {
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
  },

  create({ name, email, password, role = 'viewer' }) {
    const stmt = db.prepare(
      `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`
    );
    const result = stmt.run(name, email, password, role);
    return this.findById(result.lastInsertRowid);
  },

  update(id, fields) {
    const allowed = ['name', 'email', 'role', 'status'];
    const updates = [];
    const values = [];
    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    if (!updates.length) return this.findById(id);
    updates.push(`updated_at = datetime('now')`);
    values.push(id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id);
  },

  delete(id) {
    return db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
  },
};

module.exports = User;
