const db = require("../db");
const { searchTemplateContentMatches } = require("../services/contractContentSearch");

exports.getTemplates = async (req, res) => {
  const { category, search } = req.query; //gets filter values from the URL query string
  let query = "SELECT * FROM templates WHERE 1=1"; //starts the SQL query. 
  // WHERE 1=1 is just makes it easier to add more AND conditions later
  const params = []; 

  if (category && category.trim() && category !== "All") //check if a filter was applied and its not ALL 
  {
   //provide the template for the catagory
    query += " AND LOWER(TRIM(category)) = LOWER(TRIM(?))";
    //lower trim igmores space upper case lower case
    params.push(category);
  }

  query += " ORDER BY created_at DESC, id DESC";
//order templates by newest


  try {
    const [rows] = await db.query(query, params);

    if (!search || !search.trim()) {
      return res.json(rows);
    }

    const templateMatches = await searchTemplateContentMatches(
      rows,
      search.trim(),
    );

    return res.json(
      templateMatches.map((match) => ({
        ...match.template,
        searchSnippet: match.snippet,
        matchedClauseCount: match.matchedClauses.length,
        searchMatchScore: match.matchScore,
      })),
    );
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
    //this gets templates from the database and returns them, or sends an error if the query fails.
  }
};
