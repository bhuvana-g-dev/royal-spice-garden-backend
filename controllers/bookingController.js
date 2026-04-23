// ============================================
// controllers/bookingController.js
//
// A controller holds the actual business logic
// for each route. Keeping it separate from the
// route file keeps the code clean and easy to test.
//
// Each function receives:
//   req  — the incoming request (body, params, query)
//   res  — the response object we use to send back JSON
// ============================================

const Booking = require('../models/Booking');

// ─────────────────────────────────────────────
// POST /api/bookings
// Creates a new table booking in the database.
// ─────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    // req.body contains the JSON sent by the frontend form
    const { name, phone, date, time, guests, notes } = req.body;

    // Basic presence check — Mongoose validation will also run,
    // but checking here lets us return a clear message early.
    if (!name || !phone || !date || !time || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, date, time, and guests.',
      });
    }

    // Create and save the new document
    // Mongoose runs schema validation here — if anything is wrong
    // it throws a ValidationError which our catch block handles.
    const booking = await Booking.create({
      name,
      phone,
      date,
      time,
      guests,
      notes: notes || '',
    });

    // 201 Created — the resource was successfully created
    return res.status(201).json({
      success: true,
      message: 'Booking received! We will confirm shortly.',
      data: booking,
    });

  } catch (error) {
    // Mongoose validation error (e.g. a required field is missing in the schema)
    if (error.name === 'ValidationError') {
      // Extract all validation messages into a single string
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: messages,
      });
    }

    // Unexpected server error
    console.error('❌ createBooking error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/bookings
// Returns all bookings, newest first.
// This will be used by the admin panel later.
// ─────────────────────────────────────────────
const getAllBookings = async (req, res) => {
  try {
    // .sort({ createdAt: -1 }) → newest first
    const bookings = await Booking.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });

  } catch (error) {
    console.error('❌ getAllBookings error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

module.exports = { createBooking, getAllBookings };
