const request = require('supertest');
const app = require('../src/app');
const db  = require('../src/models/db');
const bcrypt = require('bcryptjs');

// ── Helpers ───────────────────────────────────────────────────────────────────
const createUser = async (role = 'viewer') => {
  const hash = await bcrypt.hash('password123', 10);
  const result = db.prepare(
    `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`
  ).run(`Test ${role}`, `${role}_${Date.now()}@test.com`, hash, role);
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(result.lastInsertRowid);
};

const loginUser = async (email, password = 'password123') => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
};

// ── Auth tests ────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User', email: `test_${Date.now()}@example.com`, password: 'pass1234',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('viewer');
  });

  it('rejects duplicate email', async () => {
    const email = `dup_${Date.now()}@example.com`;
    await request(app).post('/api/auth/register').send({ name: 'A', email, password: '123456' });
    const res = await request(app).post('/api/auth/register').send({ name: 'B', email, password: '123456' });
    expect(res.status).toBe(409);
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'X', email: 'notanemail', password: '123456' });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  it('returns token on valid credentials', async () => {
    const user = await createUser('viewer');
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password', async () => {
    const user = await createUser('viewer');
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});

// ── Records tests ─────────────────────────────────────────────────────────────
describe('Financial Records', () => {
  let adminToken, analystToken, viewerToken, adminUser;

  beforeAll(async () => {
    adminUser   = await createUser('admin');
    const analyst = await createUser('analyst');
    const viewer  = await createUser('viewer');
    adminToken   = await loginUser(adminUser.email);
    analystToken = await loginUser(analyst.email);
    viewerToken  = await loginUser(viewer.email);
  });

  const newRecord = {
    amount: 500, type: 'income', category: 'Freelance',
    date: '2024-06-01', notes: 'Test record',
  };

  it('viewer can GET /api/records', async () => {
    const res = await request(app).get('/api/records').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.records).toBeDefined();
  });

  it('viewer CANNOT POST /api/records', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${viewerToken}`).send(newRecord);
    expect(res.status).toBe(403);
  });

  it('analyst CAN POST /api/records', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send(newRecord);
    expect(res.status).toBe(201);
    expect(res.body.record.amount).toBe(500);
  });

  it('rejects record with invalid amount', async () => {
    const res = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`)
      .send({ ...newRecord, amount: -100 });
    expect(res.status).toBe(422);
  });

  it('viewer CANNOT DELETE records', async () => {
    const create = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send(newRecord);
    const id = create.body.record.id;
    const res = await request(app).delete(`/api/records/${id}`).set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it('admin CAN DELETE records', async () => {
    const create = await request(app).post('/api/records').set('Authorization', `Bearer ${analystToken}`).send(newRecord);
    const id = create.body.record.id;
    const res = await request(app).delete(`/api/records/${id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

// ── Dashboard tests ───────────────────────────────────────────────────────────
describe('Dashboard', () => {
  let analystToken, viewerToken;

  beforeAll(async () => {
    const analyst = await createUser('analyst');
    const viewer  = await createUser('viewer');
    analystToken = await loginUser(analyst.email);
    viewerToken  = await loginUser(viewer.email);
  });

  it('analyst can access dashboard summary', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${analystToken}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toHaveProperty('net_balance');
  });

  it('viewer CANNOT access dashboard', async () => {
    const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });
});
