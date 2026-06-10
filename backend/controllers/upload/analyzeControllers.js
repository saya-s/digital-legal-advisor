// Read text from uploaded PDF, DOCX, or TXT files.
const extractTextFromFile = require("./extractTextFromFile");
// Break contract text into clauses and assign a topic label to each clause.
const { splitIntoClauses, labelClause } = require("./clauses");
// Reject non-contract uploads and build a user-friendly validation error.
const {
  assessContractDocument,
  buildContractDocumentErrorMessage,
} = require("./contractDocumentValidation");
// Score each clause for risk and then calculate the overall contract risk.
const { assessClauseRisk, getOverallRiskLevel } = require("./riskAnalysis");

// Change these limits if you want to analyze more text or more clauses.
const MAX_ANALYSIS_TEXT_CHARS = 80000;
const MAX_ANALYZED_CLAUSES = 120;

// Turn ["A", "B", "C"] into "A, B, and C" for readable summaries.
function formatLabelList(items) {
  if (items.length === 0) {
    return "";
  }

  if (items.length === 1) {
    return items[0];
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

// Map each detected clause label to a plain-English topic description.
function getTopicDescription(label) {
  switch (label) {
    case "Payment":
      return "payment and money obligations";
    case "Termination":
      return "how the agreement can end";
    case "Confidentiality":
      return "confidentiality and information-sharing limits";
    case "Liability":
      return "responsibility for losses, claims, or damages";
    case "Intellectual Property":
      return "ownership of work, rights, or licensed material";
    case "Governing Law":
      return "disputes, jurisdiction, and legal enforcement";
    default:
      return "general obligations between the parties";
  }
}

// Guess the contract type by looking for keywords in the file name and first clauses.
function inferContractType(documentName, clauses) {
  // Use only the beginning of the contract because it usually contains the clearest hints.
  const inferenceText = `${documentName} ${clauses
    .slice(0, 4)
    .map((clause) => clause.text)
    .join(" ")}`.toLowerCase();

  // Change or add rules here if you want to recognize more contract categories.
  const contractTypeRules = [
    {
      patterns: ["lease", "landlord", "tenant", "premises", "rent"],
      minimumMatches: 2,
      description:
        "This appears to be a lease-style agreement covering the use of property and the tenant's obligations.",
    },
    {
      patterns: ["loan", "lender", "borrower", "repayment", "principal amount"],
      minimumMatches: 2,
      description:
        "This appears to be a loan agreement covering borrowed money, repayment duties, and default terms.",
    },
    {
      patterns: ["employment", "employee", "employer", "salary"],
      minimumMatches: 2,
      description:
        "This appears to be an employment agreement describing work duties, compensation, and the employment relationship.",
    },
    {
      patterns: [
        "services agreement",
        "independent contractor",
        "service provider",
        "scope of work",
        "client",
      ],
      minimumMatches: 2,
      description:
        "This appears to be a services agreement describing work to be performed, payment, and each side's responsibilities.",
    },
    {
      patterns: ["freelance", "contractor", "deliverables", "project"],
      minimumMatches: 2,
      description:
        "This appears to be a freelance or contractor agreement focused on project work, deliverables, and compensation.",
    },
    {
      patterns: [
        "non-disclosure",
        "nda",
        "confidential information",
        "proprietary information",
      ],
      minimumMatches: 1,
      description:
        "This appears to be a confidentiality agreement focused on protecting sensitive or proprietary information.",
    },
    {
      patterns: ["investment", "investor", "shares", "equity", "capital contribution"],
      minimumMatches: 2,
      description:
        "This appears to be an investment agreement covering funding terms, ownership expectations, and party rights.",
    },
    {
      patterns: ["consignment", "consignee", "consignor", "goods"],
      minimumMatches: 2,
      description:
        "This appears to be a consignment agreement covering how goods are held, sold, and paid out between the parties.",
    },
  ];

  // Pick the best-matching rule by counting how many keywords are present.
  const matchedRule = contractTypeRules
    .map((rule) => ({
      ...rule,
      matchCount: rule.patterns.filter((pattern) =>
        inferenceText.includes(pattern),
      ).length,
    }))
    .filter((rule) => rule.matchCount >= (rule.minimumMatches || 2))
    .sort((left, right) => right.matchCount - left.matchCount)[0];

  if (matchedRule) {
    return matchedRule.description;
  }

  return "This contract appears to set out the main rights, duties, and expectations between the parties.";
}

// Build the short summary shown to the user after analysis finishes.
function buildSummary(documentName, clauses, riskLevel) {
  // Count risky clauses so the summary can mention them directly.
  const highRiskCount = clauses.filter((clause) => clause.risk === "High").length;
  const mediumRiskCount = clauses.filter((clause) => clause.risk === "Medium").length;

  if (clauses.length === 0) {
    return `${documentName} was uploaded, but no clear clauses were detected from the extracted text.`;
  }

  // Keep only the main clause topics so the summary stays short and readable.
  const topLabels = [...new Set(clauses.map((clause) => clause.label))]
    .filter((label) => label && label !== "General")
    .slice(0, 3);
  const topicSummary =
    topLabels.length > 0
      ? `It mainly covers ${formatLabelList(
          topLabels.map((label) => getTopicDescription(label)),
        )}.`
      : "It mainly covers the core duties and expectations set out in the document.";

  let riskSummary = `Overall risk is ${riskLevel}.`;

  if (riskLevel === "High") {
    riskSummary = `Overall risk is High, with ${highRiskCount} high-risk and ${mediumRiskCount} medium-risk clause(s) flagged for closer review.`;
  } else if (riskLevel === "Medium") {
    riskSummary = `Overall risk is Medium, with ${mediumRiskCount} medium-risk clause(s) and ${highRiskCount} high-risk clause(s) flagged.`;
  } else if (highRiskCount === 0 && mediumRiskCount === 0) {
    riskSummary =
      "Overall risk appears Low based on the issues detected so far, though the full contract should still be reviewed carefully.";
  }

  return `${inferContractType(documentName, clauses)} ${topicSummary} ${riskSummary}`;
}

// Main controller: receive an uploaded file, analyze it, and return a structured report.
exports.analyzeContract = async (req, res) => {
  try {
    // STEP 1: Stop early if the request did not include a file.
    if (!req.file) {
      return res.status(400).json({ error: "No contract file uploaded" });
    }

    // STEP 2: Extract readable text from the uploaded document.
    const extractedText = (await extractTextFromFile(req.file)).trim();
    // Collect non-fatal warnings here so the frontend can display them to the user.
    const analysisWarnings = [];
    // Keep the original file name because it is reused in messages and the final response.
    const fileName = req.file.originalname || "document";
    const lowerFileName = fileName.toLowerCase();

    // STEP 3: Reject files that contain no readable text.
    if (!extractedText) {
      // PDF files often fail here when they are scanned images instead of selectable text.
      const extractionHint = lowerFileName.endsWith(".pdf")
        ? " This PDF may be scanned or image-based. Try a text-based PDF, DOCX, or TXT file."
        : "";

      return res
        .status(400)
        .json({
          error: `Could not extract readable text from this file.${extractionHint}`,
        });
    }

    // By default we analyze the full extracted text unless it exceeds the safety limit.
    let analyzedText = extractedText;

    // STEP 4: Trim very large files to keep the analysis fast and predictable.
    if (extractedText.length > MAX_ANALYSIS_TEXT_CHARS) {
      analyzedText = extractedText.slice(0, MAX_ANALYSIS_TEXT_CHARS).trim();
      analysisWarnings.push(
        `Only the first ${MAX_ANALYSIS_TEXT_CHARS.toLocaleString()} characters were analyzed to keep processing fast.`,
      );
    }

    // STEP 5: Split the contract into clause-sized blocks.
    const clauseTexts = splitIntoClauses(analyzedText);
    // Check that the uploaded file really looks like a contract before deeper analysis.
    const contractAssessment = assessContractDocument({
      fileName,
      text: analyzedText,
      clauseTexts,
    });

    // Reject files such as lecture notes or general documents that are not contract-like.
    if (!contractAssessment.isLikelyContract) {
      return res.status(422).json({
        error: buildContractDocumentErrorMessage(fileName, contractAssessment),
      });
    }

    // STEP 6: Limit how many clauses we score so huge contracts do not slow the server too much.
    const limitedClauseTexts =
      clauseTexts.length > MAX_ANALYZED_CLAUSES
        ? clauseTexts.slice(0, MAX_ANALYZED_CLAUSES)
        : clauseTexts;

    if (clauseTexts.length > MAX_ANALYZED_CLAUSES) {
      analysisWarnings.push(
        `Only the first ${MAX_ANALYZED_CLAUSES} detected clauses were analyzed.`,
      );
    }

    // STEP 7: Convert each clause into a structured object with label and risk data.
    const clauses = limitedClauseTexts.map((clauseText, index) => {
      // Neighbor clauses are passed in as extra context to improve labeling and risk scoring.
      const previousClause = limitedClauseTexts[index - 1] || "";
      const nextClause = limitedClauseTexts[index + 1] || "";
      const clauseContext = `${previousClause} ${nextClause}`;
      // CHANGE HERE if you want different clause categories.
      const label = labelClause(clauseText, clauseContext);
      // CHANGE HERE if you want different risk rules or thresholds.
      const riskAssessment = assessClauseRisk(clauseText, label, clauseContext);

      return {
        // Each clause gets a stable display id for the frontend list.
        id: index + 1,
        title: `${label} Clause ${index + 1}`,
        text: clauseText,
        label,
        risk: riskAssessment.risk,
        riskScore: riskAssessment.score,
        riskReasons: riskAssessment.reasons,
        explanation: "",
      };
    });

    // STEP 8: Calculate the overall risk and the top-level summary for the full contract.
    const riskLevel = getOverallRiskLevel(clauses);
    const summary = buildSummary(req.file.originalname, clauses, riskLevel);

    // STEP 9: Return everything the frontend needs to render the analysis page.
    return res.json({
      documentName: req.file.originalname,
      summary,
      riskLevel,
      clauses,
      // This lets the frontend preview the extracted source text.
      documentText: analyzedText,
      // These warnings explain any truncation or clause-limit decisions.
      analysisWarnings,
      // Metadata helps debugging and can also be shown in the UI if needed.
      analysisMetadata: {
        extractedCharacters: extractedText.length,
        analyzedCharacters: analyzedText.length,
        detectedClauses: clauseTexts.length,
        analyzedClauses: clauses.length,
        wasTextTruncated: extractedText.length > analyzedText.length,
        wasClauseLimitApplied: clauseTexts.length > clauses.length,
      },
    });
  } catch (error) {
    // Final fallback for unexpected extraction or analysis errors.
    return res.status(500).json({
      error: error.message || "Failed to analyze contract",
    });
  }
};
