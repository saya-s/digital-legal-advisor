const db = require("../db");

exports.saveHistory = async (req, res) => {
  const userId = req.user.id;
  const { document_name, risk_level, summary, status } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO analysis_history 
       (user_id, document_name, risk_level, summary, status)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, document_name, risk_level, summary, status]
    );

    res.status(201).json({ message: "History saved", historyId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: "Failed to save history" });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT id, document_name, risk_level, summary, status, created_at
       FROM analysis_history
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
