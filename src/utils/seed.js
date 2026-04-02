const bcrypt = require('bcryptjs');
const db = require('../models/db');

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`DELETE FROM financial_records; DELETE FROM users;`);

  // Create users
  const users = [
    { name: 'Alice Admin',   email: 'admin@example.com',   password: 'admin123',   role: 'admin' },
    { name: 'Ana Analyst',   email: 'analyst@example.com', password: 'analyst123', role: 'analyst' },
    { name: 'Victor Viewer', email: 'viewer@example.com',  password: 'viewer123',  role: 'viewer' },
  ];

  const insertUser = db.prepare(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`
  );

  const userIds = {};
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const result = insertUser.run(u.name, u.email, hash, u.role);
    userIds[u.role] = result.lastInsertRowid;
    console.log(`  ✅ Created ${u.role}: ${u.email} / ${u.password}`);
  }

  // Create financial records
  const insertRecord = db.prepare(
    `INSERT INTO financial_records (amount, type, category, date, notes, created_by) VALUES (?, ?, ?, ?, ?, ?)`
  );

  const records = [
    [5000,  'income',  'Salary',       '2024-01-05', 'January salary',       userIds.admin],
    [1200,  'expense', 'Rent',         '2024-01-10', 'Monthly rent',         userIds.admin],
    [300,   'expense', 'Utilities',    '2024-01-12', 'Electric & water',     userIds.analyst],
    [800,   'income',  'Freelance',    '2024-01-18', 'Web design project',   userIds.analyst],
    [150,   'expense', 'Groceries',    '2024-01-20', 'Weekly groceries',     userIds.admin],
    [5000,  'income',  'Salary',       '2024-02-05', 'February salary',      userIds.admin],
    [1200,  'expense', 'Rent',         '2024-02-10', 'Monthly rent',         userIds.admin],
    [500,   'expense', 'Travel',       '2024-02-14', 'Valentine trip',       userIds.analyst],
    [1500,  'income',  'Bonus',        '2024-02-20', 'Q1 bonus',             userIds.admin],
    [200,   'expense', 'Dining',       '2024-02-25', 'Team dinner',          userIds.analyst],
    [5000,  'income',  'Salary',       '2024-03-05', 'March salary',         userIds.admin],
    [1200,  'expense', 'Rent',         '2024-03-10', 'Monthly rent',         userIds.admin],
    [900,   'income',  'Freelance',    '2024-03-15', 'App development',      userIds.analyst],
    [400,   'expense', 'Healthcare',   '2024-03-22', 'Medical checkup',      userIds.admin],
    [250,   'expense', 'Subscriptions','2024-03-30', 'Annual subscriptions', userIds.analyst],
  ];

  for (const r of records) {
    insertRecord.run(...r);
  }
  console.log(`  ✅ Created ${records.length} financial records`);
  console.log('\n🎉 Seeding complete!');
}

seed().catch(console.error);
