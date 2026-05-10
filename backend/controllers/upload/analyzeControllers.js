const extractTextFromFile = require("./extractTextFromFile");
const { splitIntoClauses, labelClause } = require("./clauses");
const { assessClauseRisk, getOverallRiskLevel } = require("./riskAnalysis");

const MAX_ANALYSIS_TEXT_CHARS = 80000;
const MAX_ANALYZED_CLAUSES = 120;

function explainClause(clauseLabel, clauseRisk, riskReasons = []) {
  if (riskReasons.length > 0) {
    const reasonText = riskReasons.slice(0, 2).join(" ");

    if (clauseRisk === "High") {
      return `${reasonText} Review this ${clauseLabel.toLowerCase()} clause carefully before you agree.`;
    }

    if (clauseRisk === "Medium") {
      return `${reasonText} This ${clauseLabel.toLowerCase()} clause may need clarification before you accept the contract.`;
    }
  }

  if (clauseRisk === "High") {
    return `This ${clauseLabel.toLowerCase()} clause may strongly favor one side and should be reviewed carefully.`;
  }

  if (clauseRisk === "Medium") {
    return `This ${clauseLabel.toLowerCase()} clause may need clarification before you accept the contract.`;
  }

  return `This ${clauseLabel.toLowerCase()} clause looks standard, but still review it in context.`;
}

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

function inferContractType(documentName, clauses) {
  const inferenceText = `${documentName} ${clauses
    .slice(0, 4)
    .map((clause) => clause.text)
    .join(" ")}`.toLowerCase();

  const contractTypeRules = [
    {
      patterns: ["lease", "landlord", "tenant", "premises", "rent"],
      description:
        "This appears to be a lease-style agreement covering the use of property and the tenant's obligations.",
    },
    {
      patterns: ["loan", "lender", "borrower", "repayment", "principal amount"],
      description:
        "This appears to be a loan agreement covering borrowed money, repayment duties, and default terms.",
    },
    {
      patterns: ["employment", "employee", "employer", "salary"],
      description:
        "This appears to be an employment agreement describing work duties, compensation, and the employment relationship.",
    },
    {
      patterns: ["independent contractor", "services", "service provider", "client"],
      description:
        "This appears to be a services agreement describing work to be performed, payment, and each side's responsibilities.",
    },
    {
      patterns: ["freelance", "contractor", "deliverables", "project"],
      description:
        "This appears to be a freelance or contractor agreement focused on project work, deliverables, and compensation.",
    },
    {
      patterns: ["confidential", "non-disclosure", "nda", "proprietary"],
      description:
        "This appears to be a confidentiality agreement focused on protecting sensitive or proprietary information.",
    },
    {
      patterns: ["investment", "investor", "shares", "equity", "capital contribution"],
      description:
        "This appears to be an investment agreement covering funding terms, ownership expectations, and party rights.",
    },
    {
      patterns: ["consignment", "consignee", "consignor", "goods"],
      description:
        "This appears to be a consignment agreement covering how goods are held, sold, and paid out between the parties.",
    },
  ];

  const matchedRule = contractTypeRules.find((rule) =>
    rule.patterns.some((pattern) => inferenceText.includes(pattern)),
  );

  if (matchedRule) {
    return matchedRule.description;
  }

  return "This contract appears to set out the main rights, duties, and expectations between the parties.";
}

function buildSummary(documentName, clauses, riskLevel) {
  const highRiskCount = clauses.filter((clause) => clause.risk === "High").length;
  const mediumRiskCount = clauses.filter((clause) => clause.risk === "Medium").length;

  if (clauses.length === 0) {
    return `${documentName} was uploaded, but no clear clauses were detected from the extracted text.`;
  }

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

exports.analyzeContract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No contract file uploaded" });
    }

    const extractedText = (await extractTextFromFile(req.file)).trim();
    const analysisWarnings = [];
    const fileName = req.file.originalname || "document";
    const lowerFileName = fileName.toLowerCase();

    if (!extractedText) {
      const extractionHint = lowerFileName.endsWith(".pdf")
        ? " This PDF may be scanned or image-based. Try a text-based PDF, DOCX, or TXT file."
        : "";

      return res
        .status(400)
        .json({
          error: `Could not extract readable text from this file.${extractionHint}`,
        });
    }

    let analyzedText = extractedText;

    if (extractedText.length > MAX_ANALYSIS_TEXT_CHARS) {
      analyzedText = extractedText.slice(0, MAX_ANALYSIS_TEXT_CHARS).trim();
      analysisWarnings.push(
        `Only the first ${MAX_ANALYSIS_TEXT_CHARS.toLocaleString()} characters were analyzed to keep processing fast.`,
      );
    }

    const clauseTexts = splitIntoClauses(analyzedText);
    const limitedClauseTexts =
      clauseTexts.length > MAX_ANALYZED_CLAUSES
        ? clauseTexts.slice(0, MAX_ANALYZED_CLAUSES)
        : clauseTexts;

    if (clauseTexts.length > MAX_ANALYZED_CLAUSES) {
      analysisWarnings.push(
        `Only the first ${MAX_ANALYZED_CLAUSES} detected clauses were analyzed.`,
      );
    }

    const clauses = limitedClauseTexts.map((clauseText, index) => {
      const previousClause = limitedClauseTexts[index - 1] || "";
      const nextClause = limitedClauseTexts[index + 1] || "";
      const clauseContext = `${previousClause} ${nextClause}`;
      const label = labelClause(clauseText, clauseContext);
      const riskAssessment = assessClauseRisk(clauseText, label, clauseContext);

      return {
        id: index + 1,
        title: `${label} Clause ${index + 1}`,
        text: clauseText,
        label,
        risk: riskAssessment.risk,
        riskScore: riskAssessment.score,
        riskReasons: riskAssessment.reasons,
        explanation: explainClause(
          label,
          riskAssessment.risk,
          riskAssessment.reasons,
        ),
      };
    });

    const riskLevel = getOverallRiskLevel(clauses);
    const summary = buildSummary(req.file.originalname, clauses, riskLevel);

    return res.json({
      documentName: req.file.originalname,
      summary,
      riskLevel,
      clauses,
      documentText: analyzedText,
      analysisWarnings,
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
    return res.status(500).json({
      error: error.message || "Failed to analyze contract",
    });
  }
};
