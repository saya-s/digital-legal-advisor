const fs = require("fs");
const path = require("path");

const DATASET_PATH = path.resolve(
  __dirname,
  "../../data/processed_laws/law_chunks.json",
);

let cachedSections = null;

function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function buildChapterLabel(chunk = {}) {
  return normalizeWhitespace(
    [chunk.section, chunk.chapter].filter(Boolean).join(" / "),
  );
}

function buildReferenceLabel(chunk = {}, sectionLabel) {
  const normalizedSectionLabel =
    normalizeWhitespace(sectionLabel) ||
    normalizeWhitespace(chunk.section_title) ||
    normalizeWhitespace(chunk.section_type) ||
    "Section";
  const normalizedLawTitle = normalizeWhitespace(chunk.title);

  if (!normalizedLawTitle) {
    return normalizedSectionLabel;
  }

  return `${normalizedSectionLabel} (${normalizedLawTitle})`;
}

function normalizeChunk(chunk = {}) {
  const sectionLabel =
    normalizeWhitespace(chunk.section_label) ||
    (chunk.section_type === "preamble"
      ? "Preamble"
      : chunk.section_number
        ? `Article ${chunk.section_number}`
        : "Section");
  const originalText = normalizeWhitespace(chunk.text);

  return {
    id: normalizeWhitespace(chunk.id),
    doc_id: normalizeWhitespace(chunk.doc_id),
    law_title: normalizeWhitespace(chunk.title),
    article_number:
      chunk.section_number === null || chunk.section_number === undefined
        ? null
        : Number(chunk.section_number),
    section_number:
      chunk.section_number === null || chunk.section_number === undefined
        ? null
        : Number(chunk.section_number),
    article_label: sectionLabel,
    reference_label: buildReferenceLabel(chunk, sectionLabel),
    section_type: normalizeWhitespace(chunk.section_type),
    section_title: normalizeWhitespace(chunk.section_title),
    section: normalizeWhitespace(chunk.section),
    chapter: buildChapterLabel(chunk),
    original_text: originalText,
    simplified_text: "",
    simplified_text_draft: "",
    source_document: normalizeWhitespace(chunk.source_document),
    processed_text_file: normalizeWhitespace(chunk.processed_text_file),
    chunk_index: Number(chunk.chunk_index) || 1,
    total_chunks_in_section: Number(chunk.total_chunks_in_section) || 1,
    section_order:
      chunk.section_order === null || chunk.section_order === undefined
        ? null
        : Number(chunk.section_order),
    search_text: normalizeWhitespace(
      chunk.search_text ||
        [
          chunk.title,
          chunk.section,
          chunk.chapter,
          sectionLabel,
          chunk.section_title,
          originalText,
        ]
          .filter(Boolean)
          .join(" "),
    ).toLowerCase(),
  };
}

function loadLegalArticles() {
  if (cachedSections) {
    return cachedSections;
  }

  const rawChunks = JSON.parse(fs.readFileSync(DATASET_PATH, "utf8"));
  cachedSections = rawChunks
    .map(normalizeChunk)
    .filter((chunk) => chunk.original_text);

  return cachedSections;
}

function findArticleByNumber(articleNumber, { docId } = {}) {
  return (
    loadLegalArticles().find((article) => {
      if (article.section_type !== "article") {
        return false;
      }

      if (article.article_number !== Number(articleNumber)) {
        return false;
      }

      if (docId && article.doc_id !== docId) {
        return false;
      }

      return true;
    }) || null
  );
}

function findArticlesByNumber(articleNumber) {
  return loadLegalArticles().filter(
    (article) =>
      article.section_type === "article" &&
      article.article_number === Number(articleNumber),
  );
}

module.exports = {
  DATASET_PATH,
  findArticleByNumber,
  findArticlesByNumber,
  loadLegalArticles,
  normalizeWhitespace,
};
