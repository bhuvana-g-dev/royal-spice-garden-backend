// ============================================
// models/Catering.js
// Mongoose schema + model for catering requests.
// Each document in the "caterings" collection
// will follow this shape.
// ============================================

const mongoose = require('mongoose');

// ------------------------------------
// Schema definition
// ------------------------------------
const cateringSchema = new mongoose.Schema(
  {
    // Customer's full name — required
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Customer's phone number — required
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },

    // Type of event (e.g. 'wedding', 'birthday', 'corporate')
    // These match the <option value="..."> in the frontend select
    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['wedding', 'birthday', 'corporate', 'anniversary', 'religious', 'other'],
        message: '{VALUE} is not a supported event type',
      },
    },

    // Approximate number of guests
    guestCount: {
      type: Number,
      required: [true, 'Guest count is required'],
      min: [10, 'Minimum guest count is 10'],
      max: [5000, 'Maximum guest count is 5000'],
    },

    // Approximate event date (stored as string from the date input)
    eventDate: {
      type: String,
      default: '',
    },

    // Optional dietary preferences, venue details, etc.
    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // Request status — managed by restaurant staff
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
  },

  // Automatically adds createdAt and updatedAt fields
  {
    timestamps: true,
  }
);

// Mongoose maps 'Catering' model → 'caterings' collection in MongoDB
const Catering = mongoose.model('Catering', cateringSchema);

module.exports = Catering;
