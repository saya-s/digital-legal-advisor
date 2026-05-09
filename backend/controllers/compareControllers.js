const extractTextFromFile = require("./upload/extractTextFromFile");
const { compareDocuments } = require("../services/documentComparison");

exports.compareDocuments = async (req, res) => {
  try {
    const originalFile = req.files?.originalDocument?.[0];
    const revisedFile = req.files?.revisedDocument?.[0];

    if (!originalFile || !revisedFile) {
      return res.status(400).json({
        error: "Please upload both an original document and a revised document.",
      });
    }

    const [originalText, revisedText] = await Promise.all([
      extractTextFromFile(originalFile),
      extractTextFromFile(revisedFile),
    ]);

    if (!originalText.trim() || !revisedText.trim()) {
      return res.status(400).json({
        error: "Could not extract readable text from one or both files.",
      });
    }

    const comparison = compareDocuments({
      originalName: originalFile.originalname,
      originalText,
      revisedName: revisedFile.originalname,
      revisedText,
    });

    return res.json(comparison);
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not compare these documents.",
    });
  }
};
