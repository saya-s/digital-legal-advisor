// Clean extra spacing before text is sent to the Q&A page.
function normalizeText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

// Keep the full document context within a useful size.
function truncateText(text, maxLength = 12000) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

// Keep each clause short enough for the Q&A request.
function truncateClauseText(text, maxLength = 700) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

// Prepare an analyzed contract to be opened in the legal Q&A page.
export function buildContractQaState({
  analysisResult,
  selectedFileName = "",
  selectedClause = null,
  analysisId = null,
  maxClauses = 60,
}) {
  // Return null when there is no usable analysis to pass to Q&A.
  if (!analysisResult || typeof analysisResult !== "object") {
    return null;
  }

  // If clause data is missing, use an empty list so the page does not break.
  const clauses = Array.isArray(analysisResult.clauses)
    ? analysisResult.clauses
    : [];
  const highRiskCount = clauses.filter((clause) => clause.risk === "High").length;
  const mediumRiskCount = clauses.filter((clause) => clause.risk === "Medium").length;
  const documentName =
    // Use the first available document name, then a readable fallback.
    analysisResult.documentName || selectedFileName || "Uploaded contract";

  return {
    analysisId,
    contractContext: {
      documentName,
      summary: analysisResult.summary || "",
      riskLevel: analysisResult.riskLevel || analysisResult.risk_level || "Low",
      highRiskCount,
      mediumRiskCount,
      totalClauses: clauses.length,
      documentText: truncateText(
        analysisResult.documentText || analysisResult.document_text || "",
      ),
      // Limit the clause count, then create the smaller shape needed by Q&A.
      clauses: clauses.slice(0, maxClauses).map((clause, index) => ({
        id: clause.id || index + 1,
        title: clause.title || `Clause ${index + 1}`,
        label: clause.label || "General",
        risk: clause.risk || "Low",
        riskScore: Number(clause.riskScore) || 0,
        riskReasons: Array.isArray(clause.riskReasons)
          ? clause.riskReasons.slice(0, 3)
          : [],
        explanation: truncateClauseText(clause.explanation, 320),
        text: truncateClauseText(clause.text, 700),
      })),
    },
    // Start with the selected clause, then a risky clause, or a general question.
    starterQuestion: selectedClause
      ? `Can you explain the ${selectedClause.title} in this contract?`
      : highRiskCount > 0
        ? "Which clauses are highest risk in this contract?"
        : "What are the most important clauses in this contract?",
  };
}
