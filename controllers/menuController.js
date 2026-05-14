// ============================================
// controllers/menuController.js
// Full CRUD for restaurant menu items
// ============================================

const Menu = require('../models/Menu');


// GET /api/admin/menu
// Get all menu items
const getMenu = async (req, res) => {
  try {
    const items = await Menu.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    console.error('getMenu error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};


// GET /api/admin/menu/:id
// Get single menu item
const getMenuById = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: item
    });

  } catch (error) {
    console.error('getMenuById error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};


// POST /api/admin/menu
// Create new menu item
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      image,
      description,
      available
    } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price and category are required.'
      });
    }

    const item = await Menu.create({
      name,
      price,
      category,
      image,
      description,
      available
    });

    return res.status(201).json({
      success: true,
      message: 'Menu item created.',
      data: item
    });

  } catch (error) {

    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)
        .map(e => e.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: msg
      });
    }

    console.error('createMenuItem error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};


// PUT /api/admin/menu/:id
// Update menu item
const updateMenuItem = async (req, res) => {
  try {

    const {
      name,
      price,
      category,
      image,
      description,
      available
    } = req.body;

    const item = await Menu.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        category,
        image,
        description,
        available
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Menu item updated.',
      data: item
    });

  } catch (error) {

    if (error.name === 'ValidationError') {
      const msg = Object.values(error.errors)
        .map(e => e.message)
        .join(', ');

      return res.status(400).json({
        success: false,
        message: msg
      });
    }

    console.error('updateMenuItem error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};


// DELETE /api/admin/menu/:id
// Delete menu item
const deleteMenuItem = async (req, res) => {
  try {

    const item = await Menu.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Menu item deleted.'
    });

  } catch (error) {

    console.error('deleteMenuItem error:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error.'
    });
  }
};


module.exports = {
  getMenu,
  getMenuById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};