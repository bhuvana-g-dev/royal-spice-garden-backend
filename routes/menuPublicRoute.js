// ============================================
// routes/menuPublicRoute.js
//
// PUBLIC menu route — no auth required.
// Used by the customer-facing website to
// display menu items from the database.
//
// HOW TO ADD THIS TO server.js:
//
// Step 1: Add this line near the other requires:
//   const menuPublicRoute = require('./routes/menuPublicRoute');
//
// Step 2: Mount it with the public routes:
//   app.use('/api/menu', menuPublicRoute);
//
// Place it BEFORE the admin routes line.
// ============================================

const express  = require('express');
const router   = express.Router();
const Menu     = require('../models/Menu');

// GET /api/menu
// Returns all menu items where available = true
// No authentication required — this is public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { available: true }; // only show available items

    if (category && category !== 'all') {
      filter.category = category;
    }

    const items = await Menu.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });

  } catch (error) {
    console.error('Public menu error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error loading menu.',
    });
  }
});

module.exports = router;