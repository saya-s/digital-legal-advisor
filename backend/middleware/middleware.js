// JWT helper used to verify signed session tokens.
const jwt = require('jsonwebtoken');

// Protect private routes by requiring a valid Bearer token.
const protect = (req, res, next) => {
  // Read the token from the Authorization header format: "Bearer <token>".
  const token = req.headers.authorization?.split(" ")[1];

  // Stop immediately if the request did not include a token.
  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    // Verify the token signature and expiry using the server's JWT secret.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach the decoded user payload to the request so later controllers can use req.user.
    req.user = decoded;
    // Continue to the protected route handler.
    next();
  } catch (err) {
    // Reject tokens that are invalid, malformed, or expired.
    res.status(401).json({ error: "Token is not valid or has expired" }); 
  }
};

module.exports = protect;
