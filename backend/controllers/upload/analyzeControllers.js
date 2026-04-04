const mammoth = require("mammoth");

const CLAUSE_LABEL_RULES = [
  {
    label: "Termination",
    keywords: ["terminate", "termination", "cancel", "cancellation", "expiry"],
  },
  {
    label: "Payment",
    keywords: [
      "payment",
      "invoice",
      "fee",
      "amount",
      "salary",
      "compensation",
      "rent",
      "base rent",
      "security deposit",
    ],
  },
  {
    label: "Confidentiality",
    keywords: ["confidential", "non-disclosure", "nda", "secret", "proprietary"],
  },
  {
    label: "Liability",
    keywords: ["liability", "liable", "indemnify", "damages", "losses"],
  },
  {
    label: "Intellectual Property",
    keywords: ["intellectual property", "copyright", "ownership", "license"],
  },
  {
    label: "Governing Law",
    keywords: ["governing law", "jurisdiction", "dispute", "arbitration", "court"],
  },
];

const HIGH_RISK_KEYWORDS = [
  "sole discretion",
  "unlimited liability",
  "non-refundable",
  "no liability",
  "waive all rights",
  "without notice",
  "regardless of negligence",
  "landlord's own misconduct",
  "landlord’s own misconduct",
];

const MEDIUM_RISK_KEYWORDS = [
  "automatic renewal",
  "late fee",
  "penalty",
  "may terminate",
  "subject to change",
];

function splitIntoClauses(text) {
  return text
    .split(/\n\s*\n+|(?=\n?\d+[\.\)]\s+[A-Z])|(?=\n?[A-Z][A-Za-z\s]{2,60}:\s*\n)/)
    .map((clause) => clause.replace(/\s+/g, " ").trim())
    .filter((clause) => clause.length > 20);
}

function labelClause(clauseText, contextText = "") {
  const normalizedClause = `${clauseText} ${contextText}`.toLowerCase();

  const matchedRule = CLAUSE_LABEL_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedClause.includes(keyword)),
  );

  return matchedRule ? matchedRule.label : "General";
}

function getClauseRisk(clauseText) {
  const normalizedClause = clauseText.toLowerCase();

  if (HIGH_RISK_KEYWORDS.some((keyword) => normalizedClause.includes(keyword))) {
    return "High";
  }

  if (
    MEDIUM_RISK_KEYWORDS.some((keyword) => normalizedClause.includes(keyword))
  ) {
    return "Medium";
  }

  return "Low";
}

function explainClause(clauseLabel, clauseRisk) {
  if (clauseRisk === "High") {
    return `This ${clauseLabel.toLowerCase()} clause may strongly favor one side and should be reviewed carefully.`;
  }

  if (clauseRisk === "Medium") {
    return `This ${clauseLabel.toLowerCase()} clause may need clarification before you accept the contract.`;
  }

  return `This ${clauseLabel.toLowerCase()} clause looks standard, but still review it in context.`;
}

function getOverallRiskLevel(clauses) {
  if (clauses.some((clause) => clause.risk === "High")) {
    return "High";
  }

  if (clauses.some((clause) => clause.risk === "Medium")) {
    return "Medium";
  }

  return "Low";
}

function buildSummary(documentName, clauses, riskLevel) {
  const clauseLabels = [...new Set(clauses.map((clause) => clause.label))];
  const highRiskCount = clauses.filter((clause) => clause.risk === "High").length;

  if (clauses.length === 0) {
    return `${documentName} was uploaded, but no clear clauses were detected from the extracted text.`;
  }

  return `${documentName} contains ${clauses.length} detected clause section(s), including ${clauseLabels.join(
    ", ",
  )}. Overall risk is ${riskLevel}, with ${highRiskCount} high-risk clause(s) flagged.`;
}

async function extractTextFromFile(file) {
  const fileName = file.originalname.toLowerCase();

  if (file.mimetype === "text/plain" || fileName.endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  throw new Error("Only TXT and DOCX files are supported right now.");
}

exports.analyzeContract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No contract file uploaded" });
    }

    const extractedText = (await extractTextFromFile(req.file)).trim();

    if (!extractedText) {
      return res
        .status(400)
        .json({ error: "Could not extract readable text from this file" });
    }

    const clauseTexts = splitIntoClauses(extractedText);

    const clauses = clauseTexts.map((clauseText, index) => {
      const previousClause = clauseTexts[index - 1] || "";
      const nextClause = clauseTexts[index + 1] || "";
      const label = labelClause(clauseText, `${previousClause} ${nextClause}`);
      const risk = getClauseRisk(clauseText);

      return {
        id: index + 1,
        title: `${label} Clause ${index + 1}`,
        text: clauseText,
        label,
        risk,
        explanation: explainClause(label, risk),
      };
    });

    const riskLevel = getOverallRiskLevel(clauses);
    const summary = buildSummary(req.file.originalname, clauses, riskLevel);

    return res.json({
      documentName: req.file.originalname,
      summary,
      riskLevel,
      clauses,
      documentText: extractedText,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to analyze contract",
    });
  }
};
