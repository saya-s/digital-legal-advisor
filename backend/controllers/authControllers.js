const db = require('../db');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      // User exists, return login success
      return res.json({ message: "Login successful", username: users[0].username, userId: users[0].id });
    }

    // 3. New user: Register them (using Google ID as a placeholder for password)
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [name, email, `GOOGLE_AUTH_${sub}`]
    );

    res.status(201).json({ message: "Account created via Google", userId: result.insertId });
  } catch (err) {
    res.status(400).json({ error: "Invalid Google token" });
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

    res.json({ message: "Login successful", username: user.username, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: "Server error during login" });
  }
};