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

const ENGLISH_STOP_WORDS = new Set([
  "a",
  "about",
  "an",
  "and",
  "any",
  "are",
  "be",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "show",
  "tell",
  "that",
  "the",
  "this",
  "to",
  "what",
  "when",
  "where",
  "which",
  "who",
  "with",
  "would",
  "you",
  "your",
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
    .filter((token) => token.length > 1 && !ENGLISH_STOP_WORDS.has(token))
    .map((token) => stemToken(token))
    .filter((token) => token.length > 1);
}

function stemToken(token = "") {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith("ies") && token.length > 4) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.endsWith("ing") && token.length > 5) {
    return token.slice(0, -3);
  }

  if (token.endsWith("ers") && token.length > 5) {
    return token.slice(0, -1);
  }

  if (token.endsWith("er") && token.length > 5) {
    return token.slice(0, -2);
  }

  if (token.endsWith("ed") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (
    (token.endsWith("ches") ||
      token.endsWith("shes") ||
      token.endsWith("sses") ||
      token.endsWith("xes") ||
      token.endsWith("zes")) &&
    token.length > 5
  ) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && !token.endsWith("ss") && token.length > 4) {
    return token.slice(0, -1);
  }

  return token;
}

function buildBigrams(tokens = []) {
  const bigrams = [];

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const left = tokens[index];
    const right = tokens[index + 1];

    if (left && right) {
      bigrams.push(`${left} ${right}`);
    }
  }

  return bigrams;
}

function padForWholePhraseMatch(value = "") {
  const normalized = normalizeForSearch(value);
  return normalized ? ` ${normalized} ` : " ";
}

function containsWholePhrase(paddedText = " ", phrase = "") {
  const normalizedPhrase = normalizeForSearch(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  return paddedText.includes(` ${normalizedPhrase} `);
}

function buildTokenSet(values = []) {
  return new Set(values.flatMap((value) => tokenize(value)));
}

function buildBigramSet(values = []) {
  return new Set(
    values.flatMap((value) => buildBigrams(tokenize(value))),
  );
}

function scoreTokenWeight(token = "") {
  if (token.length >= 10) {
    return 3;
  }

  if (token.length >= 6) {
    return 2.5;
  }

  return 2;
}

function filterMeaningfulQueryTokens(tokens = []) {
  return tokens.filter((token) => !GENERIC_GLOSSARY_QUERY_TOKENS.has(token));
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

  const uniqueQueryTokens = [...new Set(queryTokens)];
  const meaningfulQueryTokens = filterMeaningfulQueryTokens(uniqueQueryTokens);
  const tokensForScoring =
    meaningfulQueryTokens.length > 0 ? meaningfulQueryTokens : uniqueQueryTokens;
  const queryBigrams = buildBigrams(tokensForScoring);
  const normalizedTerm = normalizeForSearch(entry.term);
  const normalizedPlainMeaning = normalizeForSearch(entry.plainMeaning);
  const normalizedWhyItMatters = normalizeForSearch(entry.whyItMatters);
  const searchPhrases = [...entry.keywords, entry.relatedSearch].filter(Boolean);
  const normalizedKeywords = searchPhrases.map((keyword) =>
    normalizeForSearch(keyword),
  );
  const termPadded = padForWholePhraseMatch(entry.term);
  const keywordPadded = normalizedKeywords.map((keyword) =>
    padForWholePhraseMatch(keyword),
  );
  const termTokens = buildTokenSet([entry.term]);
  const keywordTokens = buildTokenSet(searchPhrases);
  const descriptionTokens = buildTokenSet([
    entry.plainMeaning,
    entry.whyItMatters,
  ]);
  const termBigrams = buildBigramSet([entry.term]);
  const keywordBigrams = buildBigramSet(searchPhrases);
  const descriptionBigrams = buildBigramSet([
    entry.plainMeaning,
    entry.whyItMatters,
  ]);
  const hasDirectTermMatch =
    normalizedTerm === normalizedQuery;
  const hasDirectKeywordMatch = normalizedKeywords.some(
    (keyword) => keyword === normalizedQuery,
  );
  const hasWholeTermPhraseMatch = containsWholePhrase(termPadded, normalizedQuery);
  const hasWholeKeywordPhraseMatch = keywordPadded.some((keyword) =>
    containsWholePhrase(keyword, normalizedQuery),
  );
  const hasPrefixTermMatch =
    normalizedQuery.length >= 4 && normalizedTerm.startsWith(normalizedQuery);
  const hasPrefixKeywordMatch =
    normalizedQuery.length >= 4 &&
    normalizedKeywords.some((keyword) => keyword.startsWith(normalizedQuery));
  const matchedPrimaryTokens = tokensForScoring.filter(
    (token) => termTokens.has(token) || keywordTokens.has(token),
  );
  const matchedDescriptionTokens = tokensForScoring.filter((token) =>
    descriptionTokens.has(token),
  );
  const matchedPrimaryBigrams = queryBigrams.filter(
    (bigram) => termBigrams.has(bigram) || keywordBigrams.has(bigram),
  );
  const matchedDescriptionBigrams = queryBigrams.filter((bigram) =>
    descriptionBigrams.has(bigram),
  );
  const tokenCoverage = tokensForScoring.length
    ? matchedPrimaryTokens.length / tokensForScoring.length
    : 0;
  const descriptionCoverage = tokensForScoring.length
    ? matchedDescriptionTokens.length / tokensForScoring.length
    : 0;
  const hasPrimaryMatch =
    hasDirectTermMatch ||
    hasDirectKeywordMatch ||
    hasWholeTermPhraseMatch ||
    hasWholeKeywordPhraseMatch ||
    hasPrefixTermMatch ||
    hasPrefixKeywordMatch ||
    matchedPrimaryTokens.length > 0 ||
    matchedPrimaryBigrams.length > 0;
  const isSingleGenericQuery =
    uniqueQueryTokens.length === 1 &&
    GENERIC_GLOSSARY_QUERY_TOKENS.has(uniqueQueryTokens[0]);

  if (
    isSingleGenericQuery &&
    !hasDirectTermMatch &&
    !hasDirectKeywordMatch &&
    !hasWholeTermPhraseMatch &&
    !hasWholeKeywordPhraseMatch &&
    !hasPrefixTermMatch &&
    !hasPrefixKeywordMatch
  ) {
    return 0;
  }

  if (!hasPrimaryMatch) {
    const strongDescriptionOnlyMatch =
      matchedDescriptionBigrams.length > 0 || descriptionCoverage >= 0.75;

    if (!strongDescriptionOnlyMatch) {
      return 0;
    }
  }

  if (
    tokensForScoring.length > 1 &&
    !hasDirectTermMatch &&
    !hasDirectKeywordMatch &&
    !hasWholeTermPhraseMatch &&
    !hasWholeKeywordPhraseMatch &&
    matchedPrimaryBigrams.length === 0 &&
    tokenCoverage < 0.75
  ) {
    return 0;
  }

  let score = 0;

  if (normalizedTerm === normalizedQuery) {
    score += 18;
  } else if (hasWholeTermPhraseMatch) {
    score += 14;
  } else if (hasPrefixTermMatch) {
    score += 10;
  }

  if (normalizedKeywords.some((keyword) => keyword === normalizedQuery)) {
    score += 12;
  } else if (hasWholeKeywordPhraseMatch) {
    score += 9;
  } else if (hasPrefixKeywordMatch) {
    score += 6;
  }

  score += matchedPrimaryBigrams.length * 5;
  score += matchedPrimaryTokens.reduce(
    (total, token) => total + scoreTokenWeight(token),
    0,
  );

  if (
    tokensForScoring.length > 1 &&
    matchedPrimaryTokens.length === tokensForScoring.length
  ) {
    score += 4;
  }

  if (normalizedPlainMeaning === normalizedQuery) {
    score += 3;
  }

  if (normalizedWhyItMatters === normalizedQuery) {
    score += 2;
  }

  score += matchedDescriptionBigrams.length * 1.5;
  score += matchedDescriptionTokens.reduce(
    (total, token) => total + (token.length >= 8 ? 0.75 : 0.5),
    0,
  );

  return Number(score.toFixed(2));
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
