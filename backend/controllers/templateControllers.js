const db = require("../db");

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

  if (search && search.trim()) 
  //checking that the user actualy typed something in the search 
  {
    query +=
      " AND (LOWER(title) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?)";

      //COALESCE.  means if description is NULL, treat it like an empty string

    const keyword = `%${search.trim().toLowerCase()}%`;
    params.push(keyword, keyword);
  }

  query += " ORDER BY created_at DESC, id DESC";
//order templates by newest


  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
    //this gets templates from the database and returns them, or sends an error if the query fails.
  }
};
