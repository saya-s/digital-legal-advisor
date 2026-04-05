const db = require("../db");

exports.getLawyers = async (req, res) => {
  const { city, specialty, search } = req.query;

//this function returns a list of lawyers, with optional filtering

  let sql = "SELECT * FROM lawyers WHERE 1=1";
  const params = [];

  if (city) {
    sql += " AND city = ?";
    params.push(city);
  }

  if (specialty) {
    sql += " AND specialty = ?";
    params.push(specialty);
  }

  if (search) {
    sql += " AND (name LIKE ? OR firm LIKE ? OR city LIKE ? OR specialty LIKE ?)";
    const keyword = `%${search}%`;
    params.push(keyword, keyword, keyword, keyword);
  }

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lawyers" });
  }
};

exports.getLawyerById = async (req, res) => {
  //this gets all lawyers, or only the ones matching city, specialty, or search

  const { id } = req.params;

  try {
    const [rows] = await db.query("SELECT * FROM lawyers WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Lawyer not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch lawyer" });
  }
};
