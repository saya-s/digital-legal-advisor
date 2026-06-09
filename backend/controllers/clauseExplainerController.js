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
  "managing shareholder",
  "shareholder consent",
  "capital contribution",
  "voting rights",
  "governing law",
  "confidential information",
  "intellectual property",
  "security deposit",
  "late fee",
  "liquidated damages",
  "employment contract",
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

function scoreClauseCitationContext(citation, clause, contractDomain) {
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
  const preferredLawTitle = Boolean(
    contractDomain?.preferredLawTitlePattern?.test(citation.law_title || ""),
  );

  let contextualScore = baseScore + clauseMatches * 1.4 + domainMatches * 2.8;

  if (preferredLawTitle) {
    contextualScore += 8;
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

  if (domainMatches === 0 && clauseMatches === 0) {
    contextualScore -= 5;
  }

  return {
    ...citation,
    contextualScore: Number(contextualScore.toFixed(2)),
    clauseMatches,
    domainMatches,
    preferredLawTitle,
  };
}

function rerankClauseCitations(searchResult, clause, contractContext) {
  const contractDomain = detectContractDomain(contractContext, clause);
  const scoredCitations = (searchResult?.citations || [])
    .map((citation) =>
      scoreClauseCitationContext(citation, clause, contractDomain),
    )
    .sort((left, right) => right.contextualScore - left.contextualScore);

  let filteredCitations = scoredCitations;

  if (contractDomain) {
    const alignedCitations = scoredCitations.filter(
      (citation) => citation.preferredLawTitle || citation.domainMatches > 0,
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
        citation.clauseMatches > 0),
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

  return normalizeWhitespace(
    [
      contractContext.documentName,
      clauseTitle,
      clauseTopicTerms,
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
      answerSource: modelAnswer.grounded
        ? "external_model"
        : "external_model_needs_more_context",
      confidence: searchResult.confidence,
      citations,
      disclaimer: CONTRACT_QA_DISCLAIMER,
      grounded: modelAnswer.grounded,
      needsMoreContext: modelAnswer.needsMoreContext,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not explain this clause.",
    });
  }
};
