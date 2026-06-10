// File-system helpers for reading source documents and writing cleaned text files.
const fs = require("fs");
const path = require("path");
// DOCX extraction helper.
const mammoth = require("mammoth");
// PDF extraction helper.
const { PDFParse } = require("pdf-parse");
// Shared text-cleaning helper used after extraction.
const { cleanExtractedText } = require("./utils/cleanExtractedText");

// Default source and output locations used when no CLI arguments are provided.
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_SOURCE_DIR = path.join(PROJECT_ROOT, "data/raw_laws");
const DEFAULT_OUTPUT_DIR = path.join(
  PROJECT_ROOT,
  "data/processed_laws/reference_texts",
);
// Only these file types are converted into cleaned reference text.
const SUPPORTED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

// Read one source file and return its extracted raw text.
async function extractTextFromPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  // TXT files are already plain text.
  if (extension === ".txt") {
    return fs.readFileSync(filePath, "utf8");
  }

  // DOCX files need Mammoth to read the text content.
  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      buffer: fs.readFileSync(filePath),
    });
    return result.value;
  }

  // PDF files use a PDF parser and are always cleaned up afterward.
  if (extension === ".pdf") {
    const parser = new PDFParse({ data: fs.readFileSync(filePath) });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error(`Unsupported file extension: ${extension}`);
}

// Build the output .txt path for one source document.
function getOutputPath(filePath, outputDir) {
  const baseName = path.basename(filePath, path.extname(filePath));
  return path.join(outputDir, `${baseName}.txt`);
}

// Main script entry point: convert every supported legal source file into cleaned text.
async function main() {
  // Allow optional custom source/output directories from the command line.
  const sourceDir = process.argv[2] || DEFAULT_SOURCE_DIR;
  const outputDir = process.argv[3] || DEFAULT_OUTPUT_DIR;

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found at ${sourceDir}`);
  }

  // Discover and sort all supported source files.
  const sourceFiles = fs
    .readdirSync(sourceDir)
    .filter((entry) =>
      SUPPORTED_EXTENSIONS.has(path.extname(entry).toLowerCase()),
    )
    .map((entry) => path.join(sourceDir, entry))
    .sort((left, right) => left.localeCompare(right));

  if (sourceFiles.length === 0) {
    throw new Error(`No supported legal source files found in ${sourceDir}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const metadata = [];

  // Extract and clean each source file, then save the cleaned text and metadata.
  for (const sourceFile of sourceFiles) {
    const rawText = await extractTextFromPath(sourceFile);
    const cleanedText = cleanExtractedText(rawText);
    const outputPath = getOutputPath(sourceFile, outputDir);

    fs.writeFileSync(outputPath, `${cleanedText}\n`, "utf8");

    metadata.push({
      source_file: path.basename(sourceFile),
      output_file: path.basename(outputPath),
      character_count: cleanedText.length,
    });

    console.log(`Extracted ${path.basename(sourceFile)} -> ${outputPath}`);
  }

  const metadataPath = path.join(outputDir, "metadata.json");
  fs.writeFileSync(`${metadataPath}`, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
  console.log(`Wrote metadata: ${metadataPath}`);
}

// Exit with a readable error if extraction or writing fails.
main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
