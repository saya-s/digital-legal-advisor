const { CONTRACT_QA_DISCLAIMER } = require("../services/legalQaAnswerBuilder");
const { normalizeWhitespace } = require("../services/legalQaDataset");
const {
  generateGroundedClauseExplanation,
  hasOpenAiLegalQa,
} = require("../services/legalQaOpenAiService");

function normalizeClausePayload(clause = {}) {
  const text = normalizeWhitespace(clause?.text || "");

  if (!text) {
    return null;
  }

  return {
    id: clause?.id || null,
    text,
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

    if (!hasOpenAiLegalQa()) {
      return res.status(503).json({
        error: "AI clause explanation is not configured on the server.",
      });
    }

    const contractContext = {
      documentName: normalizeWhitespace(req.body?.documentName || ""),
      summary: normalizeWhitespace(req.body?.summary || ""),
    };

    const modelAnswer = await generateGroundedClauseExplanation({
      clause,
      contractContext,
    });

    return res.json({
      clauseId: clause.id,
      explanation: modelAnswer.answer,
      answerSource: "external_model",
      disclaimer: CONTRACT_QA_DISCLAIMER,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not explain this clause.",
    });
  }
};
