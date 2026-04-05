//here we check if a user is athenticated before allowing access to protected routes.
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // read Bearer <token>

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); //verify token by comparing to jwt secret
    req.user = decoded; // if correct it Adds user data (id, email) to the request object
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid or has expired" }); 
  }
};

module.exports = protect;
