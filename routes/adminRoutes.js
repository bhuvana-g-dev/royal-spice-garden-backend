// ============================================
// routes/adminRoutes.js
// Login is public. Everything else is protected.
// ============================================

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  login,
  getStats,
  getBookings, updateBookingStatus, deleteBooking,
  getCatering, updateCateringStatus, deleteCatering,
} = require('../controllers/adminController');

const {
  getMenu,
  getMenuById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuController');

// ── Public ────────────────────────────────────
router.post('/login', login);

// ── Protected — require valid JWT ─────────────
router.use(protect); // every route below this line requires auth

// Stats
router.get('/stats', getStats);

// Bookings
router.get('/bookings',                  getBookings);
router.put('/bookings/:id/status',       updateBookingStatus);
router.delete('/bookings/:id',           deleteBooking);

// Catering
router.get('/catering',                  getCatering);
router.put('/catering/:id/status',       updateCateringStatus);
router.delete('/catering/:id',           deleteCatering);

// Menu
router.get('/menu',    getMenu);
router.get('/menu/:id', getMenuById);
router.post('/menu',   createMenuItem);
router.put('/menu/:id',    updateMenuItem);
router.delete('/menu/:id', deleteMenuItem);

module.exports = router;
