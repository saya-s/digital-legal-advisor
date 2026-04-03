const db = require('../db');

exports.getTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM templates';
    let params = [];
    if (category && category !== 'All') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};