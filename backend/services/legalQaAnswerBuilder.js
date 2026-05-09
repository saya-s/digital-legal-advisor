const { normalizeWhitespace } = require("./legalQaDataset");

const LEGAL_QA_DISCLAIMER =
  "This is an informational summary based on the loaded Iraq labour-law texts and it is not a substitute for licensed legal advice.";

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
  "labour",
  "law",
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
  "worker",
  "workers",
]);

function stripArticlePrefix(text = "") {
  return normalizeWhitespace(
    text.replace(/^article\s+\d+\s*[-–:]?\s*/i, ""),
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

function formatArticleList(citations = []) {
  const labels = citations.map((citation) => citation.article_label);

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
}) {
  if (citations.length === 0) {
    return "I could not find a clear answer in the Iraq labour-law articles currently loaded. Try rephrasing the question or ask a lawyer for a case-specific review.";
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
    return `Based on ${citations[0].article_label}, ${primarySummary}`;
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
  LEGAL_QA_DISCLAIMER,
  buildFallbackAnswer,
  detectNeedsLawyer,
  isModelAnswerUsable,
  summarizeArticle,
};
