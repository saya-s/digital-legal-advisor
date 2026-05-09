const { searchDictionary } = require("../services/legalDictionarySearch");

exports.searchDictionary = async (req, res) => {
  try {
    const query = String(req.query?.q || "").trim();
    const result = searchDictionary(query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not search the legal dictionary.",
    });
  }
};
