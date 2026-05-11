const extractTextFromFile = require("./upload/extractTextFromFile");
const { compareDocuments } = require("../services/documentComparison");
const { loadTemplateSearchRecord } = require("../services/contractContentSearch");
const db = require("../db");

function normalizeMode(value) {
  return String(value || "version").trim().toLowerCase();
}

function parseTemplateId(value) {
  const templateId = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return null;
  }

  return templateId;
}

async function loadTemplateComparisonSource(templateId) {
  const [rows] = await db.query("SELECT * FROM templates WHERE id = ? LIMIT 1", [
    templateId,
  ]);
  const template = rows[0];

  if (!template) {
    return null;
  }

  const searchRecord = await loadTemplateSearchRecord(template);
  const text = String(searchRecord?.text || "").trim();

  return {
    template,
    text,
  };
}

exports.compareDocuments = async (req, res) => {
  try {
    const comparisonMode = normalizeMode(req.body?.comparisonMode);

    if (comparisonMode === "template") {
      const contractFile = req.files?.contractDocument?.[0];
      const templateId = parseTemplateId(req.body?.templateId);

      if (!contractFile || !templateId) {
        return res.status(400).json({
          error: "Upload a contract file and choose a template before comparing.",
        });
      }

      const [contractText, templateSource] = await Promise.all([
        extractTextFromFile(contractFile),
        loadTemplateComparisonSource(templateId),
      ]);

      if (!templateSource) {
        return res.status(404).json({
          error: "The selected template could not be found.",
        });
      }

      if (!contractText.trim()) {
        return res.status(400).json({
          error: "Could not extract readable text from the uploaded contract.",
        });
      }

      if (!templateSource.text) {
        return res.status(400).json({
          error:
            "The selected template does not have readable content available for comparison.",
        });
      }

      const comparison = compareDocuments({
        comparisonMode,
        documentLabels: {
          original: "Template",
          revised: "Uploaded contract",
        },
        originalName: templateSource.template.title || `Template ${templateId}`,
        originalText: templateSource.text,
        originalDocumentMeta: {
          sourceType: "template",
          templateId,
          category: templateSource.template.category || "",
        },
        revisedName: contractFile.originalname,
        revisedText: contractText,
        revisedDocumentMeta: {
          sourceType: "upload",
        },
      });

      return res.json(comparison);
    }

    if (comparisonMode !== "version") {
      return res.status(400).json({
        error: "Unsupported comparison mode.",
      });
    }

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
      comparisonMode,
      documentLabels: {
        original: "Original",
        revised: "Revised",
      },
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
