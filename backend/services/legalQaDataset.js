const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.resolve(
  __dirname,
  "../../data/processed_laws/iraq_labour_law_articles.json",
);

let cachedArticles = null;

function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function loadLegalArticles() {
  if (cachedArticles) {
    return cachedArticles;
  }

  const rawArticles = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));

  cachedArticles = rawArticles.map((article) => {
    const normalizedArticle = {
      article_number: Number(article.article_number),
      article_label:
        normalizeWhitespace(article.article_label) ||
        `Article ${article.article_number}`,
      chapter: normalizeWhitespace(article.chapter),
      original_text: normalizeWhitespace(article.original_text),
      simplified_text: normalizeWhitespace(article.simplified_text),
      simplified_text_draft: normalizeWhitespace(article.simplified_text_draft),
      source_document: normalizeWhitespace(article.source_document),
    };

    return {
      ...normalizedArticle,
      search_text: normalizeWhitespace(
        [
          normalizedArticle.article_label,
          normalizedArticle.chapter,
          normalizedArticle.original_text,
          normalizedArticle.simplified_text,
          normalizedArticle.simplified_text_draft,
        ]
          .filter(Boolean)
          .join(" "),
      ).toLowerCase(),
    };
  });

  return cachedArticles;
}

function findArticleByNumber(articleNumber) {
  return (
    loadLegalArticles().find(
      (article) => article.article_number === Number(articleNumber),
    ) || null
  );
}

module.exports = {
  DATASET_PATH,
  findArticleByNumber,
  loadLegalArticles,
  normalizeWhitespace,
};
