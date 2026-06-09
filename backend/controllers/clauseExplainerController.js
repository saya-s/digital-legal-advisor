const { CONTRACT_QA_DISCLAIMER } = require("../services/legalQaAnswerBuilder");
const { normalizeWhitespace } = require("../services/legalQaDataset");
const {
  generateGroundedClauseExplanation,
  hasOpenAiLegalQa,
  isGroundedClauseExplanationUsable,
} = require("../services/legalQaOpenAiService");
const { searchLegalArticles } = require("../services/legalQaSearch");

const MAX_CLAUSE_SEARCH_TEXT_CHARS = 1800;

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
      { limit: 4 },
    );

    if (searchResult.citations.length === 0) {
      return res.status(422).json({
        error: "No relevant Iraqi law sections were found for this clause yet.",
      });
    }

    const citations = searchResult.citations.map(toClientCitation);
    const modelAnswer = await generateGroundedClauseExplanation({
      clause,
      citations: searchResult.citations,
      contractContext,
    });

    if (!isGroundedClauseExplanationUsable(modelAnswer, searchResult.citations)) {
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
