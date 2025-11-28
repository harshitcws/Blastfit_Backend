// generate token
const jwt = require('jsonwebtoken');

const generateToken = (id, device) => {
  return jwt.sign({ id, device }, process.env.JWT_SECRET, {
    // expiresIn: '2h', // Token will expire in 2 hour
  });
};

module.exports = generateToken;