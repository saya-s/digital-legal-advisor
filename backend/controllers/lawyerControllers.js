// Database access for the lawyer directory.
const db = require("../db");

// Return the lawyer directory, optionally filtered by city, specialty, or search text.
exports.getLawyers = async (req, res) => {
  // Read optional filter values from the query string.
  const { city, specialty, search } = req.query;

  // Start with a base query, then append filters only when the user provides them.
  let sql = "SELECT * FROM lawyers WHERE 1=1";
  const params = [];

  // Exact city filter.
  if (city) {
    sql += " AND city = ?";
    params.push(city);
  }

  // Exact specialty filter.
  if (specialty) {
    sql += " AND specialty = ?";
    params.push(specialty);
  }

  // Text search across the main directory fields.
  if (search) {
    sql += " AND (name LIKE ? OR firm LIKE ? OR city LIKE ? OR specialty LIKE ?)";
    const keyword = `%${search}%`;
    params.push(keyword, keyword, keyword, keyword);
  }

  try {
    // Execute the built query safely using parameter placeholders.
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lawyers" });
  }
};

// Return one specific lawyer record by id for the profile page.
exports.getLawyerById = async (req, res) => {
  // The id comes from the route path: /lawyers/:id
  const { id } = req.params;

  try {
    // Query the single requested lawyer.
    const [rows] = await db.query("SELECT * FROM lawyers WHERE id = ?", [id]);

    // Return a clear error when the id does not exist.
    if (rows.length === 0) {
      return res.status(404).json({ error: "Lawyer not found" });
    }

    // The result is a single object, not a list.
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lawyer" });
  }
};
