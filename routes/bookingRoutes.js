// ============================================
// routes/bookingRoutes.js
//
// Defines which HTTP method + path maps to
// which controller function.
//
// This file only cares about ROUTING.
// The actual logic lives in bookingController.js.
// ============================================

const express = require('express');
const router  = express.Router();

// Import controller functions
const { createBooking, getAllBookings } = require('../controllers/bookingController');

// POST /api/bookings  → save a new booking
router.post('/', createBooking);

// GET  /api/bookings  → return all bookings
router.get('/', getAllBookings);

module.exports = router;
