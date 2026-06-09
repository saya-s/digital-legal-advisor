const fs = require("fs/promises");
const path = require("path");

const db = require("../db");
const extractTextFromFile = require("../controllers/upload/extractTextFromFile");
const { splitIntoClauses, labelClause } = require("../controllers/upload/clauses");

const MAX_MATCHED_CLAUSES = 3;
const templateIndexCache = new Map();

function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeForSearch(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value = "") {
  return normalizeForSearch(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

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

function scoreSearchableText(text, normalizedQuery, queryTokens) {
  const normalizedText = normalizeForSearch(text);

  if (!normalizedText || !normalizedQuery) {
    return 0;
  }

  let score = 0;
  const uniqueTokens = [...new Set(queryTokens)];

  if (normalizedText === normalizedQuery) {
    score += 18;
  } else if (normalizedText.includes(normalizedQuery)) {
    score += Math.min(12, 6 + normalizedQuery.split(" ").length * 1.5);
  }

  uniqueTokens.forEach((token) => {
    if (!normalizedText.includes(token)) {
      return;
    }

    score += token.length >= 10 ? 3 : token.length >= 6 ? 2.25 : 1.5;
  });

  return Number(score.toFixed(2));
}

function buildSnippet(text, normalizedQuery, queryTokens, maxLength = 220) {
  const normalizedText = normalizeWhitespace(text);

  if (!normalizedText) {
    return "";
  }

  if (!normalizedQuery) {
    return normalizedText.length <= maxLength
      ? normalizedText
      : `${normalizedText.slice(0, maxLength).trim()}...`;
  }

  const lowerText = normalizedText.toLowerCase();
  let matchIndex = lowerText.indexOf(normalizedQuery.toLowerCase());

  if (matchIndex < 0) {
    const fallbackToken = queryTokens.find((token) => lowerText.includes(token));
    matchIndex = fallbackToken ? lowerText.indexOf(fallbackToken) : 0;
  }

  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(normalizedText.length, start + maxLength);

  let snippet = normalizedText.slice(start, end).trim();

  if (start > 0) {
    snippet = `...${snippet}`;
  }

  if (end < normalizedText.length) {
    snippet = `${snippet}...`;
  }

  return snippet;
}

function normalizeClauseRecord(clause, index) {
  const text = normalizeWhitespace(clause?.text || "");

  if (!text) {
    return null;
  }

  const label = normalizeWhitespace(clause?.label || "") || "General";
  const title =
    normalizeWhitespace(clause?.title || "") || `${label} Clause ${index + 1}`;

  return {
    id: clause?.id || index + 1,
    title,
    label,
    risk: normalizeWhitespace(clause?.risk || ""),
    text,
  };
}

function buildClausesFromText(text = "") {
  const normalizedText = normalizeWhitespace(text);

  if (!normalizedText) {
    return [];
  }

  const clauseTexts = splitIntoClauses(normalizedText);

  return clauseTexts
    .map((clauseText, index) => {
      const previousClause = clauseTexts[index - 1] || "";
      const nextClause = clauseTexts[index + 1] || "";
      const clauseContext = `${previousClause} ${nextClause}`;
      const label = labelClause(clauseText, clauseContext);

      return normalizeClauseRecord(
        {
          id: index + 1,
          title: `${label} Clause ${index + 1}`,
          label,
          text: clauseText,
        },
        index,
      );
    })
    .filter(Boolean);
}

function buildMatchedClauseRecord(clause, normalizedQuery, queryTokens) {
  const searchText = `${clause.title} ${clause.label} ${clause.text}`;
  const matchScore = scoreSearchableText(searchText, normalizedQuery, queryTokens);

  if (matchScore <= 0) {
    return null;
  }

  return {
    id: clause.id,
    title: clause.title,
    label: clause.label,
    risk: clause.risk || "",
    snippet: buildSnippet(clause.text, normalizedQuery, queryTokens, 180),
    matchScore,
  };
}

function sortByMatchScore(left, right) {
  if (right.matchScore !== left.matchScore) {
    return right.matchScore - left.matchScore;
  }

  const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  const leftLabel = left.documentName || left.title || "";
  const rightLabel = right.documentName || right.title || "";

  return leftLabel.localeCompare(rightLabel);
}

function getTemplatePreviewUrl(template) {
  return normalizeWhitespace(template?.preview_url || template?.previewUrl || "");
}

function getMimeTypeFromFilePath(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    return "application/pdf";
  }

  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (extension === ".txt") {
    return "text/plain";
  }

  return "application/octet-stream";
}

async function loadTemplateSearchRecord(template) {
  const previewUrl = getTemplatePreviewUrl(template);

  if (!previewUrl) {
    return { text: "", clauses: [] };
  }

  let cachedLoader = templateIndexCache.get(previewUrl);

  if (!cachedLoader) {
    cachedLoader = (async () => {
      const relativePath = previewUrl.replace(/^\/+/, "");
      const absolutePath = path.join(
        __dirname,
        "../../frontend/public",
        relativePath,
      );

      try {
        const buffer = await fs.readFile(absolutePath);
        const text = normalizeWhitespace(
          await extractTextFromFile({
            buffer,
            originalname: path.basename(absolutePath),
            mimetype: getMimeTypeFromFilePath(absolutePath),
          }),
        );

        return {
          text,
          clauses: buildClausesFromText(text),
        };
      } catch (error) {
        console.warn(
          `Could not index template content for ${previewUrl}: ${error.message}`,
        );

        return { text: "", clauses: [] };
      }
    })();

    templateIndexCache.set(previewUrl, cachedLoader);
  }

  return cachedLoader;
}

function buildUploadedDocumentMatch(row, normalizedQuery, queryTokens) {
  const analysis = parseJsonObject(row.analysis_json) || {};

  if (analysis.entryType === "qa") {
    return null;
  }

  const documentText =
    typeof analysis.documentText === "string" ? analysis.documentText : "";
  const normalizedDocumentText = normalizeWhitespace(documentText);
  const storedClauses = Array.isArray(analysis.clauses) ? analysis.clauses : [];
  const clauses =
    storedClauses.length > 0
      ? storedClauses.map(normalizeClauseRecord).filter(Boolean)
      : buildClausesFromText(normalizedDocumentText);
  const matchedClauses = clauses
    .map((clause) =>
      buildMatchedClauseRecord(clause, normalizedQuery, queryTokens),
    )
    .filter(Boolean)
    .sort(sortByMatchScore)
    .slice(0, MAX_MATCHED_CLAUSES);

  const documentSearchText = [
    analysis.documentName,
    row.document_name,
    analysis.summary,
    row.summary,
    normalizedDocumentText,
  ]
    .filter(Boolean)
    .join(" ");
  const documentScore = scoreSearchableText(
    documentSearchText,
    normalizedQuery,
    queryTokens,
  );

  if (documentScore <= 0 && matchedClauses.length === 0) {
    return null;
  }

  const snippetSource =
    matchedClauses[0]?.snippet ||
    buildSnippet(
      normalizedDocumentText || row.summary || row.document_name,
      normalizedQuery,
      queryTokens,
    );

  return {
    id: row.id,
    documentName:
      normalizeWhitespace(analysis.documentName || row.document_name) ||
      "Untitled document",
    riskLevel:
      normalizeWhitespace(analysis.riskLevel || row.risk_level) || "Low",
    summary: normalizeWhitespace(analysis.summary || row.summary || ""),
    snippet: snippetSource,
    matchedClauses,
    matchScore: Number(
      (
        documentScore +
        matchedClauses.reduce((total, clause) => total + clause.matchScore, 0)
      ).toFixed(2),
    ),
    totalClauses: clauses.length,
    createdAt: row.created_at,
  };
}

async function searchUploadedDocumentMatches(userId, query, options = {}) {
  const normalizedQuery = normalizeWhitespace(query);

  if (!userId || !normalizedQuery) {
    return [];
  }

  const queryTokens = tokenize(normalizedQuery);
  const limit = options.limit || 6;
  const [rows] = await db.query(
    `SELECT id, document_name, risk_level, summary, analysis_json, created_at
     FROM analysis_history
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );

  return rows
    .map((row) => buildUploadedDocumentMatch(row, normalizedQuery, queryTokens))
    .filter(Boolean)
    .sort(sortByMatchScore)
    .slice(0, limit);
}

async function searchTemplateContentMatches(templates, query, options = {}) {
  const normalizedQuery = normalizeWhitespace(query);

  if (!normalizedQuery || !Array.isArray(templates) || templates.length === 0) {
    return [];
  }

  const queryTokens = tokenize(normalizedQuery);
  const limit = options.limit || templates.length;
  const templateResults = await Promise.all(
    templates.map(async (template) => {
      const searchRecord = await loadTemplateSearchRecord(template);
      const matchedClauses = searchRecord.clauses
        .map((clause) =>
          buildMatchedClauseRecord(clause, normalizedQuery, queryTokens),
        )
        .filter(Boolean)
        .sort(sortByMatchScore)
        .slice(0, MAX_MATCHED_CLAUSES);

      const searchText = [
        template.title,
        template.description,
        searchRecord.text,
      ]
        .filter(Boolean)
        .join(" ");
      const metadataScore = scoreSearchableText(
        searchText,
        normalizedQuery,
        queryTokens,
      );

      if (metadataScore <= 0 && matchedClauses.length === 0) {
        return null;
      }

      const previewUrl = getTemplatePreviewUrl(template);
      const snippet =
        matchedClauses[0]?.snippet ||
        buildSnippet(
          searchRecord.text || template.description || template.title,
          normalizedQuery,
          queryTokens,
        );

      return {
        templateId: template.id,
        title: normalizeWhitespace(template.title || "") || "Untitled template",
        category:
          normalizeWhitespace(template.category || "") || "Uncategorized",
        description: normalizeWhitespace(template.description || ""),
        previewUrl,
        snippet,
        matchedClauses,
        matchScore: Number(
          (
            metadataScore +
            matchedClauses.reduce((total, clause) => total + clause.matchScore, 0)
          ).toFixed(2),
        ),
        totalClauses: searchRecord.clauses.length,
        template: {
          ...template,
          preview_url: previewUrl,
        },
      };
    }),
  );

  return templateResults.filter(Boolean).sort(sortByMatchScore).slice(0, limit);
}

module.exports = {
  loadTemplateSearchRecord,
  searchTemplateContentMatches,
  searchUploadedDocumentMatches,
};
