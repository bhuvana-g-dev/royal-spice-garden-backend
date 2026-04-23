// ============================================
// models/Booking.js
// Mongoose schema + model for table bookings.
// Each document in the "bookings" collection
// will follow this shape.
// ============================================

const mongoose = require('mongoose');

// ------------------------------------
// Schema definition
// A schema describes the shape and rules
// of one document in the collection.
// ------------------------------------
const bookingSchema = new mongoose.Schema(
  {
    // Customer's full name — required
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,               // removes leading/trailing whitespace
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    // Customer's phone number — required
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },

    // Requested date in YYYY-MM-DD format
    date: {
      type: String,
      required: [true, 'Date is required'],
    },

    // Requested time in HH:MM format
    time: {
      type: String,
      required: [true, 'Time is required'],
    },

    // Number of guests (stored as the option value, e.g. "3-5", "10+")
    guests: {
      type: String,
      required: [true, 'Number of guests is required'],
    },

    // Optional special requests from the customer
    notes: {
      type: String,
      trim: true,
      default: '',
    },

    // Booking status — managed by restaurant staff
    // Future admin panel can update this to 'Confirmed' or 'Cancelled'
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
  },

  // ------------------------------------
  // Schema options
  // timestamps: true automatically adds:
  //   createdAt — when the document was saved
  //   updatedAt — when it was last modified
  // ------------------------------------
  {
    timestamps: true,
  }
);

// ------------------------------------
// Create the model
// mongoose.model('Booking', bookingSchema) creates a model
// called "Booking" which maps to the "bookings" collection
// in MongoDB (Mongoose pluralises the name automatically).
// ------------------------------------
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
