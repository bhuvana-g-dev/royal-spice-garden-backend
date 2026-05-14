// ============================================
// controllers/adminController.js
//
// Handles: login, dashboard stats,
//          booking management, catering management
// ============================================

const jwt     = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Catering = require('../models/Catering');
const Menu    = require('../models/Menu');

// ─────────────────────────────────────────────
// POST /api/admin/login
// Validates credentials from .env and returns JWT
// ─────────────────────────────────────────────
const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  // Compare against .env credentials (no database user model needed)
  if (
    username !== process.env.ADMIN_USER ||
    password !== process.env.ADMIN_PASS
  ) {
    return res.status(401).json({ success: false, message: 'Invalid username or password.' });
  }

  // Sign a JWT — expires in 8 hours by default
  const token = jwt.sign(
    { username, role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.status(200).json({
    success: true,
    message: 'Login successful!',
    token,
    admin: { username },
  });
};

// ─────────────────────────────────────────────
// GET /api/admin/stats
// Dashboard summary counts
// ─────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      totalCatering,
      pendingCatering,
      totalMenu,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Pending' }),
      Booking.countDocuments({ status: 'Confirmed' }),
      Catering.countDocuments(),
      Catering.countDocuments({ status: 'Pending' }),
      Menu.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        totalCatering,
        pendingCatering,
        totalMenu,
      },
    });
  } catch (error) {
    console.error('getStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/bookings
// All bookings, newest first
// ─────────────────────────────────────────────
const getBookings = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error('getBookings error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/bookings/:id/status
// Update a booking's status
// ─────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.status(200).json({ success: true, message: 'Status updated.', data: booking });
  } catch (error) {
    console.error('updateBookingStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/bookings/:id
// ─────────────────────────────────────────────
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    return res.status(200).json({ success: true, message: 'Booking deleted.' });
  } catch (error) {
    console.error('deleteBooking error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/catering
// ─────────────────────────────────────────────
const getCatering = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const caterings = await Catering.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: caterings.length,
      data: caterings,
    });
  } catch (error) {
    console.error('getCatering error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/catering/:id/status
// ─────────────────────────────────────────────
const updateCateringStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const catering = await Catering.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!catering) {
      return res.status(404).json({ success: false, message: 'Catering request not found.' });
    }

    return res.status(200).json({ success: true, message: 'Status updated.', data: catering });
  } catch (error) {
    console.error('updateCateringStatus error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/catering/:id
// ─────────────────────────────────────────────
const deleteCatering = async (req, res) => {
  try {
    const catering = await Catering.findByIdAndDelete(req.params.id);

    if (!catering) {
      return res.status(404).json({ success: false, message: 'Catering request not found.' });
    }

    return res.status(200).json({ success: true, message: 'Catering request deleted.' });
  } catch (error) {
    console.error('deleteCatering error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  login,
  getStats,
  getBookings,
  updateBookingStatus,
  deleteBooking,
  getCatering,
  updateCateringStatus,
  deleteCatering,
};
