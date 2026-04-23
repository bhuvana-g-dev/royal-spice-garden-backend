// ============================================
// config/db.js
// MongoDB connection using Mongoose.
// Called once from server.js at startup.
// ============================================

const mongoose = require('mongoose');

/**
 * connectDB — connects to MongoDB Atlas using the URI
 * stored in the MONGO_URI environment variable.
 *
 * If the connection fails, we log the error and exit the
 * process. There is no point running the server without
 * a database.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    // Log which host we connected to (helpful for debugging)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit with failure code so the process manager can restart
    process.exit(1);
  }
};

module.exports = connectDB;
