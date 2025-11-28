// const jwt = require('jsonwebtoken');
// const User = require('../models/user'); 
// // Middleware to protect routes
// const protect = async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       console.log('Authorization header:', req.headers.authorization);
//       token = req.headers.authorization.split(' ')[1];
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       console.log('Decoded token:', decoded);// ✅ Check what’s inside
//       const user = await User.findById(decoded.id).select('-password');

//       if (!user) {
//         return res.status(401).json({ message: 'User not found from token' });
//       }

//       req.user = user;
//       next();
//     } catch (err) {
//       console.error('Auth middleware error:', err.message);
//       return res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   } else {
//     return res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };
// module.exports = { protect };

const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Middleware to protect routes
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found from token' });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admins only.'
    });
  }
};

module.exports = { protect, admin };