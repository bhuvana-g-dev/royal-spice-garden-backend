const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  price: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    required: true,
    trim: true
  },

  image: {
    type: String,
    default: ''
  },

  description: {
    type: String,
    default: ''
  },

  available: {
    type: Boolean,
    default: true
  }

},
{
  timestamps: true
});

module.exports = mongoose.model('Menu', menuSchema);