const fs = require("fs");
const path = require("path");
const { PDFParse } = require("../node_modules/pdf-parse");

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

function cleanExtractedText(rawText) {
  return rawText
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "\n")
    .replace(/^\s*\d+\s*$/gm, "")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

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

function segmentArticles(cleanedText) {
  const matches = [...cleanedText.matchAll(ARTICLE_PATTERN)];

  if (matches.length === 0) {
    throw new Error("No labor-law articles were detected in the extracted text.");
  }

  return matches.map((match, index) => {
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

async function extractPdfText(sourcePath) {
  const parser = new PDFParse({ data: fs.readFileSync(sourcePath) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function main() {
  const sourcePath = process.argv[2] || DEFAULT_SOURCE_PATH;

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source PDF not found at ${sourcePath}`);
  }

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

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
