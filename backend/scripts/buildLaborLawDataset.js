// File-system helpers for reading the source PDF and writing output files.
const fs = require("fs");
const path = require("path");
// PDF parser used to extract raw text from the labour law source document.
const { PDFParse } = require("pdf-parse");
// Shared text-cleaning helper used by multiple build scripts.
const { cleanExtractedText } = require("./utils/cleanExtractedText");

// Default project paths used when the script is run without CLI arguments.
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_SOURCE_PATH = path.join(
  PROJECT_ROOT,
  "data/raw_laws/Iraq-Labour-Laws.pdf",
);
const DEFAULT_OUTPUT_DIR = path.join(PROJECT_ROOT, "data/processed_laws");
const DEFAULT_CLEAN_TEXT_PATH = path.join(
  DEFAULT_OUTPUT_DIR,
  "iraq_labour_law_cleaned.txt",
);
const DEFAULT_JSON_PATH = path.join(
  DEFAULT_OUTPUT_DIR,
  "iraq_labour_law_articles.json",
);

const ARTICLE_PATTERN = /Article\s+(\d+)\s*[-–:]\s*/gi;
const CHAPTER_LINE_PATTERN = /^Chapter\s+[A-Za-z0-9]+$/i;

// Clean one article body after it has been sliced out of the full source text.
function normalizeArticleText(articleText) {
  return articleText
    .replace(
      /\s+Chapter\s+[A-Za-z0-9]+(?:\s+(?:Part|[A-Za-z][A-Za-z-]+|[IVXLC]+|\d+)){1,14}\s*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

// Detect short lines that are likely headings rather than normal article content.
function isLikelyHeading(line) {
  if (!line) {
    return false;
  }

  if (
    /^Article\s+\d+/i.test(line) ||
    /^Chapter\s+/i.test(line) ||
    /^\d+$/.test(line)
  ) {
    return false;
  }

  const wordCount = line.split(/\s+/).filter(Boolean).length;
  return wordCount > 0 && wordCount <= 8 && !/[.?!]$/.test(line);
}

// Find the nearest chapter heading before an article so the dataset can preserve structure.
function findNearestChapter(textBeforeArticle) {
  const lines = textBeforeArticle
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (!CHAPTER_LINE_PATTERN.test(lines[index])) {
      continue;
    }

    const nextLine = lines[index + 1];
    if (isLikelyHeading(nextLine)) {
      return `${lines[index]}: ${nextLine}`;
    }

    return lines[index];
  }

  return null;
}

// Split the cleaned labour-law text into article records.
function segmentArticles(cleanedText) {
  const matches = [...cleanedText.matchAll(ARTICLE_PATTERN)];

  if (matches.length === 0) {
    throw new Error("No labor-law articles were detected in the extracted text.");
  }

  return matches.map((match, index) => {
    // Slice from this article heading to the next one.
    const articleNumber = Number.parseInt(match[1], 10);
    const articleStart = match.index;
    const articleEnd =
      index + 1 < matches.length ? matches[index + 1].index : cleanedText.length;
    const rawArticleText = cleanedText.slice(articleStart, articleEnd);
    const originalText = normalizeArticleText(rawArticleText);
    const chapter = findNearestChapter(cleanedText.slice(0, articleStart));

    return {
      article_number: articleNumber,
      article_label: `Article ${articleNumber}`,
      chapter,
      original_text: originalText,
      simplified_text: "",
      simplified_text_draft: "",
      source_document: path.basename(DEFAULT_SOURCE_PATH),
    };
  });
}

// Extract raw text from the source PDF.
async function extractPdfText(sourcePath) {
  const parser = new PDFParse({ data: fs.readFileSync(sourcePath) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

// Main script entry point: extract, clean, segment, and write the labour-law dataset.
async function main() {
  // Allow an optional custom source path from the command line.
  const sourcePath = process.argv[2] || DEFAULT_SOURCE_PATH;

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source PDF not found at ${sourcePath}`);
  }

  // Build both a cleaned text file and a JSON article dataset.
  const rawText = await extractPdfText(sourcePath);
  const cleanedText = cleanExtractedText(rawText);
  const articles = segmentArticles(cleanedText);

  fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(DEFAULT_CLEAN_TEXT_PATH, `${cleanedText}\n`, "utf8");
  fs.writeFileSync(DEFAULT_JSON_PATH, `${JSON.stringify(articles, null, 2)}\n`, "utf8");

  console.log(`Processed ${articles.length} articles from ${path.basename(sourcePath)}.`);
  console.log(`Clean text: ${DEFAULT_CLEAN_TEXT_PATH}`);
  console.log(`Dataset JSON: ${DEFAULT_JSON_PATH}`);
}

// Exit with a readable error if any step fails.
main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
