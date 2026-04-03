const db = require('../db');
exports.getLawyers = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lawyers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lawyers" });
  }
};