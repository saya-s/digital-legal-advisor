const express = require('express');
const cors = require('cors');
const db = require('./db'); // This pulls in your db.js connection
require('dotenv').config();

const app = express();
app.use(cors()); 
app.use(express.json()); 

// 1. THE STATUS ROUTE (Tests if the server is alive)
app.get('/api/status', (req, res) => {
  console.log("Status check hit!");
  res.json({ message: "Backend is running on port 5001!" });
});

// 2. THE DATABASE ROUTE (Tests if TiDB is connected)
app.get('/api/test-db', async (req, res) => {
  console.log("1. Route hit! Attempting to query database...");
  try {
    const [rows] = await db.query('SELECT "Database Connected!" as status');
    console.log("2. Query successful! Data:", rows);
    res.json(rows[0]);
  } catch (err) {
    console.error("3. DATABASE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const bcrypt = require('bcrypt');

// POST route for user registration
app.post('/api/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // 1. Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Insert into TiDB
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    res.status(201).json({ message: "User created successfully!", userId: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Username or Email already exists" });
    } else {
      res.status(500).json({ error: "Database error during registration" });
    }
  }
});
// backend/server.js

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Look for the user by email or username
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?', 
      [email, email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = users[0];

    // 2. Compare the password with the hashed one in TiDB
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // 3. Success! 
    res.json({ 
      message: "Login successful", 
      username: user.username,
      userId: user.id 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});
// 3. THE TEMPLATES ROUTE (Fetches contract templates with optional filtering)
app.get('/api/templates', async (req, res) => {
  console.log("Templates route hit! Category:", req.query.category);
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM templates';
    let params = [];

    // If a category is provided and it's not 'All', we filter the SQL query
    if (category && category !== 'All') {
      query += ' WHERE category = ?';
      params.push(category);
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("TEMPLATES ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get all lawyers
app.get('/api/lawyers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lawyers');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch lawyers" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server spinning on port ${PORT}`));