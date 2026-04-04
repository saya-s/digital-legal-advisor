const db = require('../db');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');

// Helper function to create the jwt token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email }, // data stred in token
    process.env.JWT_SECRET,             // secret key
    { expiresIn: '24h' }                // the token expires in 1 day
  );
};

// Logic for Registration
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: "User created successfully!", userId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Username or Email already exists" });
    } else {
      res.status(500).json({ error: "Database error during registration" });
    }
  }
};
//logic for google registeration 
exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing Google credential token" });
  }

  try {
    // 1. Verify the Google Token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { name, email, sub } = ticket.getPayload(); // 'sub' is the unique Google ID

    // 2. Check if user already exists in TiDB
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
        const token = generateToken(users[0]);
        return res.json({ 
            message: "Login successful", 
            token, // Send the token here!
            username: users[0].username, 
            userId: users[0].id 
        });
        }

    // 3. New user: Register them (using Google ID as a placeholder for password)
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [`${name}_${sub.slice(-6)}`, email, `GOOGLE_AUTH_${sub}`]
    );

    const newUser = {
      id: result.insertId,
      email,
      username: `${name}_${sub.slice(-6)}`,
    };

    res.status(201).json({
      message: "Account created via Google",
      token: generateToken(newUser),
      username: newUser.username,
      userId: newUser.id,
    });
  } catch (err) {
    console.error("Google auth error:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Google account already exists with conflicting user data" });
    }

    res.status(400).json({ error: err.message || "Invalid Google token" });
  }
};

// Logic for Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, email]);
    if (users.length === 0) return res.status(401).json({ error: "User not found" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    res.json({
      message: "Login successful",
      token: generateToken(user),
      username: user.username,
      userId: user.id,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
};
