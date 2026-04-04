const db = require('../db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require('jsonwebtoken');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeInput = (value) =>
  typeof value === "string" ? value.trim() : "";

const isStrongPassword = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return false;
  }

  const checks = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ];

  return checks.filter(Boolean).length >= 3;
};

const validateRegistrationInput = (username, email, password) => {
  if (username.length < 3 || username.length > 50) {
    return "Username must be between 3 and 50 characters.";
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 100) {
    return "Please provide a valid email address.";
  }

  if (!isStrongPassword(password)) {
    return "Password must be at least 8 characters and include 3 of: lowercase, uppercase, number, symbol.";
  }

  return "";
};

const validateLoginInput = (identifier, password) => {
  if (!identifier) {
    return "Enter your email or username.";
  }

  if (typeof password !== "string" || !password) {
    return "Enter your password.";
  }

  return "";
};

const validatePasswordResetRequest = (email) => {
  if (!EMAIL_PATTERN.test(email) || email.length > 100) {
    return "Please provide a valid email address.";
  }

  return "";
};

// Helper function to create the jwt token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email }, // data stred in token
    process.env.JWT_SECRET,             // secret key
    { expiresIn: '24h' }                // the token expires in 1 day
  );
};

const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

const createGooglePasswordHash = async (googleUserId) => {
  const randomSecret = crypto.randomBytes(32).toString("hex");
  const generatedPassword = `GOOGLE_AUTH_${googleUserId}_${randomSecret}`;
  return bcrypt.hash(generatedPassword, 10);
};

const generatePasswordResetToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Logic for Registration
exports.register = async (req, res) => {
  const username = normalizeInput(req.body.username);
  const email = normalizeInput(req.body.email).toLowerCase();
  const { password } = req.body;
  const validationError = validateRegistrationInput(username, email, password);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

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
    const { name, email, sub } = await verifyGoogleToken(token); // 'sub' is the unique Google ID

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

    // 3. New user: Register them with a real bcrypt hash for a random internal password
    const googlePasswordHash = await createGooglePasswordHash(sub);

    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [`${name}_${sub.slice(-6)}`, email, googlePasswordHash]
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

// logic for Google login only, without creating a new account
exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing Google credential token" });
  }

  try {
    const { email } = await verifyGoogleToken(token);
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({
        error: "You don't have an account yet. Please create an account first.",
      });
    }

    const user = users[0];
    return res.json({
      message: "Login successful",
      token: generateToken(user),
      username: user.username,
      userId: user.id,
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(400).json({ error: err.message || "Invalid Google token" });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const email = normalizeInput(req.body.email).toLowerCase();
  const validationError = validatePasswordResetRequest(email);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const [users] = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.json({
        message:
          "If that email exists, you can continue to reset your password.",
      });
    }

    const resetToken = generatePasswordResetToken(users[0]);

    return res.json({
      message:
        "Continue to choose a new password.",
      resetToken,
    });
  } catch (err) {
    return res.status(500).json({ error: "Could not start the password reset flow" });
  }
};

exports.resetPassword = async (req, res) => {
  const token = normalizeInput(req.body.token);
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing reset token." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters and include 3 of: lowercase, uppercase, number, symbol.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, decoded.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ message: "Password reset successfully." });
  } catch (err) {
    return res.status(400).json({ error: "Reset token is invalid or has expired." });
  }
};

// Logic for Login
exports.login = async (req, res) => {
  const identifier = normalizeInput(req.body.email);
  const { password } = req.body;
  const validationError = validateLoginInput(identifier, password);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier.toLowerCase(), identifier]
    );
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
