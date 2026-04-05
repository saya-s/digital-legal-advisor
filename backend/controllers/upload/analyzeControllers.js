const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

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

const RISK_SIGNAL_RULES = [
  {
    level: "High",
    weight: 6,
    reason:
      "Allows one side to end or control the agreement on very broad terms.",
    patterns: [
      "sole discretion",
      "without notice",
      "without prior notice",
      "without cause",
      "at any time",
      "for convenience",
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Makes all remaining payments immediately due after a default or early termination.",
    patterns: [
      "all remaining rent",
      "all remaining fees",
      "all remaining payments",
      "immediately due and payable",
      "entire balance becomes due",
      /\baccelerat(?:e|ion)\b/i,
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Allows deposits or payments to be forfeited without a balanced remedy.",
    patterns: [
      "non-refundable",
      "forfeiture",
      "forfeited",
      "deposit shall be forfeited",
      "security deposit shall be forfeited",
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Creates broad indemnity or hold-harmless duties that can shift major legal risk.",
    patterns: [
      "hold harmless",
      "defend and indemnify",
      "defend, indemnify",
      "indemnify and hold harmless",
      "all claims",
    ],
    labels: ["Liability", "General"],
  },
  {
    level: "High",
    weight: 6,
    reason: "Waives important legal rights or remedies.",
    patterns: [
      "waive all rights",
      "waiver of jury trial",
      "class action waiver",
      "confession of judgment",
      "exclusive remedy",
    ],
  },
  {
    level: "High",
    weight: 6,
    reason:
      "Attempts to remove liability even for serious misconduct or negligence.",
    patterns: [
      "unlimited liability",
      "no liability",
      "regardless of negligence",
      "landlord's own misconduct",
      "landlord’s own misconduct",
      "gross negligence",
    ],
  },
  {
    level: "High",
    weight: 5,
    reason: "Requires a personal guarantee or exposes personal assets.",
    patterns: ["personal guarantee", "personally guarantee"],
  },
  {
    level: "Medium",
    weight: 3,
    reason:
      "Includes automatic renewal or continuing obligations that may be easy to miss.",
    patterns: ["automatic renewal", "automatically renew", "auto-renew"],
  },
  {
    level: "Medium",
    weight: 3,
    reason: "Adds penalties, late fees, or extra financial consequences.",
    patterns: [
      "late fee",
      "late charge",
      "penalty",
      "liquidated damages",
      "default interest",
      "interest at",
    ],
  },
  {
    level: "Medium",
    weight: 3,
    reason:
      "Lets one side change important terms with limited warning or consent.",
    patterns: [
      "subject to change",
      "may revise",
      "may change",
      "may modify",
      "reserves the right to change",
    ],
  },
  {
    level: "Medium",
    weight: 3,
    reason: "Uses broad termination rights that may need clearer limits or notice.",
    patterns: [
      "may terminate",
      "may end this agreement",
      "terminate this agreement",
      "immediate termination",
    ],
    labels: ["Termination", "General"],
  },
  {
    level: "Medium",
    weight: 3,
    reason: "Shifts attorney fees or legal costs onto one side.",
    patterns: ["attorney's fees", "attorneys' fees", "attorney fees", "legal fees"],
  },
  {
    level: "Medium",
    weight: 3,
    reason:
      "Creates broad ownership or assignment obligations that may be one-sided.",
    patterns: [
      "irrevocable",
      "exclusive ownership",
      "work made for hire",
      "assignment of rights",
    ],
    labels: ["Intellectual Property", "General"],
  },
  {
    level: "Medium",
    weight: 2,
    reason:
      "Contains indemnity or liability language that should be reviewed carefully.",
    patterns: ["indemnify", "liability", "damages", "losses"],
    labels: ["Liability"],
  },
];

const NAMED_SECTION_PATTERN =
  /^(?:section|article|clause)\s+\d+[a-z0-9.\-]*\b/i;
const NUMBERED_SECTION_PATTERN =
  /^(?:(?:\d+(?:\.\d+)*)|[A-Z]|[a-z]|[IVXLCDM]+)[.)]\s+[A-Z]/;
const HEADING_WITH_COLON_PATTERN =
  /^[A-Z][A-Za-z0-9/&(),'\- ]{2,80}:\s*$/;
const ALL_CAPS_HEADING_PATTERN =
  /^(?:[A-Z][A-Z0-9/&(),'\-]*)(?:\s+[A-Z0-9/&(),'\-]+){0,8}$/;
const SUBCLAUSE_PATTERN =
  /^(?:\([a-z0-9]+\)|[a-z]\)|[ivxlcdm]+\)|\d+\.\d+)\s+/i;

function normalizeWhitespace(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeBlock(text) {
  return text.replace(/\s+/g, " ").trim();
}

function isStrongClauseStart(text) {
  return (
    NAMED_SECTION_PATTERN.test(text) ||
    NUMBERED_SECTION_PATTERN.test(text) ||
    HEADING_WITH_COLON_PATTERN.test(text)
  );
}

function isStandaloneHeading(text) {
  const normalized = normalizeBlock(text);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  if (!normalized || wordCount > 10) {
    return false;
  }

  if (normalized.endsWith(".") || normalized.endsWith(";")) {
    return false;
  }

  return (
    HEADING_WITH_COLON_PATTERN.test(normalized) ||
    ALL_CAPS_HEADING_PATTERN.test(normalized) ||
    NAMED_SECTION_PATTERN.test(normalized)
  );
}

function buildBlocks(text) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks = [];
  let currentBlock = [];

  const flushBlock = () => {
    if (currentBlock.length === 0) {
      return;
    }

    const blockText = normalizeBlock(currentBlock.join(" "));
    if (blockText) {
      blocks.push(blockText);
    }
    currentBlock = [];
  };

  lines.forEach((rawLine) => {
    const line = normalizeBlock(rawLine);

    if (!line) {
      flushBlock();
      return;
    }

    if (
      currentBlock.length > 0 &&
      isStrongClauseStart(line) &&
      !SUBCLAUSE_PATTERN.test(line)
    ) {
      flushBlock();
    }

    currentBlock.push(line);
  });

  flushBlock();
  return blocks;
}

function mergeShortClauses(clauses) {
  return clauses.reduce((mergedClauses, clauseText) => {
    const normalized = normalizeBlock(clauseText);

    if (!normalized) {
      return mergedClauses;
    }

    if (
      normalized.length < 80 &&
      mergedClauses.length > 0 &&
      !isStrongClauseStart(normalized)
    ) {
      mergedClauses[mergedClauses.length - 1] = normalizeBlock(
        `${mergedClauses[mergedClauses.length - 1]} ${normalized}`,
      );
      return mergedClauses;
    }

    mergedClauses.push(normalized);
    return mergedClauses;
  }, []);
}

function buildHeadingAwareClauses(blocks) {
  const clauses = [];
  let currentClause = "";
  let pendingHeading = "";

  const flushClause = () => {
    if (!currentClause) {
      return;
    }

    clauses.push(normalizeBlock(currentClause));
    currentClause = "";
  };

  blocks.forEach((block) => {
    if (isStandaloneHeading(block)) {
      pendingHeading = pendingHeading
        ? `${pendingHeading} ${block}`
        : block;
      return;
    }

    const nextChunk = pendingHeading
      ? `${pendingHeading} ${block}`
      : block;
    const startsNewClause =
      !!currentClause && (pendingHeading || isStrongClauseStart(block));

    pendingHeading = "";

    if (startsNewClause) {
      flushClause();
    }

    currentClause = currentClause
      ? `${currentClause} ${nextChunk}`
      : nextChunk;
  });

  if (pendingHeading) {
    currentClause = currentClause
      ? `${currentClause} ${pendingHeading}`
      : pendingHeading;
  }

  flushClause();
  return mergeShortClauses(clauses).filter((clause) => clause.length > 20);
}

function buildParagraphClauses(blocks) {
  const clauses = [];
  let currentClause = "";
  let pendingHeading = "";

  const flushClause = () => {
    if (!currentClause) {
      return;
    }

    clauses.push(normalizeBlock(currentClause));
    currentClause = "";
  };

  blocks.forEach((block) => {
    if (isStandaloneHeading(block)) {
      pendingHeading = pendingHeading
        ? `${pendingHeading} ${block}`
        : block;
      return;
    }

    const nextChunk = pendingHeading
      ? `${pendingHeading} ${block}`
      : block;
    const shouldAppend =
      !currentClause ||
      SUBCLAUSE_PATTERN.test(block) ||
      block.length < 120 ||
      currentClause.length < 120;

    pendingHeading = "";

    if (shouldAppend) {
      currentClause = currentClause
        ? `${currentClause} ${nextChunk}`
        : nextChunk;
      return;
    }

    flushClause();
    currentClause = nextChunk;
  });

  if (pendingHeading) {
    currentClause = currentClause
      ? `${currentClause} ${pendingHeading}`
      : pendingHeading;
  }

  flushClause();
  return mergeShortClauses(clauses).filter((clause) => clause.length > 20);
}

function splitIntoClauses(text) {
  const blocks = buildBlocks(text);

  if (blocks.length === 0) {
    return [];
  }

  const headingAwareClauses = buildHeadingAwareClauses(blocks);

  if (headingAwareClauses.length > 1) {
    return headingAwareClauses;
  }

  return buildParagraphClauses(blocks);
}

function labelClause(clauseText, contextText = "") {
  const normalizedClause = `${clauseText} ${contextText}`.toLowerCase();

  const matchedRule = CLAUSE_LABEL_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedClause.includes(keyword)),
  );

  return matchedRule ? matchedRule.label : "General";
}

function matchesRiskPattern(text, pattern) {
  if (pattern instanceof RegExp) {
    return pattern.test(text);
  }

  return text.includes(pattern.toLowerCase());
}

function assessClauseRisk(clauseText, clauseLabel, contextText = "") {
  const normalizedClause = `${clauseText} ${contextText}`.toLowerCase();
  const matchedRules = RISK_SIGNAL_RULES.filter((rule) => {
    const labelMatches =
      !rule.labels ||
      rule.labels.includes(clauseLabel) ||
      rule.labels.includes("General");

    return (
      labelMatches &&
      rule.patterns.some((pattern) => matchesRiskPattern(normalizedClause, pattern))
    );
  });

  const uniqueReasons = [...new Set(matchedRules.map((rule) => rule.reason))];
  const score = matchedRules.reduce((total, rule) => total + rule.weight, 0);
  const hasHighSignal = matchedRules.some((rule) => rule.level === "High");
  const hasMediumSignal = matchedRules.some((rule) => rule.level === "Medium");

  if (hasHighSignal || score >= 6) {
    return { risk: "High", score, reasons: uniqueReasons };
  }

  if (hasMediumSignal || score >= 3) {
    return { risk: "Medium", score, reasons: uniqueReasons };
  }

  return { risk: "Low", score, reasons: [] };
}

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

function getOverallRiskLevel(clauses) {
  const highRiskCount = clauses.filter((clause) => clause.risk === "High").length;
  const mediumRiskCount = clauses.filter((clause) => clause.risk === "Medium").length;
  const totalRiskScore = clauses.reduce(
    (total, clause) => total + (clause.riskScore || 0),
    0,
  );

  if (highRiskCount >= 1 || totalRiskScore >= 8 || mediumRiskCount >= 3) {
    return "High";
  }

  if (mediumRiskCount >= 1 || totalRiskScore >= 3) {
    return "Medium";
  }

  return "Low";
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

  if (file.mimetype === "application/pdf" || fileName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Only PDF, DOCX, and TXT files are supported right now.");
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
      documentText: extractedText,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to analyze contract",
    });
  }
};
