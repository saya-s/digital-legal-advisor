// Database access is used here to load saved contract analyses by id.
const db = require("../db");
// Reuse helpers that build answers, disclaimers, clause search results, and lawyer warnings.
const {
  CONTRACT_QA_DISCLAIMER,
  LEGAL_QA_DISCLAIMER,
  buildContractAnswer,
  buildFallbackAnswer,
  detectNeedsLawyer,
  searchContractClauses,
} = require("../services/legalQaAnswerBuilder");
const {
  generateGroundedAnswer,
  hasOpenAiLegalQa,
} = require("../services/legalQaOpenAiService");
// Search the stored Iraqi-law dataset for matching articles and sections.
const { searchLegalArticles } = require("../services/legalQaSearch");
// Safely parse JSON saved in analysis_history rows.
const parseJsonObject = require("../utils/parseJsonObject");

// Normalize contract context received either from the frontend or a saved analysis row.
function normalizeContractContext(contractContext = {}, analysisId = null) {
  // Keep clauses in a safe array so later steps can count and search them.
  const clauses = Array.isArray(contractContext?.clauses)
    ? contractContext.clauses
    : [];

  // Recalculate risk counts if the caller did not provide them directly.
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

// Read a saved analysis id safely from the request body.
function parseAnalysisId(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

// Load one saved contract analysis from history so Q&A can continue from an older analysis.
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

  // Restore the full structured analysis from the JSON column.
  const savedAnalysis = parseJsonObject(row.analysis_json) || {};

  // Q&A history rows are not valid contract-analysis sources for contract chat context.
  if (savedAnalysis.entryType === "qa") {
    return null;
  }

  // Return the saved analysis in the same normalized shape used by live upload analysis.
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

// Decide whether the request contains enough contract data to use the contract-Q&A path.
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

// Build a short lawyer-escalation message when the contract answer suggests extra risk.
function buildContractLawyerSuggestion(contractMatches = []) {
  const highRiskMatch = contractMatches.find((match) => match.risk === "High");

  if (highRiskMatch) {
    return `The uploaded contract includes high-risk wording in ${highRiskMatch.title}, so a lawyer should review it before you rely on that section.`;
  }

  return "This contract question may depend on negotiation strategy, missing facts, or risk allocation that is safer to review with a licensed lawyer.";
}

// Main controller: answer either a contract-specific question or a general Iraqi-law question.
exports.askLegalQuestion = async (req, res) => {
  try {
    // STEP 1: Read the user question and any optional saved-analysis context.
    const question = String(req.body?.question || "").trim();
    const requestedAnalysisId = parseAnalysisId(req.body?.analysisId);
    let contractContext = req.body?.contractContext;

    // A question is always required, no matter which mode is used.
    if (!question) {
      return res.status(400).json({ error: "Please enter a legal question." });
    }

    // STEP 2: If the frontend referenced a saved analysis, load that contract context from history.
    if (requestedAnalysisId) {
      contractContext = await loadSavedAnalysisContractContext(
        req.user.id,
        requestedAnalysisId,
      );

      // The analysis must belong to the signed-in user and must be a real analysis row.
      if (!contractContext) {
        return res.status(404).json({
          error: "The saved analysis could not be found for this account.",
        });
      }
    // Otherwise, accept live contract context sent directly from the frontend.
    } else if (hasContractContext(contractContext)) {
      contractContext = normalizeContractContext(contractContext);
    }

    // PATH A: Contract Q&A uses uploaded/saved contract clauses instead of the law dataset.
    if (hasContractContext(contractContext)) {
      // Search the contract itself for the clauses most relevant to the user's question.
      const contractSearchResult = searchContractClauses(question, contractContext);
      // Keep only the fields the frontend needs to display contract matches.
      const contractMatches = contractSearchResult.matches.map((match) => ({
        id: match.id,
        title: match.title,
        label: match.label,
        risk: match.risk,
        explanation: match.explanation,
        excerpt: match.excerpt,
        match_score: match.match_score,
      }));

      // Build a plain-language answer grounded in the matched contract clauses.
      const answer = buildContractAnswer({
        question,
        contractContext,
        matches: contractMatches,
      });

      // Escalate when the wording is risky or the question sounds like it needs a lawyer.
      const needsLawyer =
        detectNeedsLawyer(question, []) ||
        contractMatches.some((match) => match.risk === "High");

      // Return contract-specific metadata instead of legal citations.
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

    // PATH B: General legal Q&A searches the stored Iraqi-law content.
    const shouldUseOpenAiQa = hasOpenAiLegalQa();
    // Use a slightly larger citation set when an external model is available.
    const searchResult = searchLegalArticles(question, {
      limit: shouldUseOpenAiQa ? 4 : 3,
    });

    // Always build a local fallback answer from the search results.
    const fallbackAnswer = buildFallbackAnswer(searchResult);
    const needsLawyer = detectNeedsLawyer(question, searchResult.citations);

    let answer = fallbackAnswer;
    let answerSource = "fallback";
    let modelWarning = "";

    // If AI is configured and we found citations, ask the external model to answer from those excerpts.
    if (shouldUseOpenAiQa && searchResult.citations.length > 0) {
      try {
        const modelAnswer = await generateGroundedAnswer({
          question,
          citations: searchResult.citations,
        });

        // Only replace the fallback answer if the model returned usable text.
        if (modelAnswer.answer) {
          answer = modelAnswer.answer;
          answerSource = "external_model";
        }
      } catch (error) {
        // Keep the fallback answer and expose the warning only outside production.
        modelWarning = error.message;
      }
    }

    // Return the final general-law answer plus the citations used to ground it.
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
    // Final fallback for database, search, or model errors.
    return res.status(500).json({
      error: error.message || "Could not answer this legal question.",
    });
  }
};
