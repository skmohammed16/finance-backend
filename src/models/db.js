const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/finance.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,
    role      TEXT    NOT NULL DEFAULT 'viewer' CHECK(role IN ('viewer','analyst','admin')),
    status    TEXT    NOT NULL DEFAULT 'active'  CHECK(status IN ('active','inactive')),
    created_at TEXT   NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT   NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS financial_records (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    amount      REAL    NOT NULL CHECK(amount > 0),
    type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
    category    TEXT    NOT NULL,
    date        TEXT    NOT NULL,
    notes       TEXT,
    created_by  INTEGER NOT NULL REFERENCES users(id),
    deleted_at  TEXT    DEFAULT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_records_type     ON financial_records(type);
  CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category);
  CREATE INDEX IF NOT EXISTS idx_records_date     ON financial_records(date);
  CREATE INDEX IF NOT EXISTS idx_records_deleted  ON financial_records(deleted_at);
`);

module.exports = db;
