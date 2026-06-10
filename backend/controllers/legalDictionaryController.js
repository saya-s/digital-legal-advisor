// Reuse the service that searches glossary terms, law articles, templates, and saved documents.
const { searchDictionary } = require("../services/legalDictionarySearch");

// Main controller: search the legal dictionary experience for the signed-in user.
exports.searchDictionary = async (req, res) => {
  try {
    // Read the search query from ?q= in the request URL.
    const query = String(req.query?.q || "").trim();
    // Pass both the query and the current user id into the search service.
    const result = await searchDictionary(query, req.user?.id);
    return res.json(result);
  } catch (error) {
    // Final fallback for unexpected search or database errors.
    return res.status(500).json({
      error: error.message || "Could not search the legal dictionary.",
    });
  }
};
