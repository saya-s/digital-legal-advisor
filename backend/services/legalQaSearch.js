const {
  findArticleByNumber,
  loadLegalArticles,
  normalizeWhitespace,
} = require("./legalQaDataset");

const STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "am",
  "an",
  "and",
  "any",
  "are",
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
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
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
  "work",
  "worker",
  "workers",
  "would",
  "you",
  "your",
]);

const TOKEN_EXPANSIONS = [
  {
    pattern: /\bminimum\b.*\bage\b|\bworking age\b|\bchild labor\b|\bminor\b/i,
    extras: ["minimum", "age", "employment", "child", "minor"],
  },
  {
    pattern: /\bdiscrimination\b|\bequal\b|\bequality\b/i,
    extras: ["discrimination", "equality", "equal", "sex", "race"],
  },
  {
    pattern: /\bharassment\b|\bviolence\b|\babuse\b/i,
    extras: ["harassment", "violence", "abuse", "protection"],
  },
  {
    pattern: /\bpublic employees?\b|\bpublic officials?\b|\bcivil service\b/i,
    extras: ["public", "officials", "civil", "service"],
  },
  {
    pattern: /\bforeign worker\b|\bforeigners\b|\bvisa\b/i,
    extras: ["foreign", "foreigner", "worker", "work"],
  },
  {
    pattern: /\bdismissed\b|\bfired\b|\btermination\b|\bterminated\b/i,
    extras: ["termination", "dismissal", "terminate", "employer"],
  },
  {
    pattern: /\bwage\b|\bsalary\b|\bpay\b/i,
    extras: ["wage", "salary", "pay", "allowance"],
  },
];

const PHRASE_BOOSTS = [
  {
    requiredTokens: ["minimum", "age"],
    articlePhrase: "minimum age",
    bonus: 8,
  },
  {
    requiredTokens: ["public", "officials"],
    articlePhrase: "public officials",
    bonus: 8,
  },
  {
    requiredTokens: ["foreign"],
    articlePhrase: "foreign worker",
    bonus: 6,
  },
  {
    requiredTokens: ["discrimination"],
    articlePhrase: "discrimination",
    bonus: 5,
  },
  {
    requiredTokens: ["harassment"],
    articlePhrase: "harassment",
    bonus: 6,
  },
];

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
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function expandTokens(question, baseTokens) {
  const tokenSet = new Set(baseTokens);

  TOKEN_EXPANSIONS.forEach(({ pattern, extras }) => {
    if (pattern.test(question)) {
      extras.forEach((token) => tokenSet.add(token));
    }
  });

  return [...tokenSet];
}

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

function extractArticleReference(question = "") {
  const directMatch = question.match(/\barticle\s+(\d+)\b/i);
  return directMatch ? Number(directMatch[1]) : null;
}

function stripArticlePrefix(text = "") {
  return normalizeWhitespace(
    text.replace(/^article\s+\d+\s*[-–:]?\s*/i, ""),
  );
}

function clampText(text, maxLength = 280) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}...`;
}

function buildExcerpt(article, matchTerms = []) {
  const articleBody = stripArticlePrefix(article.original_text);
  const sentences = articleBody
    .split(/(?<=[.!?;])\s+/)
    .map((sentence) => normalizeWhitespace(sentence))
    .filter(Boolean);

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

function scoreArticle(article, question, tokens, bigrams) {
  const searchText = article.search_text;
  const chapterText = article.chapter.toLowerCase();
  const matchedTerms = new Set();
  const tokenSet = new Set(tokens);
  let score = 0;

  tokens.forEach((token) => {
    if (!searchText.includes(token)) {
      return;
    }

    matchedTerms.add(token);
    score += token.length >= 8 ? 2.25 : token.length >= 5 ? 1.5 : 1;

    if (chapterText.includes(token)) {
      score += 0.75;
    }
  });

  bigrams.forEach((bigram) => {
    if (searchText.includes(bigram)) {
      matchedTerms.add(bigram);
      score += 3;
    }
  });

  const normalizedQuestion = normalizeForSearch(question);
  if (normalizedQuestion && searchText.includes(normalizedQuestion)) {
    score += 5;
  }

  PHRASE_BOOSTS.forEach(({ requiredTokens, articlePhrase, bonus }) => {
    const hasRequiredTokens = requiredTokens.every((token) => tokenSet.has(token));

    if (hasRequiredTokens && searchText.includes(articlePhrase)) {
      matchedTerms.add(articlePhrase);
      score += bonus;
    }
  });

  const wordCount = article.original_text.split(/\s+/).length;
  if (wordCount > 120) {
    score -= Math.min(5, (wordCount - 120) / 90);
  }

  if (matchedTerms.size > 0 && tokens.length > 0) {
    const coverageMultiplier = wordCount <= 40 ? 6 : 2;
    score += (matchedTerms.size / tokens.length) * coverageMultiplier;
  }

  return {
    score,
    matchedTerms: [...matchedTerms],
  };
}

function inferConfidence(topScore, secondScore, directArticleMatch) {
  if (directArticleMatch) {
    return "high";
  }

  if (topScore >= 10 || (topScore >= 7 && topScore - secondScore >= 2)) {
    return "high";
  }

  if (topScore >= 4) {
    return "medium";
  }

  return "low";
}

function toCitation(article, matchScore, matchedTerms) {
  return {
    article_number: article.article_number,
    article_label: article.article_label,
    chapter: article.chapter,
    source_document: article.source_document,
    original_text: article.original_text,
    simplified_text: article.simplified_text,
    simplified_text_draft: article.simplified_text_draft,
    match_score: Number(matchScore.toFixed(2)),
    matched_terms: matchedTerms,
    excerpt: buildExcerpt(article, matchedTerms),
  };
}

function searchLegalArticles(question, { limit = 3 } = {}) {
  const trimmedQuestion = normalizeWhitespace(question);
  const directArticleNumber = extractArticleReference(trimmedQuestion);

  if (directArticleNumber) {
    const directArticle = findArticleByNumber(directArticleNumber);

    if (directArticle) {
      return {
        citations: [
          toCitation(directArticle, 100, [`article ${directArticleNumber}`]),
        ],
        confidence: "high",
        directArticleMatch: true,
        matchedTerms: [`article ${directArticleNumber}`],
      };
    }
  }

  const baseTokens = tokenize(trimmedQuestion);
  const tokens = expandTokens(trimmedQuestion, baseTokens);
  const bigrams = buildBigrams(tokens);

  const rankedArticles = loadLegalArticles()
    .map((article) => {
      const { score, matchedTerms } = scoreArticle(
        article,
        trimmedQuestion,
        tokens,
        bigrams,
      );

      return {
        article,
        score,
        matchedTerms,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const topMatches = rankedArticles.slice(0, limit);
  const topScore = topMatches[0]?.score || 0;
  const secondScore = topMatches[1]?.score || 0;

  return {
    citations: topMatches.map(({ article, score, matchedTerms }) =>
      toCitation(article, score, matchedTerms),
    ),
    confidence: inferConfidence(topScore, secondScore, false),
    directArticleMatch: false,
    matchedTerms: topMatches.flatMap((entry) => entry.matchedTerms).slice(0, 8),
  };
}

module.exports = {
  searchLegalArticles,
};
