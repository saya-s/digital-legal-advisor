// Database access for reading and writing user records.
const db = require('../db');
// Hash passwords securely before storing them.
const bcrypt = require('bcrypt');
// Generate random internal secrets for Google-created accounts.
const crypto = require('crypto');
// Verify Google identity tokens sent from the frontend.
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Create and verify JWT session tokens.
const jwt = require('jsonwebtoken');

// Basic email pattern used by registration and password reset validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Trim user input safely and convert non-strings to an empty string.
const normalizeInput = (value) =>
  typeof value === "string" ? value.trim() : "";

// Passwords must be at least 8 characters and satisfy 3 of 4 common strength checks.
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

// Registration validation checks username length, email format, and password strength.
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

// Login validation only checks that the user entered an identifier and password.
const validateLoginInput = (identifier, password) => {
  if (!identifier) {
    return "Enter your email or username.";
  }

  if (typeof password !== "string" || !password) {
    return "Enter your password.";
  }

  return "";
};

// Password reset requests only need a valid-looking email address.
const validatePasswordResetRequest = (email) => {
  if (!EMAIL_PATTERN.test(email) || email.length > 100) {
    return "Please provide a valid email address.";
  }

  return "";
};

// Create the normal sign-in token used by protected routes.
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email }, // data stred in token
    process.env.JWT_SECRET,             // secret key
    { expiresIn: '24h' }                // the token expires in 1 day
  );
};

// Ask Google to verify that the received credential really belongs to the user.
const verifyGoogleToken = async (token) => {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  return ticket.getPayload();
};

// Google-created accounts still need a password_hash column in the database.
// This generates a random internal password and hashes it so the account can be stored safely.
const createGooglePasswordHash = async (googleUserId) => {
  const randomSecret = crypto.randomBytes(32).toString("hex");
  const generatedPassword = `GOOGLE_AUTH_${googleUserId}_${randomSecret}`;
  return bcrypt.hash(generatedPassword, 10);
};

// Create a short-lived JWT used only for the password reset flow.
const generatePasswordResetToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, purpose: "password_reset" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

// Register a new account using username, email, and password.
exports.register = async (req, res) => {
  // Normalize request data before validation and database work.
  const username = normalizeInput(req.body.username);
  const email = normalizeInput(req.body.email).toLowerCase();
  const { password } = req.body;
  const validationError = validateRegistrationInput(username, email, password);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Hash the password before storing it in the users table.
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: "User created successfully!", userId: result.insertId });
  } catch (err) {
    // Duplicate usernames or emails are handled as user-facing validation errors.
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Username or Email already exists" });
    } else {
      res.status(500).json({ error: "Database error during registration" });
    }
  }
};

// Handle Google sign-up, and also log the user in if the account already exists.
exports.googleAuth = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing Google credential token" });
  }

  try {
    // STEP 1: Verify the Google token and read the Google profile payload.
    const { name, email, sub } = await verifyGoogleToken(token); // 'sub' is the unique Google ID

    // STEP 2: If this email already exists, treat Google sign-up as a login.
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

    // STEP 3: Otherwise create a new local account linked to the Google identity.
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

    // Surface duplicate-entry problems clearly; everything else falls back to Google/token errors.
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Google account already exists with conflicting user data" });
    }

    res.status(400).json({ error: err.message || "Invalid Google token" });
  }
};

// Log in with Google only if the account already exists in the database.
exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing Google credential token" });
  }

  try {
    // STEP 1: Verify the Google identity and extract the account email.
    const { email } = await verifyGoogleToken(token);
    // STEP 2: Find the matching local user account.
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

// Start the password reset flow by checking whether the email exists and creating a reset token.
exports.requestPasswordReset = async (req, res) => {
  const email = normalizeInput(req.body.email).toLowerCase();
  const validationError = validatePasswordResetRequest(email);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // Look up the user by email before building a reset token.
    const [users] = await db.query('SELECT id, email FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.json({
        message:
          "If that email exists, you can continue to reset your password.",
      });
    }

    // Create the short-lived token used by the reset screen.
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

// Finish the password reset flow by verifying the token and writing the new hashed password.
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
    // STEP 1: Verify the reset token and decode its payload.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only tokens created specifically for password reset are accepted here.
    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token." });
    }

    // STEP 2: Hash the new password before updating the database.
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

// Standard login using either email or username plus password.
exports.login = async (req, res) => {
  // The frontend sends this field as "email", but the backend accepts email or username here.
  const identifier = normalizeInput(req.body.email);
  const { password } = req.body;
  const validationError = validateLoginInput(identifier, password);

  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    // STEP 1: Find the account by email or username.
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier.toLowerCase(), identifier]
    );
    if (users.length === 0) return res.status(401).json({ error: "User not found" });

    // STEP 2: Compare the entered password with the stored bcrypt hash.
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    // STEP 3: Return the session token and the basic user info the frontend saves locally.
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
