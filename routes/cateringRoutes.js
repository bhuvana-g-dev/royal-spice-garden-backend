// ============================================
// routes/cateringRoutes.js
//
// Defines routing for catering requests.
// Same pattern as bookingRoutes.js.
// ============================================

const express = require('express');
const router  = express.Router();

const { createCatering, getAllCatering } = require('../controllers/cateringController');

// POST /api/catering  → save a new catering request
router.post('/', createCatering);

// GET  /api/catering  → return all catering requests
router.get('/', getAllCatering);

module.exports = router;
