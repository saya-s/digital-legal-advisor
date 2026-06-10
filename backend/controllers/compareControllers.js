// Extract readable text from uploaded contract files.
const extractTextFromFile = require("./upload/extractTextFromFile");
// Reuse the same contract-validation rules used by the analysis feature.
const {
  assessContractDocument,
  buildContractDocumentErrorMessage,
} = require("./upload/contractDocumentValidation");
// Core comparison engine that produces the final side-by-side results.
const { compareDocuments } = require("../services/documentComparison");
// Load searchable text for saved templates stored in the database.
const { loadTemplateSearchRecord } = require("../services/contractContentSearch");
// Database access for template lookup.
const db = require("../db");

// Normalize the requested comparison mode and default to version comparison.
function normalizeMode(value) {
  return String(value || "version").trim().toLowerCase();
}

// Read the template id safely from the request body.
function parseTemplateId(value) {
  const templateId = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(templateId) || templateId <= 0) {
    return null;
  }

  return templateId;
}

// Load both the template row and its extracted text so it can be compared like a document.
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

// Main controller: compare either contract-vs-template or version-vs-version.
exports.compareDocuments = async (req, res) => {
  try {
    // STEP 1: Read the requested comparison mode from the incoming form data.
    const comparisonMode = normalizeMode(req.body?.comparisonMode);

    // MODE A: Compare one uploaded contract against a stored template.
    if (comparisonMode === "template") {
      const contractFile = req.files?.contractDocument?.[0];
      const templateId = parseTemplateId(req.body?.templateId);

      // Both the uploaded contract and the chosen template are required in this mode.
      if (!contractFile || !templateId) {
        return res.status(400).json({
          error: "Upload a contract file and choose a template before comparing.",
        });
      }

      // Extract the uploaded contract text and load the template source in parallel.
      const [contractText, templateSource] = await Promise.all([
        extractTextFromFile(contractFile),
        loadTemplateComparisonSource(templateId),
      ]);

      // Stop if the selected template id does not exist.
      if (!templateSource) {
        return res.status(404).json({
          error: "The selected template could not be found.",
        });
      }

      // The uploaded contract must contain readable text before comparison can begin.
      if (!contractText.trim()) {
        return res.status(400).json({
          error: "Could not extract readable text from the uploaded contract.",
        });
      }

      // Validate that the uploaded file actually looks like a contract.
      const contractAssessment = assessContractDocument({
        fileName: contractFile.originalname,
        text: contractText,
      });

      if (!contractAssessment.isLikelyContract) {
        return res.status(422).json({
          error: buildContractDocumentErrorMessage(
            contractFile.originalname,
            contractAssessment,
          ),
        });
      }

      // Templates also need readable source text or there is nothing meaningful to compare.
      if (!templateSource.text) {
        return res.status(400).json({
          error:
            "The selected template does not have readable content available for comparison.",
        });
      }

      // Send both documents into the comparison engine with labels and metadata.
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

    // Reject any mode other than the two supported comparison types.
    if (comparisonMode !== "version") {
      return res.status(400).json({
        error: "Unsupported comparison mode.",
      });
    }

    // MODE B: Compare two uploaded versions of a contract.
    const originalFile = req.files?.originalDocument?.[0];
    const revisedFile = req.files?.revisedDocument?.[0];

    // This mode requires both sides of the comparison.
    if (!originalFile || !revisedFile) {
      return res.status(400).json({
        error: "Please upload both an original document and a revised document.",
      });
    }

    // Extract both files in parallel to keep the request fast.
    const [originalText, revisedText] = await Promise.all([
      extractTextFromFile(originalFile),
      extractTextFromFile(revisedFile),
    ]);

    // Stop if text extraction failed for either document.
    if (!originalText.trim() || !revisedText.trim()) {
      return res.status(400).json({
        error: "Could not extract readable text from one or both files.",
      });
    }

    // Validate each side independently so non-contract documents are rejected clearly.
    const originalAssessment = assessContractDocument({
      fileName: originalFile.originalname,
      text: originalText,
    });
    const revisedAssessment = assessContractDocument({
      fileName: revisedFile.originalname,
      text: revisedText,
    });

    if (!originalAssessment.isLikelyContract) {
      return res.status(422).json({
        error: `The original document is not valid for contract comparison. ${buildContractDocumentErrorMessage(
          originalFile.originalname,
          originalAssessment,
        )}`,
      });
    }

    if (!revisedAssessment.isLikelyContract) {
      return res.status(422).json({
        error: `The revised document is not valid for contract comparison. ${buildContractDocumentErrorMessage(
          revisedFile.originalname,
          revisedAssessment,
        )}`,
      });
    }

    // Run the version comparison once both files pass validation.
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
    // Final fallback for extraction, validation, database, or comparison errors.
    return res.status(500).json({
      error: error.message || "Could not compare these documents.",
    });
  }
};
