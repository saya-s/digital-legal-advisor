const db = require("../db");
const {
  CONTRACT_QA_DISCLAIMER,
  LEGAL_QA_DISCLAIMER,
  buildContractAnswer,
  buildFallbackAnswer,
  detectNeedsLawyer,
  isModelAnswerUsable,
  searchContractClauses,
} = require("../services/legalQaAnswerBuilder");
const {
  generateModelAnswer,
  hasLocalQaModel,
} = require("../services/legalQaModel");
const {
  generateGroundedAnswer,
  hasOpenAiLegalQa,
  isGroundedAnswerUsable,
} = require("../services/legalQaOpenAiService");
const { searchLegalArticles } = require("../services/legalQaSearch");

function parseJsonObject(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function normalizeContractContext(contractContext = {}, analysisId = null) {
  const clauses = Array.isArray(contractContext?.clauses)
    ? contractContext.clauses
    : [];
  const highRiskCount =
    Number(contractContext?.highRiskCount) ||
    clauses.filter((clause) => clause?.risk === "High").length;
  const mediumRiskCount =
    Number(contractContext?.mediumRiskCount) ||
    clauses.filter((clause) => clause?.risk === "Medium").length;

  return {
    analysisId,
    documentName: String(contractContext?.documentName || "Uploaded contract").trim(),
    summary: String(contractContext?.summary || "").trim(),
    riskLevel: String(contractContext?.riskLevel || "Low").trim(),
    highRiskCount,
    mediumRiskCount,
    totalClauses: Number(contractContext?.totalClauses) || clauses.length,
    documentText:
      typeof contractContext?.documentText === "string"
        ? contractContext.documentText
        : "",
    clauses,
  };
}

function parseAnalysisId(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

async function loadSavedAnalysisContractContext(userId, analysisId) {
  const [rows] = await db.query(
    `SELECT id, document_name, risk_level, summary, analysis_json
     FROM analysis_history
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [analysisId, userId],
  );
  const row = rows[0];

  if (!row) {
    return null;
  }

  const savedAnalysis = parseJsonObject(row.analysis_json) || {};

  return normalizeContractContext(
    {
      ...savedAnalysis,
      documentName:
        savedAnalysis.documentName || row.document_name || "Uploaded contract",
      summary: savedAnalysis.summary || row.summary || "",
      riskLevel: savedAnalysis.riskLevel || row.risk_level || "Low",
      clauses: Array.isArray(savedAnalysis.clauses) ? savedAnalysis.clauses : [],
      documentText:
        typeof savedAnalysis.documentText === "string"
          ? savedAnalysis.documentText
          : "",
    },
    row.id,
  );
}

function hasContractContext(contractContext = {}) {
  return Boolean(
    contractContext &&
      (
        (Array.isArray(contractContext.clauses) &&
          contractContext.clauses.length > 0) ||
        (typeof contractContext.documentText === "string" &&
          contractContext.documentText.trim()) ||
        (typeof contractContext.summary === "string" &&
          contractContext.summary.trim())
      ),
  );
}

function buildContractLawyerSuggestion(contractMatches = []) {
  const highRiskMatch = contractMatches.find((match) => match.risk === "High");

  if (highRiskMatch) {
    return `The uploaded contract includes high-risk wording in ${highRiskMatch.title}, so a lawyer should review it before you rely on that section.`;
  }

  return "This contract question may depend on negotiation strategy, missing facts, or risk allocation that is safer to review with a licensed lawyer.";
}

exports.askLegalQuestion = async (req, res) => {
  try {
    const question = String(req.body?.question || "").trim();
    const requestedAnalysisId = parseAnalysisId(req.body?.analysisId);
    let contractContext = req.body?.contractContext;

    if (!question) {
      return res.status(400).json({ error: "Please enter a legal question." });
    }

    if (requestedAnalysisId) {
      contractContext = await loadSavedAnalysisContractContext(
        req.user.id,
        requestedAnalysisId,
      );

      if (!contractContext) {
        return res.status(404).json({
          error: "The saved analysis could not be found for this account.",
        });
      }
    } else if (hasContractContext(contractContext)) {
      contractContext = normalizeContractContext(contractContext);
    }

    if (hasContractContext(contractContext)) {
      const contractSearchResult = searchContractClauses(question, contractContext);
      const contractMatches = contractSearchResult.matches.map((match) => ({
        id: match.id,
        title: match.title,
        label: match.label,
        risk: match.risk,
        explanation: match.explanation,
        excerpt: match.excerpt,
        match_score: match.match_score,
      }));
      const answer = buildContractAnswer({
        question,
        contractContext,
        matches: contractMatches,
      });
      const needsLawyer =
        detectNeedsLawyer(question, []) ||
        contractMatches.some((match) => match.risk === "High");

      return res.json({
        question,
        answer,
        answerSource: "contract",
        confidence: contractSearchResult.confidence,
        needsLawyer,
        citations: [],
        analysisId: contractContext.analysisId || null,
        contractDocumentName: contractContext.documentName || "Uploaded contract",
        contractMatches,
        disclaimer: CONTRACT_QA_DISCLAIMER,
        lawyerSuggestion: needsLawyer
          ? buildContractLawyerSuggestion(contractMatches)
          : "",
      });
    }

    const shouldUseOpenAiQa = hasOpenAiLegalQa();
    const searchResult = searchLegalArticles(question, {
      limit: shouldUseOpenAiQa ? 4 : 3,
    });
    const fallbackAnswer = buildFallbackAnswer(searchResult);
    const needsLawyer = detectNeedsLawyer(question, searchResult.citations);
    const topCitation = searchResult.citations[0] || null;

    let answer = fallbackAnswer;
    let answerSource = "fallback";
    let modelWarning = "";

    if (shouldUseOpenAiQa && searchResult.citations.length > 0) {
      try {
        const modelAnswer = await generateGroundedAnswer({
          question,
          citations: searchResult.citations,
        });

        if (isGroundedAnswerUsable(modelAnswer, searchResult.citations)) {
          answer = modelAnswer.answer;
          answerSource = "external_model";
        } else {
          modelWarning =
            "Grounded AI answer was discarded because it did not stay inside the retrieved law sections.";
        }
      } catch (error) {
        modelWarning = error.message;
      }
    } else if (
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
          answerSource = "local_model";
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
