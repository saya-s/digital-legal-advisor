const { CONTRACT_QA_DISCLAIMER } = require("../services/legalQaAnswerBuilder");
const { normalizeWhitespace } = require("../services/legalQaDataset");
const {
  generateGroundedClauseExplanation,
  hasOpenAiLegalQa,
  isGroundedClauseExplanationUsable,
} = require("../services/legalQaOpenAiService");
const { searchLegalArticles } = require("../services/legalQaSearch");

const MAX_CLAUSE_SEARCH_TEXT_CHARS = 1800;
const CLAUSE_SEARCH_LIMIT = 20;
const CLAUSE_CITATION_LIMIT = 4;

const CONTRACT_DOMAIN_RULES = [
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
  },
];

const CLAUSE_LABEL_HINTS = {
  payment: [
    "payment",
    "pay",
    "price",
    "fee",
    "consideration",
    "purchase",
    "capital",
    "funding",
    "contribution",
    "installment",
  ],
  termination: [
    "termination",
    "terminate",
    "ending",
    "notice",
    "breach",
    "expiry",
    "renewal",
  ],
  confidentiality: [
    "confidential",
    "confidentiality",
    "disclosure",
    "secret",
    "proprietary",
    "non disclosure",
  ],
  liability: [
    "liability",
    "liable",
    "damages",
    "indemnity",
    "loss",
    "claim",
  ],
  "intellectual property": [
    "intellectual property",
    "ownership",
    "copyright",
    "trademark",
    "license",
    "licensed",
  ],
  "governing law": [
    "governing law",
    "jurisdiction",
    "court",
    "arbitration",
    "dispute",
  ],
};

function normalizeForMatch(value = "") {
  return normalizeWhitespace(value).toLowerCase();
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

function detectContractDomain(contractContext = {}, clause = {}) {
  const sourceText = normalizeForMatch(
    [
      contractContext.documentName,
      contractContext.summary,
      clause.title,
      clause.label,
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
  const clauseLabelKey = normalizeForMatch(clause.label || "");
  const clauseTerms = CLAUSE_LABEL_HINTS[clauseLabelKey] || [];
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
    domainMatches === 0 &&
    !preferredLawTitle
  ) {
    contextualScore -= 8;
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
  const summary = normalizeWhitespace(contractContext?.summary || "");

  return normalizeWhitespace(
    [
      clause.title,
      clause.label,
      clause.risk,
      clause.riskReasons.join(" "),
      summary,
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

    if (rerankedSearchResult.citations.length === 0) {
      return res.status(422).json({
        error:
          "No relevant loaded Iraqi law sections were found for this clause yet.",
      });
    }

    const citations = rerankedSearchResult.citations.map(toClientCitation);
    const modelAnswer = await generateGroundedClauseExplanation({
      clause,
      citations: rerankedSearchResult.citations,
      contractContext,
    });

    if (!isGroundedClauseExplanationUsable(modelAnswer, rerankedSearchResult.citations)) {
      return res.status(502).json({
        error:
          "AI clause explanation could not be grounded in the retrieved law sections.",
      });
    }

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
