const jwt = require('jsonwebtoken');
const { DEV_EMAIL } = require('../../temp-config');


const verifySuperAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Token is expected in "Bearer <token>" format

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the email matches the super admin's email
    if (decoded.email !== DEV_EMAIL || decoded.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.superAdmin = decoded; // Attach decoded token data to the request
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = verifySuperAdmin;