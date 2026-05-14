// ============================================
// server.js  (v2 — with Admin Panel support)
// ============================================

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const connectDB  = require('./config/db');

connectDB();

const app = express();

// ── CORS ──────────────────────────────────────
// Allow PUT and DELETE for admin panel in addition
// to GET and POST used by the public website.
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// ── Body parsers ──────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Serve static admin HTML/CSS/JS ───────────
// Opening http://localhost:5000/admin/login.html
// will serve admin/login.html directly.
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ── Public routes (existing customer website) ─
const bookingRoutes  = require('./routes/bookingRoutes');
const cateringRoutes = require('./routes/cateringRoutes');
app.use('/api/bookings', bookingRoutes);
app.use('/api/catering', cateringRoutes);

// ── Admin routes (new) ────────────────────────
const adminRoutes = require('./routes/adminRoutes');
const Menu = require('./models/Menu');

app.get('/api/menu', async (req, res) => {
  try {

    const items = await Menu.find({
      available: true
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: items
    });

  } catch (error) {

    console.error('Public menu error:', error);

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
app.use('/api/admin', adminRoutes);

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🍛 Royal Spice Garden API is running!',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler ──────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
});

// ── Start server ──────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server: http://localhost:${PORT}`);
  console.log(`🔐 Admin:  http://localhost:${PORT}/admin/login.html`);
  console.log(`📋 Health: http://localhost:${PORT}/api/health\n`);
});
