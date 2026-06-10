// Reuse the normalized legal dataset and article-number lookup helpers.
const {
  findArticlesByNumber,
  loadLegalArticles,
  normalizeWhitespace,
} = require("./legalQaDataset");

// Common words are ignored so ranking focuses on the meaningful legal concepts in the question.
const STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
  "article",
  "as",
  "at",
  "be",
  "before",
  "between",
  "by",
  "can",
  "do",
  "does",
  "for",
  "from",
  "get",
  "have",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "law",
  "laws",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "say",
  "says",
  "section",
  "should",
  "tell",
  "that",
  "the",
  "their",
  "this",
  "to",
  "under",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "with",
  "would",
  "you",
  "your",
  "mean",
  "means",
]);

// Lowercase and strip punctuation so search matching is more flexible.
function normalizeForSearch(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Light stemming helps similar word forms match the same legal article text.
function stemToken(token = "") {
  if (token.length <= 4) {
    return token;
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

  if (token.endsWith("es") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 4) {
    return token.slice(0, -1);
  }

  return token;
}

// Break the question into normalized searchable tokens.
function tokenize(value = "") {
  return normalizeForSearch(value)
    .split(" ")
    .map((token) => stemToken(token))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

// Build adjacent token pairs so phrase-style matches can score higher than isolated words.
function buildBigrams(tokens) {
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

// Pad text with spaces so whole-term checks do not match inside larger words.
function padForWholeTermMatch(value = "") {
  const normalized = normalizeForSearch(value);
  return normalized ? ` ${normalized} ` : " ";
}

// Check whether a normalized word or phrase appears as a standalone term.
function containsWholeTerm(paddedText = " ", term = "") {
  const normalizedTerm = normalizeForSearch(term);

  if (!normalizedTerm) {
    return false;
  }

  return paddedText.includes(` ${normalizedTerm} `);
}

// Add special multi-word intents for queries that may be expressed indirectly by the user.
function buildIntentPhrases(tokens = []) {
  const tokenSet = new Set(tokens);
  const phrases = [];

  if (
    tokenSet.has("age") &&
    (
      tokenSet.has("work") ||
      tokenSet.has("employ") ||
      tokenSet.has("worker") ||
      tokenSet.has("labor")
    )
  ) {
    phrases.push(
      "minimum age",
      "minimum age of employment",
      "minor worker",
      "child labor",
    );
  }

  return phrases;
}

// Detect explicit references like "Article 12" or "Section 8" in the user question.
function extractSectionReference(question = "") {
  const directMatch = question.match(/\b(?:article|section)\s+(\d+)\b/i);
  return directMatch ? Number(directMatch[1]) : null;
}

// Remove leading section labels before generating a short excerpt.
function stripSectionPrefix(text = "") {
  return normalizeWhitespace(
    text.replace(/^(article|section)\s+\d+\s*[-–:]?\s*/i, ""),
  );
}

// Keep citation excerpts compact for UI display and answer building.
function clampText(text, maxLength = 280) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

// Pick the most relevant sentence from an article to show as the citation excerpt.
function buildExcerpt(article, matchTerms = []) {
  const articleBody = stripSectionPrefix(article.original_text);
  const sentences = articleBody
    .split(/(?<=[.!?;])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);

  if (sentences.length === 0) {
    return clampText(articleBody, 280);
  }

  const loweredTerms = matchTerms.map((term) => term.toLowerCase());
  const matchingSentence = sentences
    .map((sentence) => {
      const lowerSentence = sentence.toLowerCase();
      const matchCount = loweredTerms.filter((term) =>
        lowerSentence.includes(term),
      ).length;

      return {
        sentence,
        matchCount,
      };
    })
    .sort((left, right) => {
      if (right.matchCount !== left.matchCount) {
        return right.matchCount - left.matchCount;
      }

      return left.sentence.length - right.sentence.length;
    })[0];

  return clampText(matchingSentence?.sentence || articleBody, 280);
}

// Score one legal article against the user's question using tokens, phrases, headings, and direct references.
function scoreArticle(article, question, tokens, bigrams, directSectionNumber) {
  const searchText = padForWholeTermMatch(article.search_text);
  const headingText = padForWholeTermMatch(
    [
      article.law_title,
      article.chapter,
      article.section_title,
      article.article_label,
      article.source_document,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const originalText = normalizeForSearch(article.original_text);
  const normalizedQuestion = normalizeForSearch(question);
  const intentPhrases = buildIntentPhrases(tokens);
  const matchedTerms = new Set();
  let score = 0;

  // A direct article-number reference gets a strong boost.
  if (
    directSectionNumber !== null &&
    article.section_type === "article" &&
    article.article_number === directSectionNumber
  ) {
    matchedTerms.add(`article ${directSectionNumber}`);
    score += 12;
  }

  // Single-token matches build the main baseline score.
  tokens.forEach((token) => {
    if (!containsWholeTerm(searchText, token)) {
      return;
    }

    matchedTerms.add(token);
    score += token.length >= 8 ? 2.25 : token.length >= 5 ? 1.5 : 1;

    if (containsWholeTerm(headingText, token)) {
      score += 1;
    }
  });

  // Bigram matches reward phrase-like relevance.
  bigrams.forEach((bigram) => {
    if (!containsWholeTerm(searchText, bigram)) {
      return;
    }

    matchedTerms.add(bigram);
    score += 2.5;

    if (containsWholeTerm(headingText, bigram)) {
      score += 0.75;
    }
  });

  // Intent phrases capture common concepts even if the wording is indirect.
  intentPhrases.forEach((phrase) => {
    if (!containsWholeTerm(searchText, phrase)) {
      return;
    }

    matchedTerms.add(phrase);
    score += 4.5;

    if (containsWholeTerm(headingText, phrase)) {
      score += 1;
    }
  });

  // Whole-question phrase matches get an extra boost when the article contains the full query wording.
  if (normalizedQuestion && containsWholeTerm(searchText, normalizedQuestion)) {
    score += 4;
  }

  // Special-case boost for common age/employment questions that match article openings closely.
  if (
    intentPhrases.includes("minimum age of employment") &&
    originalText.startsWith("minimum age of employment")
  ) {
    matchedTerms.add("minimum age of employment");
    score += 6;
  }

  // Reward broader coverage when more of the question's terms appear in the article.
  if (matchedTerms.size > 0 && tokens.length > 0) {
    score += (matchedTerms.size / tokens.length) * 3.5;
  }

  // Very long sections get a slight penalty so concise, focused matches rank higher.
  const wordCount = article.original_text.split(/\s+/).length;
  if (wordCount > 220) {
    score -= Math.min(4, (wordCount - 220) / 120);
  }

  return {
    score,
    matchedTerms: [...matchedTerms],
  };
}

// Turn the top scores into a simple confidence level for the controller/UI.
function inferConfidence(
  topScore,
  secondScore,
  directArticleMatch,
  ambiguousArticleReference,
) {
  if (ambiguousArticleReference) {
    return "low";
  }

  if (directArticleMatch) {
    return "high";
  }

  if (topScore >= 9 || (topScore >= 7 && topScore - secondScore >= 2)) {
    return "high";
  }

  if (topScore >= 4) {
    return "medium";
  }

  return "low";
}

// Convert a ranked article into the citation/result shape returned by the search service.
function toCitation(article, matchScore, matchedTerms) {
  return {
    citation_id: article.id,
    doc_id: article.doc_id,
    law_title: article.law_title,
    article_number: article.article_number,
    article_label: article.article_label,
    reference_label: article.reference_label,
    chapter: article.chapter,
    section_title: article.section_title,
    section_type: article.section_type,
    source_document: article.source_document,
    original_text: article.original_text,
    simplified_text: article.simplified_text,
    simplified_text_draft: article.simplified_text_draft,
    match_score: Number(matchScore.toFixed(2)),
    matched_terms: matchedTerms,
    excerpt: buildExcerpt(article, matchedTerms),
  };
}

// Keep only one result per law section/article label so near-duplicate chunks do not crowd the output.
function dedupeBySection(rankedArticles, limit) {
  const uniqueMatches = [];
  const seenSectionKeys = new Set();

  rankedArticles.forEach((entry) => {
    if (uniqueMatches.length >= limit) {
      return;
    }

    const sectionKey = `${entry.article.doc_id}::${entry.article.article_label}`;

    if (seenSectionKeys.has(sectionKey)) {
      return;
    }

    seenSectionKeys.add(sectionKey);
    uniqueMatches.push(entry);
  });

  return uniqueMatches;
}

// Main legal-article search used by the QA flow to retrieve the strongest matching citations.
function searchLegalArticles(question, { limit = 3 } = {}) {
  const trimmedQuestion = normalizeWhitespace(question);
  const directSectionNumber = extractSectionReference(trimmedQuestion);
  const tokens = tokenize(trimmedQuestion);
  // If the user directly names an article number, check that path first.
  const directSectionMatches =
    directSectionNumber !== null ? findArticlesByNumber(directSectionNumber) : [];
  const hasOnlySectionReferenceTokens =
    directSectionNumber !== null &&
    (tokens.length === 0 ||
      (tokens.length === 1 && tokens[0] === String(directSectionNumber)));
  const ambiguousArticleReference =
    directSectionMatches.length > 1 && hasOnlySectionReferenceTokens;
  const directArticleMatch = directSectionMatches.length === 1;

  // Fast path: if the question is simply "Article X" and exactly one article matches, return it immediately.
  if (directArticleMatch && hasOnlySectionReferenceTokens) {
    return {
      citations: [
        toCitation(
          directSectionMatches[0],
          100,
          [`article ${directSectionNumber}`],
        ),
      ],
      confidence: "high",
      directArticleMatch: true,
      ambiguousArticleReference: false,
      matchedTerms: [`article ${directSectionNumber}`],
    };
  }

  const bigrams = buildBigrams(tokens);

  // Otherwise score every loaded article and rank the matches in memory.
  const rankedArticles = loadLegalArticles()
    .map((article) => {
      const { score, matchedTerms } = scoreArticle(
        article,
        trimmedQuestion,
        tokens,
        bigrams,
        directSectionNumber,
      );

      return {
        article,
        score,
        matchedTerms,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  // Deduplicate before building the final citations so one section does not appear multiple times.
  const topMatches = dedupeBySection(rankedArticles, limit);
  const topScore = topMatches[0]?.score || 0;
  const secondScore = topMatches[1]?.score || 0;

  return {
    citations: topMatches.map(({ article, score, matchedTerms }) =>
      toCitation(article, score, matchedTerms),
    ),
    confidence: inferConfidence(
      topScore,
      secondScore,
      directArticleMatch,
      ambiguousArticleReference,
    ),
    directArticleMatch,
    ambiguousArticleReference,
    matchedTerms: topMatches.flatMap((entry) => entry.matchedTerms).slice(0, 8),
  };
}

module.exports = {
  // Export the single public retrieval function used by legal QA services/controllers.
  searchLegalArticles,
};
