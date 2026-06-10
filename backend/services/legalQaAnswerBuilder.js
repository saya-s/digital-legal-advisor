// Shared text normalizer for legal-article content.
const { normalizeWhitespace } = require("./legalQaDataset");
// Reuse clause splitting and clause labeling from the upload-analysis pipeline.
const { splitIntoClauses, labelClause } = require("../controllers/upload/clauses");
// Reuse risk scoring so contract Q&A stays aligned with upload analysis results.
const { assessClauseRisk } = require("../controllers/upload/riskAnalysis");

// Separate disclaimers are shown depending on whether the answer came from laws or an uploaded contract.
const LEGAL_QA_DISCLAIMER =
  "This is an informational summary based on the legal texts currently loaded in the platform and it is not a substitute for licensed legal advice.";
const CONTRACT_QA_DISCLAIMER =
  "This is an informational summary based on the uploaded contract context and it is not a substitute for licensed legal advice.";

// Questions containing these topics should be treated as more sensitive and may need a lawyer.
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

// Common question words are ignored when matching a question to contract clauses.
const VALIDATION_STOP_WORDS = new Set([
  "all",
  "and",
  "answer",
  "article",
  "articles",
  "because",
  "clause",
  "clauses",
  "contract",
  "contracts",
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
  "part",
  "parts",
  "section",
  "sections",
  "under",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
]);

// Extra keyword boosts help map user wording to common contract clause labels.
const CONTRACT_LABEL_KEYWORDS = {
  confidentiality: ["confidential", "confidentiality", "nda", "disclosure", "secret"],
  "governing law": ["governing law", "jurisdiction", "court", "venue", "arbitration", "dispute"],
  "intellectual property": ["intellectual property", "ownership", "copyright", "trademark", "license"],
  liability: ["liability", "liable", "damages", "indemnity", "loss", "claim"],
  payment: ["payment", "pay", "invoice", "fee", "price", "salary", "wage", "rent"],
  services: ["services", "scope", "deliverables", "performance", "work"],
  termination: ["termination", "terminate", "ended", "ending", "cancel", "breach", "notice", "renewal", "expire"],
};

// Remove leading "Article 5" or "Section 2" style prefixes before summarizing text.
function stripArticlePrefix(text = "") {
  return normalizeWhitespace(
    text.replace(/^(article|section)\s+\d+\s*[-–:]?\s*/i, ""),
  );
}

// Ensure generated answer fragments end like complete sentences.
function ensureSentence(text = "") {
  if (!text) {
    return "";
  }

  return /[.!?]$/.test(text) ? text : `${text}.`;
}

// Lowercase only the first letter so appended phrases read naturally in a sentence.
function lowerCaseFirstLetter(text = "") {
  if (!text) {
    return "";
  }

  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

// Keep generated summaries short enough for chat responses and cards.
function clampText(text, maxLength = 260) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

// Tokenize user questions for clause matching while removing broad filler words.
function tokenizeForContractSearch(text = "") {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(" ")
    .filter(
      (token) => token.length > 2 && !VALIDATION_STOP_WORDS.has(token),
    );
}

// Build a short clause excerpt suitable for answer text.
function buildContractSnippet(text = "", maxLength = 240) {
  return clampText(normalizeWhitespace(text), maxLength);
}

// Build a plain-language article summary, preferring simplified/excerpt fields when available.
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

// Normalize stored clause objects into one consistent shape before matching or answering.
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
    riskScore: Number(clause.riskScore) || 0,
    riskReasons: Array.isArray(clause.riskReasons) ? clause.riskReasons : [],
    explanation,
    text,
  };
}

// Rebuild searchable clauses from raw document text when precomputed clause data is unavailable.
function buildContractClausesFromDocumentText(documentText = "", limit = 60) {
  const normalizedText = normalizeWhitespace(documentText);

  if (!normalizedText) {
    return [];
  }

  const clauseTexts = splitIntoClauses(normalizedText).slice(0, limit);

  return clauseTexts
    .map((clauseText, index) => {
      // Neighbor clauses provide extra context for both labeling and risk analysis.
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
          riskScore: riskAssessment.score,
          riskReasons: riskAssessment.reasons,
          explanation: "",
          text: clauseText,
        },
        index,
      );
    })
    .filter(Boolean);
}

// Detect broad "summarize this contract" style questions.
function questionLooksLikeContractSummary(question = "") {
  return /\b(summary|overview|main points?|what is this contract|what does this contract do|about this contract)\b/i.test(
    question,
  );
}

// Detect questions specifically asking about risk, red flags, or one-sided terms.
function questionLooksLikeContractRisk(question = "") {
  return /\b(risk|risks|risky|riskiest|danger|dangerous|unsafe|red flag|red flags|problem|problems|one sided|one-sided|concern|concerns|high risk|high-risk|highest risk|highest-risk|most risky|most dangerous)\b/i.test(
    question,
  );
}

// Convert risk labels into a sortable priority used by ranking and confidence checks.
function getContractRiskPriority(riskLevel = "Low") {
  if (riskLevel === "High") {
    return 2;
  }

  if (riskLevel === "Medium") {
    return 1;
  }

  return 0;
}

// Score how well one clause matches a contract-related user question.
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

  // Exact phrase containment is the strongest general-purpose signal.
  if (normalizedQuestion && searchText.includes(normalizedQuestion.toLowerCase())) {
    score += 14;
  }

  // Token hits and label-keyword hits catch looser wording.
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

// For risk questions, increase scores for already high-risk clauses with stronger evidence.
function scoreContractRiskQuestionMatch(clause, normalizedQuestion, questionTokens) {
  const baseScore = scoreContractClauseMatch(
    clause,
    normalizedQuestion,
    questionTokens,
  );
  const riskPriority = getContractRiskPriority(clause.risk);
  const riskScore = Number(clause.riskScore || 0);
  const riskReasonCount = Array.isArray(clause.riskReasons)
    ? clause.riskReasons.length
    : 0;

  return Number(
    (
      baseScore +
      riskPriority * 8 +
      Math.min(riskScore, 10) +
      Math.min(riskReasonCount, 2) * 0.8
    ).toFixed(2),
  );
}

// Sort risk-focused results by risk first, then by detailed risk score, then by text relevance.
function compareRiskFocusedMatches(left, right) {
  const riskPriorityDifference =
    getContractRiskPriority(right.risk) - getContractRiskPriority(left.risk);

  if (riskPriorityDifference !== 0) {
    return riskPriorityDifference;
  }

  const riskScoreDifference =
    Number(right.riskScore || 0) - Number(left.riskScore || 0);

  if (riskScoreDifference !== 0) {
    return riskScoreDifference;
  }

  return Number(right.match_score || 0) - Number(left.match_score || 0);
}

// Convert the best clause matches into a simple confidence level for the UI/controller.
function getContractConfidence(matches = [], { isRiskQuestion = false } = {}) {
  if (matches.length === 0) {
    return "low";
  }

  if (isRiskQuestion) {
    const topRiskPriority = getContractRiskPriority(matches[0]?.risk);

    if (topRiskPriority >= 2) {
      return "high";
    }

    if (topRiskPriority >= 1) {
      return "medium";
    }
  }

  const topScore = Number(matches[0]?.match_score || 0);

  if (topScore >= 9) {
    return "high";
  }

  if (topScore >= 4) {
    return "medium";
  }

  return "low";
}

// Find the most relevant contract clauses for a user question using either stored or rebuilt clause data.
function searchContractClauses(question, contractContext = {}, { limit = 3 } = {}) {
  const normalizedQuestion = normalizeWhitespace(question);
  const questionTokens = tokenizeForContractSearch(normalizedQuestion);
  const isRiskQuestion = questionLooksLikeContractRisk(normalizedQuestion);
  // Prefer structured clauses from the saved analysis if present.
  const explicitClauses = Array.isArray(contractContext?.clauses)
    ? contractContext.clauses
        .map(normalizeContractClause)
        .filter(Boolean)
    : [];
  const clauses =
    explicitClauses.length > 0
      ? explicitClauses
      : buildContractClausesFromDocumentText(contractContext?.documentText);

  const scoredClauses = clauses
    .map((clause) => {
      const textMatchScore = scoreContractClauseMatch(
        clause,
        normalizedQuestion,
        questionTokens,
      );

      return {
        ...clause,
        excerpt: buildContractSnippet(clause.text || clause.explanation, 220),
        text_match_score: textMatchScore,
        match_score: isRiskQuestion
          ? scoreContractRiskQuestionMatch(
              clause,
              normalizedQuestion,
              questionTokens,
            )
          : textMatchScore,
      };
    });

  // Risk questions prefer elevated-risk clauses, while normal questions prefer pure text relevance.
  const matches = isRiskQuestion
    ? (() => {
        const directlyRelevantClauses = scoredClauses.filter(
          (clause) => clause.text_match_score > 0,
        );
        const elevatedRelevantClauses = directlyRelevantClauses.filter(
          (clause) => getContractRiskPriority(clause.risk) > 0,
        );
        const elevatedRiskClauses = scoredClauses.filter(
          (clause) => getContractRiskPriority(clause.risk) > 0,
        );
        const candidateClauses =
          elevatedRelevantClauses.length > 0
            ? elevatedRelevantClauses
            : directlyRelevantClauses.length > 0
              ? directlyRelevantClauses
              : elevatedRiskClauses.length > 0
                ? elevatedRiskClauses
            : scoredClauses.filter((clause) => clause.match_score > 0);

        return candidateClauses
          .sort(compareRiskFocusedMatches)
          .slice(0, limit);
      })()
    : scoredClauses
        .filter((clause) => clause.match_score > 0)
        .sort((left, right) => right.match_score - left.match_score)
        .slice(0, limit);

  return {
    matches,
    confidence: getContractConfidence(matches, { isRiskQuestion }),
  };
}

// Turn one matched clause into a short natural-language summary sentence.
function summarizeContractClause(clause) {
  if (clause?.explanation) {
    return ensureSentence(clause.explanation);
  }

  if (clause?.text) {
    return ensureSentence(buildContractSnippet(clause.text, 220));
  }

  return "";
}

// Format a readable list like "A", "A and B", or "A, B, and C".
function formatContractLabelList(items = []) {
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

// Build the final answer text for uploaded-contract questions.
function buildContractAnswer({ question, contractContext = {}, matches = [] }) {
  const documentName =
    normalizeWhitespace(contractContext?.documentName) || "the uploaded contract";
  const summary = normalizeWhitespace(contractContext?.summary || "");
  const riskLevel = normalizeWhitespace(contractContext?.riskLevel || "");
  const highRiskCount = Number(contractContext?.highRiskCount) || 0;
  const mediumRiskCount = Number(contractContext?.mediumRiskCount) || 0;

  // Summary-style questions use the saved overall summary when available.
  if (questionLooksLikeContractSummary(question) && summary) {
    return `Based on ${documentName}, ${ensureSentence(summary)}`;
  }

  // If the user asks about risk but there are no matching clauses, fall back to overall analysis data.
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

  if (questionLooksLikeContractRisk(question)) {
    // For risk questions, answer with the highest-risk relevant clauses first.
    const elevatedRiskMatches = matches.filter(
      (match) => getContractRiskPriority(match.risk) > 0,
    );

    if (elevatedRiskMatches.length === 0) {
      const riskLead = riskLevel
        ? `The current analysis marks ${documentName} as ${riskLevel} risk.`
        : "";
      const countLead =
        highRiskCount || mediumRiskCount
          ? ` I found ${highRiskCount} high-risk and ${mediumRiskCount} medium-risk section${
              highRiskCount + mediumRiskCount === 1 ? "" : "s"
            } in the current analysis.`
          : " I did not find any clauses currently flagged High or Medium risk.";
      const summaryLead = summary ? ` ${ensureSentence(summary)}` : "";

      return `${riskLead}${countLead}${summaryLead}`.trim();
    }

    const topRiskMatches = elevatedRiskMatches.slice(0, 3);
    let answer = `Based on ${documentName}, the riskiest ${
      topRiskMatches.length === 1 ? "section is" : "sections are"
    } ${formatContractLabelList(topRiskMatches.map((match) => match.title))}.`;

    topRiskMatches.slice(0, 2).forEach((match) => {
      answer += ` ${match.title} is marked ${match.risk} risk. ${summarizeContractClause(
        match,
      )}`;
    });

    if (highRiskCount || mediumRiskCount) {
      answer += ` I found ${highRiskCount} high-risk and ${mediumRiskCount} medium-risk section${
        highRiskCount + mediumRiskCount === 1 ? "" : "s"
      } in the current analysis.`;
    }

    if (riskLevel) {
      answer += ` Overall, this contract is currently flagged as ${riskLevel} risk.`;
    }

    return answer;
  }

  // For ordinary clause questions, return the closest section plus a second one if it is strong enough.
  if (matches.length === 0) {
    if (summary) {
      return `Based on ${documentName}, ${ensureSentence(
        summary,
      )} I could not find a specific clause in the uploaded contract that clearly matches that question. Try asking about payment, termination, liability, confidentiality, governing law, or the highest-risk clauses.`;
    }

    return "I could not find a specific clause in the uploaded contract that clearly matches that question. Try asking about payment, termination, liability, confidentiality, governing law, or the highest-risk clauses.";
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

// Format article references in a natural-language list for fallback legal answers.
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

// Build the legal-text fallback answer when the system only has article citations to rely on.
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

  // If confidence is lower, mention more than one likely provision instead of sounding overly certain.
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

// Simple safety heuristic: certain topics should nudge the user toward human legal help.
function detectNeedsLawyer(question, citations = []) {
  const riskText = normalizeWhitespace(question);

  return LAWYER_ESCALATION_PATTERNS.some((pattern) => pattern.test(riskText));
}

module.exports = {
  // Export both contract-answer and legal-text-answer helpers for the QA controller layer.
  CONTRACT_QA_DISCLAIMER,
  LEGAL_QA_DISCLAIMER,
  buildContractAnswer,
  buildFallbackAnswer,
  detectNeedsLawyer,
  searchContractClauses,
  summarizeArticle,
};
