const { normalizeWhitespace } = require("./legalQaDataset");
const { splitIntoClauses, labelClause } = require("../controllers/upload/clauses");
const { assessClauseRisk } = require("../controllers/upload/riskAnalysis");

const LEGAL_QA_DISCLAIMER =
  "This is an informational summary based on the legal texts currently loaded in the platform and it is not a substitute for licensed legal advice.";
const CONTRACT_QA_DISCLAIMER =
  "This is an informational summary based on the uploaded contract context and it is not a substitute for licensed legal advice.";

const LAWYER_ESCALATION_PATTERNS = [
  /\baccident\b/i,
  /\barbitration\b/i,
  /\bcourt\b/i,
  /\bcompensation\b/i,
  /\bdeport/i,
  /\bdiscrimination\b/i,
  /\bdismiss(?:ed|al)?\b/i,
  /\bfine\b/i,
  /\bfired\b/i,
  /\bforeign worker\b/i,
  /\bharassment\b/i,
  /\bimprisonment\b/i,
  /\binjury\b/i,
  /\blawsuit\b/i,
  /\bpenalt(?:y|ies)\b/i,
  /\bsexual\b/i,
  /\bstrike\b/i,
  /\bterminate(?:d|ion)?\b/i,
];

const VALIDATION_STOP_WORDS = new Set([
  "all",
  "and",
  "answer",
  "article",
  "articles",
  "because",
  "does",
  "from",
  "have",
  "into",
  "iraq",
  "law",
  "laws",
  "more",
  "question",
  "shall",
  "than",
  "that",
  "their",
  "them",
  "there",
  "these",
  "this",
  "those",
  "under",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
]);

const CONTRACT_LABEL_KEYWORDS = {
  confidentiality: ["confidential", "confidentiality", "nda", "disclosure", "secret"],
  "governing law": ["governing law", "jurisdiction", "court", "venue", "arbitration", "dispute"],
  "intellectual property": ["intellectual property", "ownership", "copyright", "trademark", "license"],
  liability: ["liability", "liable", "damages", "indemnity", "loss", "claim"],
  payment: ["payment", "pay", "invoice", "fee", "price", "salary", "wage", "rent"],
  services: ["services", "scope", "deliverables", "performance", "work"],
  termination: ["termination", "terminate", "ended", "ending", "cancel", "breach", "notice", "renewal", "expire"],
};

function stripArticlePrefix(text = "") {
  return normalizeWhitespace(
    text.replace(/^(article|section)\s+\d+\s*[-–:]?\s*/i, ""),
  );
}

function ensureSentence(text = "") {
  if (!text) {
    return "";
  }

  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function lowerCaseFirstLetter(text = "") {
  if (!text) {
    return "";
  }

  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function clampText(text, maxLength = 260) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function tokenizeForContractSearch(text = "") {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(" ")
    .filter(
      (token) => token.length > 2 && !VALIDATION_STOP_WORDS.has(token),
    );
}

function buildContractSnippet(text = "", maxLength = 240) {
  return clampText(normalizeWhitespace(text), maxLength);
}

function summarizeArticle(article) {
  const preferredSummary =
    article.simplified_text ||
    article.excerpt ||
    article.simplified_text_draft ||
    article.original_text;

  return clampText(
    normalizeWhitespace(
      stripArticlePrefix(preferredSummary)
        .replace(/^In simple terms,\s*/i, "")
        .replace(/^\d+\s*[–\-:)]\s*/u, "")
        .replace(/^[a-z]\s*[-:)]\s*/i, "")
        .replace(
          /\s*The rest of the article adds more detail, conditions, or exceptions\.?$/i,
          "",
        ),
    ),
  );
}

function normalizeContractClause(clause = {}, index = 0) {
  const title = normalizeWhitespace(clause.title || "") || `Clause ${index + 1}`;
  const label = normalizeWhitespace(clause.label || "") || "General";
  const risk = normalizeWhitespace(clause.risk || "") || "Low";
  const explanation = normalizeWhitespace(clause.explanation || "");
  const text = normalizeWhitespace(clause.text || "");

  if (!title && !text && !explanation) {
    return null;
  }

  return {
    id: clause.id || index + 1,
    title,
    label,
    risk,
    explanation,
    text,
  };
}

function buildContractClausesFromDocumentText(documentText = "", limit = 60) {
  const normalizedText = normalizeWhitespace(documentText);

  if (!normalizedText) {
    return [];
  }

  const clauseTexts = splitIntoClauses(normalizedText).slice(0, limit);

  return clauseTexts
    .map((clauseText, index) => {
      const previousClause = clauseTexts[index - 1] || "";
      const nextClause = clauseTexts[index + 1] || "";
      const clauseContext = `${previousClause} ${nextClause}`.trim();
      const label = labelClause(clauseText, clauseContext);
      const riskAssessment = assessClauseRisk(clauseText, label, clauseContext);

      return normalizeContractClause(
        {
          id: index + 1,
          title: `${label} Clause ${index + 1}`,
          label,
          risk: riskAssessment.risk,
          explanation: "",
          text: clauseText,
        },
        index,
      );
    })
    .filter(Boolean);
}

function questionLooksLikeContractSummary(question = "") {
  return /\b(summary|overview|main points?|what is this contract|what does this contract do|about this contract)\b/i.test(
    question,
  );
}

function questionLooksLikeContractRisk(question = "") {
  return /\b(risk|risky|danger|unsafe|red flag|problem|one sided|one-sided|concern)\b/i.test(
    question,
  );
}

function scoreContractClauseMatch(clause, normalizedQuestion, questionTokens) {
  const searchText = normalizeWhitespace(
    [clause.title, clause.label, clause.explanation, clause.text]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();

  if (!searchText) {
    return 0;
  }

  let score = 0;

  if (normalizedQuestion && searchText.includes(normalizedQuestion.toLowerCase())) {
    score += 14;
  }

  const uniqueTokens = [...new Set(questionTokens)];
  uniqueTokens.forEach((token) => {
    if (!searchText.includes(token)) {
      return;
    }

    score += token.length >= 8 ? 2.6 : token.length >= 5 ? 1.8 : 1.2;
  });

  const normalizedLabel = clause.label.toLowerCase();
  const keywordBoosts = CONTRACT_LABEL_KEYWORDS[normalizedLabel] || [];
  keywordBoosts.forEach((keyword) => {
    if (normalizedQuestion.toLowerCase().includes(keyword)) {
      score += 2.4;
    }
  });

  if (questionLooksLikeContractRisk(normalizedQuestion)) {
    if (clause.risk === "High") {
      score += 4.5;
    } else if (clause.risk === "Medium") {
      score += 2.5;
    }
  }

  if (normalizedQuestion.toLowerCase().includes(normalizedLabel)) {
    score += 3.5;
  }

  return Number(score.toFixed(2));
}

function getContractConfidence(matches = []) {
  const topScore = Number(matches[0]?.match_score || 0);

  if (topScore >= 9) {
    return "high";
  }

  if (topScore >= 4) {
    return "medium";
  }

  return "low";
}

function searchContractClauses(question, contractContext = {}, { limit = 3 } = {}) {
  const normalizedQuestion = normalizeWhitespace(question);
  const questionTokens = tokenizeForContractSearch(normalizedQuestion);
  const explicitClauses = Array.isArray(contractContext?.clauses)
    ? contractContext.clauses
        .map(normalizeContractClause)
        .filter(Boolean)
    : [];
  const clauses =
    explicitClauses.length > 0
      ? explicitClauses
      : buildContractClausesFromDocumentText(contractContext?.documentText);

  const matches = clauses
    .map((clause) => ({
      ...clause,
      excerpt: buildContractSnippet(clause.text || clause.explanation, 220),
      match_score: scoreContractClauseMatch(
        clause,
        normalizedQuestion,
        questionTokens,
      ),
    }))
    .filter((clause) => clause.match_score > 0)
    .sort((left, right) => right.match_score - left.match_score)
    .slice(0, limit);

  return {
    matches,
    confidence: getContractConfidence(matches),
  };
}

function summarizeContractClause(clause) {
  if (clause?.explanation) {
    return ensureSentence(clause.explanation);
  }

  if (clause?.text) {
    return ensureSentence(buildContractSnippet(clause.text, 220));
  }

  return "";
}

function buildContractAnswer({ question, contractContext = {}, matches = [] }) {
  const documentName =
    normalizeWhitespace(contractContext?.documentName) || "the uploaded contract";
  const summary = normalizeWhitespace(contractContext?.summary || "");
  const riskLevel = normalizeWhitespace(contractContext?.riskLevel || "");
  const highRiskCount = Number(contractContext?.highRiskCount) || 0;
  const mediumRiskCount = Number(contractContext?.mediumRiskCount) || 0;

  if (questionLooksLikeContractSummary(question) && summary) {
    return `Based on ${documentName}, ${ensureSentence(summary)}`;
  }

  if (questionLooksLikeContractRisk(question) && matches.length === 0 && summary) {
    const riskLead = riskLevel
      ? `The overall contract risk is ${riskLevel}.`
      : "";
    const countLead =
      highRiskCount || mediumRiskCount
        ? ` I found ${highRiskCount} high-risk and ${mediumRiskCount} medium-risk section${
            highRiskCount + mediumRiskCount === 1 ? "" : "s"
          } in the current analysis.`
        : "";

    return `${riskLead} ${ensureSentence(summary)}${countLead}`.trim();
  }

  if (matches.length === 0) {
    if (summary) {
      return `Based on ${documentName}, ${ensureSentence(
        summary,
      )} I could not find a specific clause in the uploaded contract that clearly matches that question. Try asking about payment, termination, liability, confidentiality, governing law, or the riskiest clauses.`;
    }

    return "I could not find a specific clause in the uploaded contract that clearly matches that question. Try asking about payment, termination, liability, confidentiality, governing law, or the riskiest clauses.";
  }

  const primaryMatch = matches[0];
  let answer = `Based on ${documentName}, the closest matching section is ${primaryMatch.title}. ${summarizeContractClause(
    primaryMatch,
  )}`;

  if (primaryMatch.risk) {
    answer += ` It is currently marked ${primaryMatch.risk} risk.`;
  }

  if (matches[1] && matches[1].match_score >= 4) {
    answer += ` Another relevant section is ${matches[1].title}, which ${lowerCaseFirstLetter(
      summarizeContractClause(matches[1]),
    )}`;
  }

  if (questionLooksLikeContractRisk(question) && riskLevel) {
    answer += ` Overall, this contract is currently flagged as ${riskLevel} risk.`;
  }

  return answer;
}

function formatArticleList(citations = []) {
  const labels = citations.map(
    (citation) => citation.reference_label || citation.article_label,
  );

  if (labels.length === 0) {
    return "";
  }

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function buildFallbackAnswer({
  citations = [],
  confidence = "low",
  directArticleMatch = false,
  ambiguousArticleReference = false,
}) {
  if (citations.length === 0) {
    return "I could not find a clear answer in the legal texts currently loaded. Try rephrasing the question, naming the law, or asking for a specific article or section.";
  }

  if (ambiguousArticleReference) {
    return `More than one loaded law contains ${citations[0].article_label}. The closest relevant matches I found are ${formatArticleList(
      citations.slice(0, 2),
    )}.`;
  }

  const primarySummary = ensureSentence(
    lowerCaseFirstLetter(summarizeArticle(citations[0])),
  );

  if (
    citations.length === 1 ||
    directArticleMatch ||
    confidence === "high" ||
    primarySummary.length <= 180
  ) {
    return `Based on ${
      citations[0].reference_label || citations[0].article_label
    }, ${primarySummary}`;
  }

  const secondarySummary = ensureSentence(summarizeArticle(citations[1]));
  const leadIn =
    confidence === "low"
      ? `The closest relevant provisions I found are ${formatArticleList(
          citations.slice(0, 2),
        )}.`
      : `Based on ${formatArticleList(citations.slice(0, 2))},`;

  return `${leadIn} ${primarySummary} ${secondarySummary}`;
}

function detectNeedsLawyer(question, citations = []) {
  const riskText = normalizeWhitespace(question);

  return LAWYER_ESCALATION_PATTERNS.some((pattern) => pattern.test(riskText));
}

function tokenizeForValidation(text = "") {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(" ")
    .filter(
      (token) => token.length > 3 && !VALIDATION_STOP_WORDS.has(token),
    );
}

function countOverlap(sourceTokens = [], targetTokens = []) {
  const targetSet = new Set(targetTokens);
  return sourceTokens.filter((token) => targetSet.has(token)).length;
}

function isModelAnswerUsable(answer, citations = [], question = "") {
  const normalizedAnswer = normalizeWhitespace(answer);

  if (
    !normalizedAnswer ||
    normalizedAnswer.length < 24 ||
    normalizedAnswer.length > 900
  ) {
    return false;
  }

  if (/<question>|<answer>/i.test(normalizedAnswer)) {
    return false;
  }

  const allowedArticleNumbers = new Set(
    citations.map((citation) => String(citation.article_number)),
  );
  const referencedArticleNumbers = [
    ...normalizedAnswer.matchAll(/\barticle\s+(\d+)\b/gi),
  ].map((match) => match[1]);

  if (
    !referencedArticleNumbers.every((number) =>
      allowedArticleNumbers.has(number),
    )
  ) {
    return false;
  }

  const answerTokens = tokenizeForValidation(normalizedAnswer);
  const questionTokens = tokenizeForValidation(question);
  const primaryCitationTokens = tokenizeForValidation(citations[0]?.excerpt || "");

  return (
    countOverlap(answerTokens, questionTokens) >= 1 &&
    countOverlap(answerTokens, primaryCitationTokens) >= 1
  );
}

module.exports = {
  CONTRACT_QA_DISCLAIMER,
  LEGAL_QA_DISCLAIMER,
  buildContractAnswer,
  buildFallbackAnswer,
  detectNeedsLawyer,
  isModelAnswerUsable,
  searchContractClauses,
  summarizeArticle,
};
