const db = require("../db");

exports.saveHistory = async (req, res) => {
  const userId = req.user.id;
  const { document_name, risk_level, summary, status, clauses } = req.body;
  const clausesJson = JSON.stringify(Array.isArray(clauses) ? clauses : []);

  try {
    const [result] = await db.query(
      `INSERT INTO analysis_history 
       (user_id, document_name, risk_level, summary, status, clauses_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, document_name, risk_level, summary, status, clausesJson]
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
      `SELECT id, document_name, risk_level, summary, status, clauses_json, created_at
       FROM analysis_history
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const historyRows = rows.map((row) => ({
      ...row,
      clauses: typeof row.clauses_json === "string"
        ? JSON.parse(row.clauses_json)
        : row.clauses_json || [],
    }));

    res.json(historyRows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};
