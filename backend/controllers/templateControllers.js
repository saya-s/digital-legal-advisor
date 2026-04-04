const db = require("../db");

exports.getTemplates = async (req, res) => {
  const { category, search } = req.query;
  let query = "SELECT * FROM templates WHERE 1=1";
  const params = [];

  if (category && category.trim() && category !== "All") {
    query += " AND LOWER(TRIM(category)) = LOWER(TRIM(?))";
    params.push(category);
  }

  if (search && search.trim()) {
    query +=
      " AND (LOWER(title) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?)";
    const keyword = `%${search.trim().toLowerCase()}%`;
    params.push(keyword, keyword);
  }

  query += " ORDER BY created_at DESC, id DESC";

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};
