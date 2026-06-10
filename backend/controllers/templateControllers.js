// Database access for reading template rows.
const db = require("../db");
// Reuse the service that searches inside template clause content.
const { searchTemplateContentMatches } = require("../services/contractContentSearch");

// Return the template library, optionally filtered by category and searched by content.
exports.getTemplates = async (req, res) => {
  // Read the optional filter values from the request URL.
  const { category, search } = req.query;
  // Start with a base query, then append filters only when the user provides them.
  let query = "SELECT * FROM templates WHERE 1=1";
  const params = [];

  // Apply a category filter unless the frontend selected "All".
  if (category && category.trim() && category !== "All") {
    query += " AND LOWER(TRIM(category)) = LOWER(TRIM(?))";
    // Lower/trim keeps category matching tolerant of case and spacing differences.
    params.push(category);
  }

  // Show newest templates first.
  query += " ORDER BY created_at DESC, id DESC";

  try {
    // STEP 1: Load the template rows that match the simple SQL filters.
    const [rows] = await db.query(query, params);

    // If there is no content search term, return the filtered rows directly.
    if (!search || !search.trim()) {
      return res.json(rows);
    }

    // STEP 2: Search inside the template text and clause content for the typed phrase.
    const templateMatches = await searchTemplateContentMatches(
      rows,
      search.trim(),
    );

    // Return the matched templates with extra fields the frontend can display in search mode.
    return res.json(
      templateMatches.map((match) => ({
        ...match.template,
        searchSnippet: match.snippet,
        matchedClauseCount: match.matchedClauses.length,
        searchMatchScore: match.matchScore,
      })),
    );
  } catch (err) {
    // Final fallback for database or template-content search errors.
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};
