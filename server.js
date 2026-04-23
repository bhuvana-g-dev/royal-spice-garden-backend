// ============================================
// server.js
// Main entry point for the backend.
//
// Responsibilities:
//   1. Load environment variables
//   2. Connect to MongoDB
//   3. Create the Express app
//   4. Register middleware
//   5. Mount routes
//   6. Handle 404 and global errors
//   7. Start listening on PORT
// ============================================

// ── Step 1: Load .env variables ──────────────
// Must be called before anything that reads process.env
require('dotenv').config();

const express       = require('express');
const cors          = require('cors');
const connectDB     = require('./config/db');

// ── Step 2: Connect to MongoDB ────────────────
// This is async — we call it and let it run.
// If it fails, connectDB() calls process.exit(1).
connectDB();

// ── Step 3: Create the Express app ───────────
const app = express();

// ── Step 4: Register Middleware ───────────────

// CORS — tells the browser it is allowed to make
// requests from your frontend domain to this backend.
//
// During development: allows all origins so you can open
// index.html directly in your browser without issues.
//
// IMPORTANT: In production, change 'origin' to your real
// frontend URL, e.g. 'https://royalspicegarden.in'
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || '*',
  methods: ['GET', 'POST'],         // only allow what we need
  allowedHeaders: ['Content-Type'], // only allow JSON content headers
};
app.use(cors(corsOptions));

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json());

// Parse URL-encoded bodies (for HTML form submissions)
app.use(express.urlencoded({ extended: false }));

// ── Step 5: Mount Routes ──────────────────────
// All requests to /api/bookings go to bookingRoutes
// All requests to /api/catering go to cateringRoutes
const bookingRoutes  = require('./routes/bookingRoutes');
const cateringRoutes = require('./routes/cateringRoutes');

app.use('/api/bookings', bookingRoutes);
app.use('/api/catering', cateringRoutes);

// ── Health check route ────────────────────────
// Visit http://localhost:5000/api/health in your browser
// to confirm the server is running correctly.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: '🍛 Royal Spice Garden API is running!',
    timestamp: new Date().toISOString(),
  });
});

// ── Step 6: Handle 404 (unknown routes) ───────
// If no route above matched, send a 404 response.
// This must come AFTER all other routes.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Global error handler ──────────────────────
// Express calls this 4-argument middleware when
// next(error) is called anywhere in the app.
// It is a safety net for unexpected errors.
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred. Please try again.',
  });
});

// ── Step 7: Start the server ──────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 Bookings API: http://localhost:${PORT}/api/bookings`);
  console.log(`🎉 Catering API: http://localhost:${PORT}/api/catering\n`);
});
