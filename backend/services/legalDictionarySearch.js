const db = require("../db");
const {
  searchTemplateContentMatches,
  searchUploadedDocumentMatches,
} = require("./contractContentSearch");
const { summarizeArticle } = require("./legalQaAnswerBuilder");
const { searchLegalArticles } = require("./legalQaSearch");

const SUGGESTED_QUERIES = [
  "equal before the law",
  "official languages",
  "foreign investor",
  "bank license",
  "retirement pension",
  "termination clause",
];

const GLOSSARY_ENTRIES = [
  {
    id: "termination-clause",
    term: "Termination clause",
    category: "Contract clause",
    plainMeaning:
      "A section that explains how and when one or both sides can end the agreement.",
    whyItMatters:
      "It can decide how much notice is required, whether money is still owed, and whether one side can end the deal too easily.",
    keywords: ["termination", "terminate", "end agreement", "notice", "cancellation"],
    relatedSearch: "termination",
  },
  {
    id: "payment-clause",
    term: "Payment clause",
    category: "Contract clause",
    plainMeaning:
      "A section that says what must be paid, when it must be paid, and what happens if payment is late.",
    whyItMatters:
      "Late fees, penalties, and unclear payment timing can create unexpected financial risk.",
    keywords: ["payment", "pay", "fee", "salary", "wage", "late fee"],
    relatedSearch: "wage",
  },
  {
    id: "confidentiality",
    term: "Confidentiality",
    category: "Contract clause",
    plainMeaning:
      "A promise not to share private business, personal, or commercial information without permission.",
    whyItMatters:
      "It affects what information can be used, disclosed, or kept after the contract ends.",
    keywords: ["confidentiality", "confidential", "non-disclosure", "nda", "secret"],
    relatedSearch: "confidentiality",
  },
  {
    id: "indemnity",
    term: "Indemnity",
    category: "Contract clause",
    plainMeaning:
      "One side promises to cover losses, claims, or legal costs if a certain problem happens.",
    whyItMatters:
      "This can shift major financial risk onto the person signing the agreement.",
    keywords: ["indemnity", "indemnify", "hold harmless", "damages", "losses"],
    relatedSearch: "liability",
  },
  {
    id: "force-majeure",
    term: "Force majeure",
    category: "Contract clause",
    plainMeaning:
      "A clause that explains what happens if unusual events outside anyone's control stop the contract from being performed.",
    whyItMatters:
      "It can excuse delays or missed obligations during emergencies, disasters, or similar events.",
    keywords: ["force majeure", "unforeseen event", "outside control", "emergency"],
    relatedSearch: "accident force majeure",
  },
  {
    id: "governing-law",
    term: "Governing law",
    category: "Contract clause",
    plainMeaning:
      "The legal system or jurisdiction that will be used to interpret and enforce the agreement.",
    whyItMatters:
      "It affects where disputes are handled and which rules apply if the parties disagree.",
    keywords: ["governing law", "jurisdiction", "court", "dispute", "arbitration"],
    relatedSearch: "court arbitration dispute",
  },
  {
    id: "employment-contract",
    term: "Employment contract",
    category: "Labour-law concept",
    plainMeaning:
      "An oral or written agreement where a worker performs work under an employer's direction in return for wages.",
    whyItMatters:
      "It defines the work relationship and helps show when labour-law protections should apply.",
    keywords: ["employment contract", "worker", "employer", "agreement", "wage"],
    relatedSearch: "employment contract",
  },
  {
    id: "forced-labor",
    term: "Forced labor",
    category: "Labour-law concept",
    plainMeaning:
      "Work or service imposed on a person under threat of sanction when the person did not freely volunteer.",
    whyItMatters:
      "It is a serious labour-rights issue and a core legal protection for workers.",
    keywords: ["forced labor", "forced labour", "coerced work", "sanction"],
    relatedSearch: "forced labor",
  },
  {
    id: "foreign-worker",
    term: "Foreign worker",
    category: "Labour-law concept",
    plainMeaning:
      "A natural person who is not an Iraqi national and works or wants to work in Iraq as a worker.",
    whyItMatters:
      "Special rules can apply to work authorization, recruitment, and employment conditions.",
    keywords: ["foreign worker", "non-Iraqi", "work in Iraq", "foreigner"],
    relatedSearch: "foreign worker",
  },
  {
    id: "discrimination",
    term: "Discrimination",
    category: "Labour-law concept",
    plainMeaning:
      "Treating workers unfairly based on protected characteristics or conditions rather than relevant job qualifications.",
    whyItMatters:
      "Iraq labour law prohibits direct and indirect discrimination in employment-related matters.",
    keywords: ["discrimination", "equal opportunity", "equal treatment", "indirect discrimination"],
    relatedSearch: "discrimination equal opportunity",
  },
  {
    id: "wage",
    term: "Wage",
    category: "Labour-law concept",
    plainMeaning:
      "The amount or benefit due to a worker in return for work, including allowances and overtime pay where applicable.",
    whyItMatters:
      "Clear wage terms matter for payment disputes, overtime, and compensation expectations.",
    keywords: ["wage", "salary", "pay", "allowance", "overtime"],
    relatedSearch: "wage salary",
  },
  {
    id: "minimum-working-age",
    term: "Minimum working age",
    category: "Labour-law concept",
    plainMeaning:
      "The minimum age a person must reach before legal employment is allowed.",
    whyItMatters:
      "It protects children and determines when youth employment rules begin to apply.",
    keywords: ["minimum age", "working age", "minor worker", "child", "employment age"],
    relatedSearch: "minimum working age",
  },
  {
    id: "private-employment-office",
    term: "Private employment office",
    category: "Labour-law concept",
    plainMeaning:
      "A licensed private office that helps place workers in jobs under rules set by the Ministry.",
    whyItMatters:
      "The law restricts charging workers placement fees and regulates how these offices operate.",
    keywords: ["private employment office", "employment office", "placement", "license"],
    relatedSearch: "private employment office",
  },
  {
    id: "job-vacancy-notice",
    term: "Job vacancy notice",
    category: "Labour-law concept",
    plainMeaning:
      "An employer's duty to notify the employment office when a post becomes vacant and provide basic job details.",
    whyItMatters:
      "It affects how workers are referred to jobs and when employers may recruit directly.",
    keywords: ["job vacancy", "vacant post", "employment office", "notify vacancy"],
    relatedSearch: "vacancy employment office",
  },
];

const GENERIC_GLOSSARY_QUERY_TOKENS = new Set([
  "article",
  "articles",
  "clause",
  "clauses",
  "contract",
  "contracts",
  "document",
  "documents",
  "law",
  "laws",
  "legal",
  "section",
  "sections",
  "term",
  "terms",
]);

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

function buildArticleReference(article) {
  return {
    citation_id: article.citation_id || article.id,
    doc_id: article.doc_id,
    law_title: article.law_title,
    article_number: article.article_number,
    article_label: article.article_label,
    reference_label: article.reference_label || article.article_label,
    chapter: article.chapter,
    excerpt: article.excerpt || summarizeArticle(article),
    source_document: article.source_document,
  };
}

function scoreGlossaryEntry(entry, normalizedQuery, queryTokens) {
  if (!normalizedQuery) {
    return 0;
  }

  const normalizedTerm = normalizeForSearch(entry.term);
  const normalizedPlainMeaning = normalizeForSearch(entry.plainMeaning);
  const normalizedWhyItMatters = normalizeForSearch(entry.whyItMatters);
  const normalizedKeywords = entry.keywords.map((keyword) =>
    normalizeForSearch(keyword),
  );
  const hasDirectTermMatch =
    normalizedTerm === normalizedQuery ||
    normalizedTerm.startsWith(normalizedQuery) ||
    normalizedTerm.includes(normalizedQuery);
  const hasDirectKeywordMatch = normalizedKeywords.some(
    (keyword) =>
      keyword === normalizedQuery ||
      keyword.startsWith(normalizedQuery) ||
      keyword.includes(normalizedQuery),
  );
  const isSingleGenericQuery =
    queryTokens.length === 1 &&
    GENERIC_GLOSSARY_QUERY_TOKENS.has(queryTokens[0]);

  if (isSingleGenericQuery && !hasDirectTermMatch && !hasDirectKeywordMatch) {
    return 0;
  }

  let score = 0;

  if (normalizedTerm === normalizedQuery) {
    score += 12;
  } else if (normalizedTerm.startsWith(normalizedQuery)) {
    score += 8;
  } else if (normalizedTerm.includes(normalizedQuery)) {
    score += 6;
  }

  if (normalizedKeywords.some((keyword) => keyword === normalizedQuery)) {
    score += 5;
  }

  if (normalizedPlainMeaning.includes(normalizedQuery)) {
    score += 3;
  }

  if (normalizedWhyItMatters.includes(normalizedQuery)) {
    score += 2;
  }

  queryTokens.forEach((token) => {
    if (normalizedTerm.includes(token)) {
      score += 2;
    }

    if (normalizedKeywords.some((keyword) => keyword.includes(token))) {
      score += 1.5;
    }

    if (normalizedPlainMeaning.includes(token)) {
      score += 1;
    }

    if (normalizedWhyItMatters.includes(token)) {
      score += 0.75;
    }
  });

  return score;
}

function buildGlossaryResult(entry) {
  return {
    id: entry.id,
    term: entry.term,
    category: entry.category,
    plainMeaning: entry.plainMeaning,
    whyItMatters: entry.whyItMatters,
  };
}

function searchGlossary(query = "") {
  const normalizedQuery = normalizeForSearch(query);
  const queryTokens = tokenize(query);

  if (!normalizedQuery) {
    return GLOSSARY_ENTRIES.slice(0, 6).map(buildGlossaryResult);
  }

  return GLOSSARY_ENTRIES.map((entry) => ({
    entry,
    score: scoreGlossaryEntry(entry, normalizedQuery, queryTokens),
  }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map((item) => buildGlossaryResult(item.entry));
}

async function searchDictionary(query = "", userId = null) {
  const normalizedQuery = normalizeWhitespace(query);
  const glossaryResults = searchGlossary(normalizedQuery);
  const articleResults = normalizedQuery
    ? searchLegalArticles(normalizedQuery, { limit: 6 }).citations.map(
        buildArticleReference,
      )
    : [];
  let documentResults = [];
  let templateResults = [];

  if (normalizedQuery) {
    const [templateQueryResult, uploadedMatches] = await Promise.all([
      db.query("SELECT * FROM templates ORDER BY created_at DESC, id DESC"),
      searchUploadedDocumentMatches(userId, normalizedQuery, { limit: 6 }),
    ]);

    templateResults = await searchTemplateContentMatches(
      templateQueryResult[0] || [],
      normalizedQuery,
      { limit: 6 },
    );
    documentResults = uploadedMatches;
  }

  return {
    query: normalizedQuery,
    glossaryResults,
    articleResults,
    documentResults,
    templateResults,
    suggestedQueries: SUGGESTED_QUERIES,
    resultCounts: {
      glossary: glossaryResults.length,
      articles: articleResults.length,
      documents: documentResults.length,
      templates: templateResults.length,
    },
  };
}

module.exports = {
  searchDictionary,
};
