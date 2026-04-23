// ============================================
// controllers/cateringController.js
//
// Business logic for catering request routes.
// Same pattern as bookingController.js.
// ============================================

const Catering = require('../models/Catering');

// ─────────────────────────────────────────────
// POST /api/catering
// Creates a new catering request in the database.
// ─────────────────────────────────────────────
const createCatering = async (req, res) => {
  try {
    const { name, phone, eventType, guestCount, eventDate, notes } = req.body;

    // Check required fields are present
    if (!name || !phone || !eventType || !guestCount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, eventType, and guestCount.',
      });
    }

    // guestCount comes as a string from the form input,
    // so we convert it to a Number before saving.
    const guestCountNum = Number(guestCount);
    if (isNaN(guestCountNum) || guestCountNum < 10) {
      return res.status(400).json({
        success: false,
        message: 'Guest count must be a number of at least 10.',
      });
    }

    const catering = await Catering.create({
      name,
      phone,
      eventType,
      guestCount: guestCountNum,
      eventDate: eventDate || '',
      notes: notes || '',
    });

    // 201 Created
    return res.status(201).json({
      success: true,
      message: 'Catering request received! Our team will contact you within 24 hours.',
      data: catering,
    });

  } catch (error) {
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({
        success: false,
        message: messages,
      });
    }

    console.error('❌ createCatering error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/catering
// Returns all catering requests, newest first.
// ─────────────────────────────────────────────
const getAllCatering = async (req, res) => {
  try {
    const caterings = await Catering.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: caterings.length,
      data: caterings,
    });

  } catch (error) {
    console.error('❌ getAllCatering error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
    });
  }
};

module.exports = { createCatering, getAllCatering };
