const express = require('express');
const morgan  = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const recordRoutes    = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// Rate limiting — 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Finance Backend API',
    version: '1.0.0',
    endpoints: {
      auth:      '/api/auth',
      users:     '/api/users',
      records:   '/api/records',
      dashboard: '/api/dashboard',
    },
  });
});

app.use('/api/auth',      authRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/records',   recordRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Finance Backend running on http://localhost:${PORT}`);
    console.log(`   Run "npm run seed" to populate sample data\n`);
  });
}

module.exports = app;
