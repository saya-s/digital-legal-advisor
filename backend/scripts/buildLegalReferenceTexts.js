const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const { PDFParse } = require("../node_modules/pdf-parse");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_SOURCE_DIR = path.join(PROJECT_ROOT, "data/raw_laws");
const DEFAULT_OUTPUT_DIR = path.join(
  PROJECT_ROOT,
  "data/processed_laws/reference_texts",
);
const SUPPORTED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

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

async function extractTextFromPath(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".txt") {
    return fs.readFileSync(filePath, "utf8");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({
      buffer: fs.readFileSync(filePath),
    });
    return result.value;
  }

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

function getOutputPath(filePath, outputDir) {
  const baseName = path.basename(filePath, path.extname(filePath));
  return path.join(outputDir, `${baseName}.txt`);
}

async function main() {
  const sourceDir = process.argv[2] || DEFAULT_SOURCE_DIR;
  const outputDir = process.argv[3] || DEFAULT_OUTPUT_DIR;

  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Source directory not found at ${sourceDir}`);
  }

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

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
