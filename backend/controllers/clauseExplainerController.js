// Reuse the same disclaimer shown for contract-related AI answers.
const { CONTRACT_QA_DISCLAIMER } = require("../services/legalQaAnswerBuilder");
// Normalize user-provided text before sending it into the explanation flow.
const { normalizeWhitespace } = require("../services/legalQaDataset");
// Generate the grounded clause explanation and check whether the AI feature is configured.
const {
  generateGroundedClauseExplanation,
  hasOpenAiLegalQa,
} = require("../services/legalQaOpenAiService");

// Keep only the clause fields needed by the explanation service.
function normalizeClausePayload(clause = {}) {
  const text = normalizeWhitespace(clause?.text || "");

  // A clause must contain readable text or there is nothing useful to explain.
  if (!text) {
    return null;
  }

  return {
    // Preserve the frontend clause id when available so the response can map back correctly.
    id: clause?.id || null,
    text,
  };
}

// Main controller: explain one selected contract clause in simpler language.
exports.explainClause = async (req, res) => {
  try {
    // STEP 1: Read and normalize the clause the user selected from the UI.
    const clause = normalizeClausePayload(req.body?.clause);

    if (!clause) {
      return res.status(400).json({
        error: "A clause with readable text is required.",
      });
    }

    // STEP 2: Stop early if the AI clause explanation feature is not configured.
    if (!hasOpenAiLegalQa()) {
      return res.status(503).json({
        error: "AI clause explanation is not configured on the server.",
      });
    }

    // STEP 3: Pass small pieces of contract context so the explanation can stay grounded.
    const contractContext = {
      documentName: normalizeWhitespace(req.body?.documentName || ""),
      summary: normalizeWhitespace(req.body?.summary || ""),
    };

    // STEP 4: Ask the OpenAI helper to rewrite the clause in plain language.
    const modelAnswer = await generateGroundedClauseExplanation({
      clause,
      contractContext,
    });

    // STEP 5: Return the explanation with metadata the frontend can display.
    return res.json({
      clauseId: clause.id,
      explanation: modelAnswer.answer,
      answerSource: "external_model",
      disclaimer: CONTRACT_QA_DISCLAIMER,
    });
  } catch (error) {
    // Final fallback for unexpected model or request errors.
    return res.status(500).json({
      error: error.message || "Could not explain this clause.",
    });
  }
};
