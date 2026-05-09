const {
  LEGAL_QA_DISCLAIMER,
  buildFallbackAnswer,
  detectNeedsLawyer,
  isModelAnswerUsable,
} = require("../services/legalQaAnswerBuilder");
const {
  generateModelAnswer,
  hasLocalQaModel,
} = require("../services/legalQaModel");
const { searchLegalArticles } = require("../services/legalQaSearch");

exports.askLegalQuestion = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();

    if (!question) {
      return res.status(400).json({ error: "Please enter a legal question." });
    }

    const searchResult = searchLegalArticles(question);
    const fallbackAnswer = buildFallbackAnswer(searchResult);
    const needsLawyer = detectNeedsLawyer(question, searchResult.citations);
    const topCitation = searchResult.citations[0] || null;

    let answer = fallbackAnswer;
    let answerSource = "fallback";
    let modelWarning = "";

    if (
      hasLocalQaModel() &&
      searchResult.citations.length > 0 &&
      searchResult.confidence !== "low" &&
      (topCitation?.excerpt.length || 0) >= 140
    ) {
      try {
        const modelAnswer = await generateModelAnswer({
          question,
          citations: searchResult.citations,
        });

        if (
          isModelAnswerUsable(
            modelAnswer,
            searchResult.citations,
            question,
          )
        ) {
          answer = modelAnswer;
          answerSource = "model";
        } else {
          modelWarning =
            "Local model answer was discarded because it drifted from the cited articles.";
        }
      } catch (error) {
        modelWarning = error.message;
      }
    }

    return res.json({
      question,
      answer,
      answerSource,
      confidence: searchResult.confidence,
      needsLawyer,
      citations: searchResult.citations.map((citation) => ({
        article_number: citation.article_number,
        article_label: citation.article_label,
        chapter: citation.chapter,
        excerpt: citation.excerpt,
        match_score: citation.match_score,
        source_document: citation.source_document,
      })),
      disclaimer: LEGAL_QA_DISCLAIMER,
      lawyerSuggestion: needsLawyer
        ? "This question may depend on facts or remedies that are safer to review with a licensed lawyer."
        : "",
      modelWarning:
        process.env.NODE_ENV !== "production" ? modelWarning : undefined,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Could not answer this legal question.",
    });
  }
};
