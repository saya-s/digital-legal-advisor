// Reuse clause splitting and clause labeling from the upload-analysis pipeline.
const { splitIntoClauses, labelClause } = require("../controllers/upload/clauses");
// Reuse the same risk scoring logic so comparison results stay consistent with analysis results.
const {
  assessClauseRisk,
  getOverallRiskLevel,
} = require("../controllers/upload/riskAnalysis");

// Numeric ordering helps us describe whether a clause became riskier or safer.
const RISK_RANK = {
  Low: 1,
  Medium: 2,
  High: 3,
};

// Very common words are ignored so clause matching focuses on legal meaning instead of filler.
const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "any",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "shall",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

// Clean up spacing so comparisons work on a consistent text format.
function normalizeWhitespace(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

// Lowercase and strip punctuation so similar clauses still match despite formatting differences.
function normalizeForComparison(text = "") {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Break text into useful searchable tokens for similarity scoring.
function tokenize(text = "") {
  return normalizeForComparison(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

// Build a short readable preview used in the comparison result cards.
function getPreview(text, maxLength = 220) {
  const normalized = normalizeWhitespace(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

// Describe whether risk moved up, down, or stayed the same between matched clauses.
function describeRiskShift(fromRisk, toRisk) {
  const fromRank = RISK_RANK[fromRisk] || 0;
  const toRank = RISK_RANK[toRisk] || 0;

  if (toRank > fromRank) {
    return "higher";
  }

  if (toRank < fromRank) {
    return "lower";
  }

  return "same";
}

// Jaccard checks how much token overlap exists relative to both clauses together.
function jaccardSimilarity(leftTokens, rightTokens) {
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  const sharedCount = [...leftSet].filter((token) => rightSet.has(token)).length;
  const unionCount = new Set([...leftSet, ...rightSet]).size;

  return unionCount === 0 ? 0 : sharedCount / unionCount;
}

// Containment checks whether the smaller clause is mostly covered by the larger one.
function containmentSimilarity(leftTokens, rightTokens) {
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  const sharedCount = [...leftSet].filter((token) => rightSet.has(token)).length;
  return sharedCount / Math.min(leftSet.size, rightSet.size);
}

// Convert raw document text into structured clauses enriched with labels, risk, and comparison tokens.
function buildClauseObjects(documentText) {
  const clauseTexts = splitIntoClauses(documentText);

  return clauseTexts.map((clauseText, index) => {
    // Neighbor text gives both the labeler and risk checker a little more context.
    const previousClause = clauseTexts[index - 1] || "";
    const nextClause = clauseTexts[index + 1] || "";
    const clauseContext = `${previousClause} ${nextClause}`;
    const label = labelClause(clauseText, clauseContext);
    const riskAssessment = assessClauseRisk(clauseText, label, clauseContext);

    return {
      id: index + 1,
      title: `${label} Clause ${index + 1}`,
      text: normalizeWhitespace(clauseText),
      label,
      risk: riskAssessment.risk,
      riskScore: riskAssessment.score,
      riskReasons: riskAssessment.reasons,
      preview: getPreview(clauseText),
      normalizedText: normalizeForComparison(clauseText),
      tokens: tokenize(clauseText),
    };
  });
}

// Score how likely two clauses are to represent the same idea across document versions.
function scoreClauseMatch(leftClause, rightClause) {
  // Exact normalized text is treated as a perfect match immediately.
  if (leftClause.normalizedText === rightClause.normalizedText) {
    return 1;
  }

  const jaccard = jaccardSimilarity(leftClause.tokens, rightClause.tokens);
  const containment = containmentSimilarity(leftClause.tokens, rightClause.tokens);

  // Blend multiple signals: token overlap, smaller-clause coverage, matching labels, and similar openings.
  let score = jaccard * 0.6 + containment * 0.25;

  if (leftClause.label === rightClause.label) {
    score += 0.15;
  }

  if (
    leftClause.preview.slice(0, 50).toLowerCase() ===
    rightClause.preview.slice(0, 50).toLowerCase()
  ) {
    score += 0.1;
  }

  return Math.min(score, 1);
}

// Human-readable explanations used by the UI for each comparison item.
function summarizeChange(status, leftClause, rightClause) {
  if (status === "unchanged") {
    return "This clause appears materially unchanged between the two documents.";
  }

  if (status === "modified") {
    if (!leftClause || !rightClause) {
      return "This clause changed between the two documents.";
    }

    if (leftClause.risk !== rightClause.risk) {
      return `The clause changed and the risk moved from ${leftClause.risk} to ${rightClause.risk}.`;
    }

    return "The clause covers a similar topic in both documents, but the wording changed.";
  }

  if (status === "added") {
    return "This clause appears only in the new comparison document.";
  }

  return "This clause appears in the original document but not in the comparison document.";
}

// Pair each original clause with its best revised match, then mark the rest as added or removed.
function buildComparisonItems(originalClauses, revisedClauses) {
  // Track which revised clauses are still available so one clause is not matched multiple times.
  const unmatchedRevisedIds = new Set(revisedClauses.map((clause) => clause.id));
  const comparisonItems = [];

  originalClauses.forEach((originalClause) => {
    let bestMatch = null;
    let bestScore = 0;

    revisedClauses.forEach((revisedClause) => {
      if (!unmatchedRevisedIds.has(revisedClause.id)) {
        return;
      }

      const score = scoreClauseMatch(originalClause, revisedClause);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = revisedClause;
      }
    });

    // If similarity is too weak, treat the original clause as removed.
    if (!bestMatch || bestScore < 0.38) {
      comparisonItems.push({
        id: `removed-${originalClause.id}`,
        status: "removed",
        similarity: 0,
        riskShift: "same",
        changeSummary: summarizeChange("removed"),
        originalClause,
        revisedClause: null,
      });
      return;
    }

    unmatchedRevisedIds.delete(bestMatch.id);

    // Very high similarity or identical normalized text counts as unchanged; otherwise it is modified.
    const status =
      originalClause.normalizedText === bestMatch.normalizedText || bestScore >= 0.92
        ? "unchanged"
        : "modified";

    comparisonItems.push({
      id: `matched-${originalClause.id}-${bestMatch.id}`,
      status,
      similarity: Number(bestScore.toFixed(2)),
      riskShift: describeRiskShift(originalClause.risk, bestMatch.risk),
      changeSummary: summarizeChange(status, originalClause, bestMatch),
      originalClause,
      revisedClause: bestMatch,
    });
  });

  revisedClauses
    .filter((clause) => unmatchedRevisedIds.has(clause.id))
    .forEach((revisedClause) => {
      // Any revised clause left unmatched after pairing is considered newly added.
      comparisonItems.push({
        id: `added-${revisedClause.id}`,
        status: "added",
        similarity: 0,
        riskShift: revisedClause.risk === "Low" ? "same" : "higher",
        changeSummary: summarizeChange("added"),
        originalClause: null,
        revisedClause,
      });
    });

  // Show the most important differences first: modified, then added, removed, and finally unchanged.
  return comparisonItems.sort((left, right) => {
    const statusPriority = {
      modified: 1,
      added: 2,
      removed: 3,
      unchanged: 4,
    };

    if (statusPriority[left.status] !== statusPriority[right.status]) {
      return statusPriority[left.status] - statusPriority[right.status];
    }

    return right.similarity - left.similarity;
  });
}

// Build the top-level summary and statistics shown above the detailed comparison list.
function buildComparisonSummary({
  comparisonMode,
  documentLabels,
  originalName,
  revisedName,
  originalClauses,
  revisedClauses,
  comparisonItems,
}) {
  const counts = comparisonItems.reduce(
    (totals, item) => {
      totals[item.status] += 1;
      return totals;
    },
    { unchanged: 0, modified: 0, added: 0, removed: 0 },
  );

  const originalRiskLevel = getOverallRiskLevel(originalClauses);
  const revisedRiskLevel = getOverallRiskLevel(revisedClauses);
  const higherRiskChanges = comparisonItems.filter(
    (item) => item.status !== "unchanged" && item.riskShift === "higher",
  ).length;
  const originalLabel = normalizeWhitespace(documentLabels?.original || "Original");
  const revisedLabel = normalizeWhitespace(documentLabels?.revised || "Revised");
  const originalDescriptor = `${originalName} (${originalLabel.toLowerCase()})`;
  const revisedDescriptor = `${revisedName} (${revisedLabel.toLowerCase()})`;

  // Summarize how many sections changed and how the two documents compare overall.
  let summary = `Compared ${originalClauses.length} section${
    originalClauses.length === 1 ? "" : "s"
  } from ${originalDescriptor} with ${revisedClauses.length} section${
    revisedClauses.length === 1 ? "" : "s"
  } from ${revisedDescriptor}. Found ${counts.modified} modified, ${counts.added} added, ${counts.removed} removed, and ${counts.unchanged} unchanged section${
    comparisonItems.length === 1 ? "" : "s"
  }.`;

  if (comparisonMode === "template") {
    summary +=
      " Use removed sections to spot clauses that appear in the template but not in the uploaded contract, and added sections to spot extra contract wording not found in the template.";
  }

  return {
    summary,
    counts,
    originalRiskLevel,
    revisedRiskLevel,
    higherRiskChanges,
  };
}

// Main entry point used by controllers to compare two documents or a document against a template.
function compareDocuments({
  comparisonMode = "version",
  documentLabels,
  originalName,
  originalText,
  originalDocumentMeta = {},
  revisedName,
  revisedText,
  revisedDocumentMeta = {},
}) {
  // Normalize raw input text before splitting it into clauses.
  const normalizedOriginalText = normalizeWhitespace(originalText);
  const normalizedRevisedText = normalizeWhitespace(revisedText);
  const originalClauses = buildClauseObjects(normalizedOriginalText);
  const revisedClauses = buildClauseObjects(normalizedRevisedText);
  // Build clause-by-clause matches first, then derive the overall summary from them.
  const comparisonItems = buildComparisonItems(originalClauses, revisedClauses);
  const normalizedDocumentLabels = {
    original: normalizeWhitespace(documentLabels?.original || "Original"),
    revised: normalizeWhitespace(documentLabels?.revised || "Revised"),
  };
  const overview = buildComparisonSummary({
    comparisonMode,
    documentLabels: normalizedDocumentLabels,
    originalName,
    revisedName,
    originalClauses,
    revisedClauses,
    comparisonItems,
  });

  return {
    comparisonMode,
    documentLabels: normalizedDocumentLabels,
    originalDocument: {
      // Include a short preview and risk summary so the frontend can render document cards.
      name: originalName,
      textPreview: getPreview(normalizedOriginalText, 1000),
      clauseCount: originalClauses.length,
      riskLevel: overview.originalRiskLevel,
      ...originalDocumentMeta,
    },
    revisedDocument: {
      name: revisedName,
      textPreview: getPreview(normalizedRevisedText, 1000),
      clauseCount: revisedClauses.length,
      riskLevel: overview.revisedRiskLevel,
      ...revisedDocumentMeta,
    },
    summary: overview.summary,
    counts: overview.counts,
    higherRiskChanges: overview.higherRiskChanges,
    comparisonItems,
  };
}

module.exports = {
  // Export a single public service function; helper functions stay internal to this module.
  compareDocuments,
};
