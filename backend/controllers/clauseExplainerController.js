const { CONTRACT_QA_DISCLAIMER } = require("../services/legalQaAnswerBuilder");
const { normalizeWhitespace } = require("../services/legalQaDataset");
const {
  generateGroundedClauseExplanation,
  hasOpenAiLegalQa,
} = require("../services/legalQaOpenAiService");
const { searchLegalArticles } = require("../services/legalQaSearch");

const MAX_CLAUSE_SEARCH_TEXT_CHARS = 1800;
const CLAUSE_SEARCH_LIMIT = 20;
const CLAUSE_CITATION_LIMIT = 4;
const CLAUSE_TOPIC_TERM_LIMIT = 16;

const CONTRACT_DOMAIN_RULES = [
  {
    key: "corporate-governance",
    detectTerms: [
      "board of directors",
      "board",
      "director",
      "directors",
      "shareholder",
      "shareholders",
      "managing shareholder",
      "unanimous shareholder consent",
      "voting rights",
      "management and control",
    ],
    lawTerms: [
      "company law",
      "companies law",
      "corporate governance",
      "shareholder",
      "shareholders",
      "board of directors",
      "director",
      "directors",
      "voting rights",
    ],
    preferredLawTitlePattern: /\b(company law|companies law|corporate)\b/i,
    offTopicLawPatterns: [
      /\bbanking law\b/i,
      /\blabor law\b/i,
      /\binvestment law\b/i,
      /\bretirement\b/i,
      /\bconstitution\b/i,
    ],
    requireAlignedLaw: true,
    hardRejectOffTopicTitles: true,
  },
  {
    key: "lease",
    detectTerms: [
      "lease-style agreement",
      "lease agreement",
      "lease",
      "tenant",
      "landlord",
      "premises",
      "rent",
      "residence",
    ],
    lawTerms: [
      "lease",
      "tenant",
      "landlord",
      "property",
      "premises",
      "housing",
      "real estate",
      "rent",
      "residence",
    ],
    offTopicLawPatterns: [
      /\blabor law\b/i,
      /\bbanking law\b/i,
      /\binvestment law\b/i,
      /\bretirement\b/i,
      /\bsalaries?\b/i,
    ],
    requireAlignedLaw: true,
    hardRejectOffTopicTitles: true,
  },
  {
    key: "investment",
    detectTerms: [
      "investment agreement",
      "investment",
      "investor",
      "equity",
      "shares",
      "shareholder",
      "managing shareholder",
      "board of directors",
      "unanimous shareholder consent",
      "capital contribution",
    ],
    lawTerms: [
      "investment law",
      "investment",
      "investor",
      "project",
      "capital",
      "shares",
      "equity",
      "shareholder",
      "company",
      "license",
    ],
    preferredLawTitlePattern: /\binvestment law\b/i,
    offTopicLawPatterns: [
      /\blabor law\b/i,
      /\bbanking law\b/i,
      /\bretirement\b/i,
      /\bsalaries?\b/i,
    ],
    requireAlignedLaw: true,
    hardRejectOffTopicTitles: true,
  },
  {
    key: "employment",
    detectTerms: [
      "employment agreement",
      "employment",
      "employee",
      "employer",
      "salary",
      "worker",
    ],
    lawTerms: [
      "labor law",
      "labour law",
      "employment",
      "employee",
      "employer",
      "worker",
      "wage",
      "salary",
    ],
    preferredLawTitlePattern: /\blabor law\b/i,
    offTopicLawPatterns: [/\bbanking law\b/i, /\binvestment law\b/i],
    requireAlignedLaw: true,
    hardRejectOffTopicTitles: true,
  },
  {
    key: "loan",
    detectTerms: [
      "loan agreement",
      "loan",
      "lender",
      "borrower",
      "repayment",
      "principal amount",
    ],
    lawTerms: [
      "loan",
      "debt",
      "credit",
      "collateral",
      "borrower",
      "lender",
      "bank",
      "banking",
    ],
    preferredLawTitlePattern: /\bbanking law\b/i,
    offTopicLawPatterns: [/\blabor law\b/i, /\binvestment law\b/i],
    requireAlignedLaw: true,
    hardRejectOffTopicTitles: true,
  },
];

const CLAUSE_TOPIC_STOP_WORDS = new Set([
  "agreement",
  "agreements",
  "all",
  "and",
  "any",
  "are",
  "clause",
  "clauses",
  "contract",
  "contracts",
  "each",
  "from",
  "general",
  "hereby",
  "into",
  "must",
  "other",
  "parties",
  "party",
  "person",
  "provision",
  "provided",
  "shall",
  "subject",
  "such",
  "that",
  "their",
  "thereof",
  "thereon",
  "this",
  "those",
  "three",
  "upon",
  "with",
  "without",
]);
const CLAUSE_TOPIC_PHRASES = [
  "board of directors",
  "bank account",
  "bank transfer",
  "managing shareholder",
  "shareholder consent",
  "capital contribution",
  "gross salary",
  "voting rights",
  "governing law",
  "confidential information",
  "hourly wage",
  "intellectual property",
  "payment schedule",
  "security deposit",
  "late fee",
  "liquidated damages",
  "employment contract",
  "tax deductions",
];

const CLAUSE_SUBTOPIC_RULES = [
  {
    key: "payment",
    domainKeys: ["employment"],
    detectTerms: [
      "salary",
      "wage",
      "wages",
      "payment",
      "pay",
      "paid",
      "gross salary",
      "hourly wage",
      "installment",
      "installments",
      "bank account",
      "bank transfer",
      "payment schedule",
      "tax deduction",
      "tax deductions",
      "withholding",
      "withholdings",
      "allowance",
      "allowances",
    ],
    citationTerms: [
      "basic wage",
      "agreed wage",
      "wages shall be paid",
      "wages due",
      "bank transfers",
      "payment orders",
      "monthly payment",
      "weekly payment",
      "salary",
      "wage",
      "wages",
      "allowances",
      "equal pay",
      "minimum wage",
    ],
    penaltyTerms: [
      "termination",
      "terminated",
      "dismissal",
      "resignation",
      "trade union",
      "strike",
      "disciplinary",
      "demotion",
      "retirement",
      "pension",
      "force majeure",
      "interruption",
      "bankrupt",
      "bankruptcy",
    ],
  },
  {
    key: "termination",
    domainKeys: ["employment"],
    detectTerms: [
      "termination",
      "terminate",
      "terminated",
      "dismissal",
      "resignation",
      "end of service",
      "notice period",
      "breach",
      "probation",
    ],
    citationTerms: [
      "termination",
      "terminate",
      "dismissal",
      "resignation",
      "end of service",
      "notice period",
      "probation period",
      "prior notice",
    ],
    penaltyTerms: [
      "bank transfers",
      "payment orders",
      "agreed wage",
      "basic wage",
      "monthly payment",
      "weekly payment",
    ],
  },
  {
    key: "governance",
    domainKeys: ["corporate-governance", "investment"],
    detectTerms: [
      "board of directors",
      "board",
      "director",
      "directors",
      "shareholder",
      "shareholders",
      "managing shareholder",
      "voting rights",
      "unanimous consent",
      "management and control",
    ],
    citationTerms: [
      "board of directors",
      "director",
      "directors",
      "shareholder",
      "shareholders",
      "voting rights",
      "management",
      "control",
      "capital",
    ],
    penaltyTerms: [
      "employment contract",
      "worker",
      "wages",
      "tenant",
      "landlord",
    ],
  },
];

function normalizeForMatch(value = "") {
  return normalizeWhitespace(value).toLowerCase();
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsTerm(haystack = "", needle = "") {
  const normalizedHaystack = normalizeForMatch(haystack);
  const normalizedNeedle = normalizeForMatch(needle);

  if (!normalizedHaystack || !normalizedNeedle) {
    return false;
  }

  return normalizedHaystack.includes(normalizedNeedle);
}

function countMatches(haystack = "", terms = []) {
  return terms.filter((term) => containsTerm(haystack, term)).length;
}

function stripAutoGeneratedClauseTitle(title = "", label = "") {
  const normalizedTitle = normalizeWhitespace(title);

  if (!normalizedTitle) {
    return "";
  }

  if (/^[a-z][a-z\s]+ clause \d+$/i.test(normalizedTitle)) {
    return "";
  }

  const normalizedLabel = normalizeWhitespace(label);

  if (!normalizedLabel) {
    return normalizedTitle;
  }

  const labelPattern = new RegExp(
    `^${escapeRegex(normalizedLabel)}\\s+clause\\s+\\d+$`,
    "i",
  );

  return labelPattern.test(normalizedTitle) ? "" : normalizedTitle;
}

function extractClauseTopicTerms(clause = {}) {
  const sourceText = normalizeForMatch(
    [
      stripAutoGeneratedClauseTitle(clause.title, clause.label),
      clause.text,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (!sourceText) {
    return [];
  }

  const detectedPhrases = CLAUSE_TOPIC_PHRASES.filter((phrase) =>
    sourceText.includes(phrase),
  );
  const detectedTokens = sourceText
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (token) =>
        token.length >= 4 &&
        !CLAUSE_TOPIC_STOP_WORDS.has(token),
    );

  return [...new Set([...detectedPhrases, ...detectedTokens])].slice(
    0,
    CLAUSE_TOPIC_TERM_LIMIT,
  );
}

function detectClauseSubtopics(clause = {}, contractDomain = null) {
  const sourceText = normalizeForMatch(
    [
      stripAutoGeneratedClauseTitle(clause.title, clause.label),
      clause.label,
      clause.text,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (!sourceText) {
    return [];
  }

  return CLAUSE_SUBTOPIC_RULES
    .filter(
      (rule) =>
        !Array.isArray(rule.domainKeys) ||
        !contractDomain ||
        rule.domainKeys.includes(contractDomain.key),
    )
    .map((rule) => ({
      ...rule,
      matchCount: countMatches(sourceText, rule.detectTerms),
    }))
    .filter((rule) => rule.matchCount > 0)
    .sort((left, right) => right.matchCount - left.matchCount)
    .slice(0, 2);
}

function detectContractDomain(contractContext = {}, clause = {}) {
  const sourceText = normalizeForMatch(
    [
      contractContext.documentName,
      contractContext.summary,
      stripAutoGeneratedClauseTitle(clause.title, clause.label),
      clause.text,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const scoredRule = CONTRACT_DOMAIN_RULES
    .map((rule) => ({
      ...rule,
      matchCount: countMatches(sourceText, rule.detectTerms),
    }))
    .filter((rule) => rule.matchCount > 0)
    .sort((left, right) => right.matchCount - left.matchCount)[0];

  return scoredRule || null;
}

function scoreClauseCitationContext(
  citation,
  clause,
  contractDomain,
  clauseSubtopics = [],
) {
  const searchableCitationText = normalizeForMatch(
    [
      citation.law_title,
      citation.reference_label,
      citation.chapter,
      citation.section_title,
      citation.excerpt,
      citation.source_document,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const baseScore = Number(citation.match_score || 0);
  const clauseTerms = extractClauseTopicTerms(clause);
  const clauseMatches = countMatches(searchableCitationText, clauseTerms);
  const domainMatches = contractDomain
    ? countMatches(searchableCitationText, contractDomain.lawTerms)
    : 0;
  const subtopicMatches = clauseSubtopics.reduce(
    (total, subtopic) =>
      total + countMatches(searchableCitationText, subtopic.citationTerms),
    0,
  );
  const subtopicPenaltyMatches = clauseSubtopics.reduce(
    (total, subtopic) =>
      total + countMatches(searchableCitationText, subtopic.penaltyTerms),
    0,
  );
  const preferredLawTitle = Boolean(
    contractDomain?.preferredLawTitlePattern?.test(citation.law_title || ""),
  );

  let contextualScore =
    baseScore +
    clauseMatches * 1.15 +
    domainMatches * 2.8 +
    subtopicMatches * 3.75;

  if (preferredLawTitle) {
    contextualScore += 8;
  }

  if (clauseSubtopics.length > 0 && subtopicMatches > 0) {
    contextualScore += 2.5;
  }

  if (
    contractDomain &&
    contractDomain.offTopicLawPatterns.some((pattern) =>
      pattern.test(citation.law_title || ""),
    ) &&
    !preferredLawTitle
  ) {
    contextualScore -= contractDomain.hardRejectOffTopicTitles ? 100 : 8;
  }

  if (subtopicPenaltyMatches > 0) {
    contextualScore -=
      subtopicMatches > 0
        ? subtopicPenaltyMatches * 0.85
        : subtopicPenaltyMatches * 3.1;
  }

  if (
    domainMatches === 0 &&
    clauseMatches === 0 &&
    subtopicMatches === 0
  ) {
    contextualScore -= 5;
  }

  return {
    ...citation,
    contextualScore: Number(contextualScore.toFixed(2)),
    clauseMatches,
    domainMatches,
    subtopicMatches,
    subtopicPenaltyMatches,
    preferredLawTitle,
  };
}

function rerankClauseCitations(searchResult, clause, contractContext) {
  const contractDomain = detectContractDomain(contractContext, clause);
  const clauseSubtopics = detectClauseSubtopics(clause, contractDomain);
  const scoredCitations = (searchResult?.citations || [])
    .map((citation) =>
      scoreClauseCitationContext(
        citation,
        clause,
        contractDomain,
        clauseSubtopics,
      ),
    )
    .sort((left, right) => right.contextualScore - left.contextualScore);

  let filteredCitations = scoredCitations;

  if (contractDomain) {
    const alignedCitations = scoredCitations.filter(
      (citation) =>
        citation.preferredLawTitle ||
        citation.domainMatches > 0 ||
        citation.subtopicMatches > 0,
    );

    if (alignedCitations.length > 0) {
      filteredCitations = alignedCitations;
    } else if (contractDomain.requireAlignedLaw) {
      return {
        contractDomain,
        citations: [],
      };
    }
  }

  filteredCitations = filteredCitations.filter(
    (citation) =>
      citation.contextualScore >= 8 &&
      (citation.preferredLawTitle ||
        citation.domainMatches > 0 ||
        citation.clauseMatches > 0 ||
        citation.subtopicMatches > 0),
  );

  return {
    contractDomain,
    citations: filteredCitations.slice(0, CLAUSE_CITATION_LIMIT),
  };
}

function normalizeRiskReasons(riskReasons) {
  return Array.isArray(riskReasons)
    ? riskReasons
        .map((reason) => normalizeWhitespace(reason))
        .filter(Boolean)
        .slice(0, 3)
    : [];
}

function normalizeClausePayload(clause = {}) {
  const text = normalizeWhitespace(clause?.text || "");

  if (!text) {
    return null;
  }

  return {
    id: clause?.id || null,
    title: normalizeWhitespace(clause?.title || "") || "Selected clause",
    label: normalizeWhitespace(clause?.label || "") || "General",
    risk: normalizeWhitespace(clause?.risk || "") || "Low",
    riskReasons: normalizeRiskReasons(clause?.riskReasons),
    explanation: normalizeWhitespace(clause?.explanation || ""),
    text,
  };
}

function buildClauseSearchQuery(clause, contractContext = {}) {
  const clauseTitle = stripAutoGeneratedClauseTitle(clause.title, clause.label);
  const clauseTopicTerms = extractClauseTopicTerms(clause).join(" ");
  const contractDomain = detectContractDomain(contractContext, clause);
  const clauseSubtopics = detectClauseSubtopics(clause, contractDomain)
    .flatMap((subtopic) => subtopic.citationTerms)
    .slice(0, 8)
    .join(" ");

  return normalizeWhitespace(
    [
      contractContext.documentName,
      clauseTitle,
      clauseTopicTerms,
      clauseSubtopics,
      clause.text,
    ]
      .filter(Boolean)
      .join(" "),
  ).slice(0, MAX_CLAUSE_SEARCH_TEXT_CHARS);
}

function toClientCitation(citation = {}) {
  return {
    citation_id: citation.citation_id,
    doc_id: citation.doc_id,
    law_title: citation.law_title,
    article_number: citation.article_number,
    article_label: citation.article_label,
    reference_label: citation.reference_label,
    chapter: citation.chapter,
    section_title: citation.section_title,
    section_type: citation.section_type,
    excerpt: citation.excerpt,
    match_score: citation.match_score,
    source_document: citation.source_document,
  };
}

exports.explainClause = async (req, res) => {
  try {
    const clause = normalizeClausePayload(req.body?.clause);

    if (!clause) {
      return res.status(400).json({
        error: "A clause with readable text is required.",
      });
    }

    const contractContext = {
      documentName: normalizeWhitespace(req.body?.documentName || ""),
      summary: normalizeWhitespace(req.body?.summary || ""),
    };

    if (!hasOpenAiLegalQa()) {
      return res.status(503).json({
        error: "AI clause explanation is not configured on the server.",
      });
    }

    const searchResult = searchLegalArticles(
      buildClauseSearchQuery(clause, contractContext),
      { limit: CLAUSE_SEARCH_LIMIT },
    );
    const rerankedSearchResult = rerankClauseCitations(
      searchResult,
      clause,
      contractContext,
    );
    const selectedCitations =
      rerankedSearchResult.citations.length > 0
        ? rerankedSearchResult.citations
        : searchResult.citations.slice(0, CLAUSE_CITATION_LIMIT);
    const citations = selectedCitations.map(toClientCitation);
    const modelAnswer = await generateGroundedClauseExplanation({
      clause,
      citations: selectedCitations,
      contractContext,
    });

    return res.json({
      clauseId: clause.id,
      explanation: modelAnswer.answer,
      answerSource: "external_model",
      confidence: searchResult.confidence,
      citations,
      disclaimer: CONTRACT_QA_DISCLAIMER,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not explain this clause.",
    });
  }
};
