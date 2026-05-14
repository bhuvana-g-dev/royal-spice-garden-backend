// ============================================
// middleware/authMiddleware.js
//
// Protects all admin routes.
// Every protected request must include:
//   Authorization: Bearer <token>
//
// If the token is missing or invalid, we
// return 401 Unauthorized immediately.
// The route handler never even runs.
// ============================================

const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Read the Authorization header
  const authHeader = req.headers['authorization'];

  // Header must be in the format: "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  // Extract the token part after "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // jwt.verify throws if the token is expired or tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload to req so controllers can read it
    req.admin = decoded;

    // Pass control to the next middleware / route handler
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

module.exports = { protect };
