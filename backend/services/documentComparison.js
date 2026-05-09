const { splitIntoClauses, labelClause } = require("../controllers/upload/clauses");
const {
  assessClauseRisk,
  getOverallRiskLevel,
} = require("../controllers/upload/riskAnalysis");

const RISK_RANK = {
  Low: 1,
  Medium: 2,
  High: 3,
};

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

function normalizeWhitespace(text = "") {
  return String(text).replace(/\s+/g, " ").trim();
}

function normalizeForComparison(text = "") {
  return normalizeWhitespace(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text = "") {
  return normalizeForComparison(text)
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function getPreview(text, maxLength = 220) {
  const normalized = normalizeWhitespace(text);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

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

function containmentSimilarity(leftTokens, rightTokens) {
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);

  if (leftSet.size === 0 || rightSet.size === 0) {
    return 0;
  }

  const sharedCount = [...leftSet].filter((token) => rightSet.has(token)).length;
  return sharedCount / Math.min(leftSet.size, rightSet.size);
}

function buildClauseObjects(documentText) {
  const clauseTexts = splitIntoClauses(documentText);

  return clauseTexts.map((clauseText, index) => {
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

function scoreClauseMatch(leftClause, rightClause) {
  if (leftClause.normalizedText === rightClause.normalizedText) {
    return 1;
  }

  const jaccard = jaccardSimilarity(leftClause.tokens, rightClause.tokens);
  const containment = containmentSimilarity(leftClause.tokens, rightClause.tokens);

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

function buildComparisonItems(originalClauses, revisedClauses) {
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

function buildComparisonSummary({
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

  const summary = `Compared ${originalClauses.length} section${
    originalClauses.length === 1 ? "" : "s"
  } from ${originalName} with ${revisedClauses.length} section${
    revisedClauses.length === 1 ? "" : "s"
  } from ${revisedName}. Found ${counts.modified} modified, ${counts.added} added, ${counts.removed} removed, and ${counts.unchanged} unchanged section${
    comparisonItems.length === 1 ? "" : "s"
  }.`;

  return {
    summary,
    counts,
    originalRiskLevel,
    revisedRiskLevel,
    higherRiskChanges,
  };
}

function compareDocuments({
  originalName,
  originalText,
  revisedName,
  revisedText,
}) {
  const normalizedOriginalText = normalizeWhitespace(originalText);
  const normalizedRevisedText = normalizeWhitespace(revisedText);
  const originalClauses = buildClauseObjects(normalizedOriginalText);
  const revisedClauses = buildClauseObjects(normalizedRevisedText);
  const comparisonItems = buildComparisonItems(originalClauses, revisedClauses);
  const overview = buildComparisonSummary({
    originalName,
    revisedName,
    originalClauses,
    revisedClauses,
    comparisonItems,
  });

  return {
    originalDocument: {
      name: originalName,
      textPreview: getPreview(normalizedOriginalText, 1000),
      clauseCount: originalClauses.length,
      riskLevel: overview.originalRiskLevel,
    },
    revisedDocument: {
      name: revisedName,
      textPreview: getPreview(normalizedRevisedText, 1000),
      clauseCount: revisedClauses.length,
      riskLevel: overview.revisedRiskLevel,
    },
    summary: overview.summary,
    counts: overview.counts,
    higherRiskChanges: overview.higherRiskChanges,
    comparisonItems,
  };
}

module.exports = {
  compareDocuments,
};
