const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const DEFAULT_REFERENCE_DIR = path.join(
  PROJECT_ROOT,
  "data/processed_laws/reference_texts",
);
const DEFAULT_OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "data/processed_laws/law_chunks.json",
);
const DEFAULT_METADATA_PATH = path.join(
  PROJECT_ROOT,
  "data/processed_laws/law_chunks_metadata.json",
);

const MAX_CHUNK_CHARS = 1800;
const TARGET_CHUNK_CHARS = 1400;

function normalizeWhitespace(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function humanizeStem(stem = "") {
  return String(stem).replace(/[-_]+/g, " ").trim();
}

function isLikelyStandaloneHeading(line = "") {
  if (!line) {
    return false;
  }

  if (/^(article|chapter|section)\b/i.test(line)) {
    return false;
  }

  if (/^(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\b/i.test(line)) {
    return false;
  }

  const wordCount = line.split(/\s+/).filter(Boolean).length;
  return wordCount > 0 && wordCount <= 12 && !/[.!?;]$/.test(line);
}

function resolveDocumentTitle(text, stem) {
  const fallbackTitle = humanizeStem(stem);
  const lines = String(text)
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)
    .slice(0, 25);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1] || "";

    if (/^law\s+no\.?\s*/i.test(line) && nextLine) {
      const titleParts = [line];

      for (let offset = 1; offset <= 3; offset += 1) {
        const candidate = (lines[index + offset] || "").replace(/[:.]$/, "").trim();

        if (
          !candidate ||
          /^(article|chapter|section)\b/i.test(candidate) ||
          /^(according|accordance|based on)/i.test(candidate)
        ) {
          break;
        }

        titleParts.push(candidate);

        if (
          /(law|constitution|code|act)/i.test(candidate) &&
          !candidate.endsWith("and")
        ) {
          break;
        }
      }

      if (titleParts.length > 1) {
        return titleParts.join(" ").trim();
      }
    }

    if (
      /(constitution|banking law|labor law|labour law|investment law|retirement)/i.test(
        line,
      ) &&
      !/^(article|chapter|section)\b/i.test(line) &&
      !/(according|accordance|following law|based on)/i.test(line) &&
      line.length <= 140
    ) {
      return line.replace(/[:.]$/, "").trim();
    }
  }

  return fallbackTitle;
}

function stripNoiseLines(text = "") {
  return String(text)
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        return true;
      }

      if (/\.{4,}\s*\d*\s*$/u.test(trimmed)) {
        return false;
      }

      if (/^ANNEX\s+[A-Z]\s*-\s*\d+\s*-\s*$/i.test(trimmed)) {
        return false;
      }

      if (/^\( ?\d+ ?\)$/u.test(trimmed)) {
        return false;
      }

      return true;
    })
    .join("\n");
}

function readReferenceMetadata(referenceDir) {
  const metadataPath = path.join(referenceDir, "metadata.json");

  if (!fs.existsSync(metadataPath)) {
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(metadataPath, "utf8"));
  } catch {
    return [];
  }
}

function buildHeadingLabel(line, lines, index) {
  const trimmedLine = normalizeWhitespace(line);

  if (!trimmedLine) {
    return {
      label: "",
      consumedNext: false,
    };
  }

  if (/[.:-]\s+\S/.test(trimmedLine)) {
    return {
      label: trimmedLine,
      consumedNext: false,
    };
  }

  const nextLine = normalizeWhitespace(lines[index + 1] || "");

  if (isLikelyStandaloneHeading(nextLine)) {
    return {
      label: `${trimmedLine}: ${nextLine}`,
      consumedNext: true,
    };
  }

  return {
    label: trimmedLine,
    consumedNext: false,
  };
}

function isSectionHeading(line = "") {
  return /^(SECTION|Section)\s+[A-Za-z0-9IVXLC.-]+(?:\s*[.:-]\s*|\s+.*|$)/.test(
    line,
  );
}

function isChapterHeading(line = "") {
  return /^(CHAPTER|Chapter)\s+[A-Za-z0-9IVXLC.-]+(?:\s*[.:-]\s*|\s+.*|$)/.test(
    line,
  );
}

function parseArticleHeading(line = "") {
  const match = line.match(/^Article\s+(\d+)(?!\.)(.*)$/i);

  if (!match) {
    return null;
  }

  const articleNumber = Number.parseInt(match[1], 10);
  const remainder = (match[2] || "").trim();
  const inlineBody =
    remainder && /^[–-]/.test(remainder)
      ? remainder.replace(/^[–-]\s*/, "")
      : "";

  let sectionTitle = "";
  let bodyText = inlineBody;

  if (!inlineBody && remainder) {
    const normalizedRemainder = remainder.replace(/^[:]\s*/, "").trim();
    const wordCount = normalizedRemainder.split(/\s+/).filter(Boolean).length;

    if (wordCount <= 10 && !/[.!?;]$/.test(normalizedRemainder)) {
      sectionTitle = normalizedRemainder;
    } else {
      bodyText = normalizedRemainder;
    }
  }

  return {
    articleNumber,
    articleLabel: `Article ${articleNumber}`,
    sectionTitle,
    bodyText,
  };
}

function linesToText(lines = []) {
  const paragraphs = [];
  let currentParagraph = [];

  lines.forEach((line) => {
    const trimmed = normalizeWhitespace(line);

    if (!trimmed) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
      return;
    }

    currentParagraph.push(trimmed);
  });

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  return normalizeWhitespace(paragraphs.join("\n\n"));
}

function splitLongParagraph(paragraph = "", maxChars = MAX_CHUNK_CHARS) {
  const sentences = normalizeWhitespace(paragraph).split(/(?<=[.!?;])\s+/);

  if (sentences.length <= 1) {
    const chunks = [];

    for (let index = 0; index < paragraph.length; index += maxChars) {
      chunks.push(paragraph.slice(index, index + maxChars).trim());
    }

    return chunks.filter(Boolean);
  }

  const chunks = [];
  let currentChunk = "";

  sentences.forEach((sentence) => {
    const nextChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;

    if (nextChunk.length <= maxChars) {
      currentChunk = nextChunk;
      return;
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    currentChunk = sentence;
  });

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(Boolean);
}

function splitIntoChunks(text = "", maxChars = MAX_CHUNK_CHARS) {
  const normalizedText = normalizeWhitespace(text);

  if (!normalizedText) {
    return [];
  }

  const paragraphs = normalizedText.split(/\n{2,}/).filter(Boolean);
  const chunks = [];
  let currentChunk = "";

  paragraphs.forEach((paragraph) => {
    if (paragraph.length > maxChars) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      splitLongParagraph(paragraph, maxChars).forEach((part) => {
        chunks.push(part.trim());
      });
      return;
    }

    const nextChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;

    if (nextChunk.length <= TARGET_CHUNK_CHARS) {
      currentChunk = nextChunk;
      return;
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    currentChunk = paragraph;
  });

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(Boolean);
}

function parseStructuredSections(text, documentInfo) {
  const cleanedText = stripNoiseLines(text);
  const lines = cleanedText.split("\n");
  const sections = [];
  const preambleLines = [];
  let currentSectionLabel = "";
  let currentChapterLabel = "";
  let currentRecord = null;
  let sectionOrder = 0;

  function finalizeCurrentRecord() {
    if (!currentRecord) {
      return;
    }

    const sectionText = linesToText(currentRecord.lines);

    sections.push({
      doc_id: documentInfo.docId,
      title: documentInfo.title,
      source_document: documentInfo.sourceDocument,
      processed_text_file: documentInfo.processedTextFile,
      section_order: sectionOrder,
      section_type: "article",
      section_number: currentRecord.articleNumber,
      section_label: currentRecord.articleLabel,
      section_title: currentRecord.sectionTitle || "",
      chapter: currentRecord.chapter || "",
      section: currentRecord.section || "",
      text: sectionText,
    });

    currentRecord = null;
    sectionOrder += 1;
  }

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const line = normalizeWhitespace(rawLine);

    if (!line) {
      if (currentRecord) {
        currentRecord.lines.push("");
      } else if (preambleLines.length > 0) {
        preambleLines.push("");
      }
      continue;
    }

    if (isSectionHeading(line)) {
      finalizeCurrentRecord();
      const heading = buildHeadingLabel(line, lines, index);
      currentSectionLabel = heading.label;
      if (heading.consumedNext) {
        index += 1;
      }
      continue;
    }

    if (isChapterHeading(line)) {
      finalizeCurrentRecord();
      const heading = buildHeadingLabel(line, lines, index);
      currentChapterLabel = heading.label;
      if (heading.consumedNext) {
        index += 1;
      }
      continue;
    }

    const articleHeading = parseArticleHeading(line);
    if (articleHeading) {
      finalizeCurrentRecord();

      currentRecord = {
        articleNumber: articleHeading.articleNumber,
        articleLabel: articleHeading.articleLabel,
        sectionTitle: articleHeading.sectionTitle,
        chapter: currentChapterLabel,
        section: currentSectionLabel,
        lines: articleHeading.bodyText ? [articleHeading.bodyText] : [],
      };
      continue;
    }

    if (currentRecord) {
      currentRecord.lines.push(line);
      continue;
    }

    preambleLines.push(line);
  }

  finalizeCurrentRecord();

  const preambleText = linesToText(preambleLines);

  if (preambleText) {
    sections.unshift({
      doc_id: documentInfo.docId,
      title: documentInfo.title,
      source_document: documentInfo.sourceDocument,
      processed_text_file: documentInfo.processedTextFile,
      section_order: -1,
      section_type: "preamble",
      section_number: null,
      section_label: "Preamble",
      section_title: "",
      chapter: "",
      section: "",
      text: preambleText,
    });
  }

  return sections.filter((section) => section.text);
}

function buildSearchText(chunk) {
  return normalizeWhitespace(
    [
      chunk.title,
      chunk.section,
      chunk.chapter,
      chunk.section_label,
      chunk.section_title,
      chunk.text,
    ]
      .filter(Boolean)
      .join(" "),
  ).toLowerCase();
}

function buildChunksFromSections(sections) {
  const chunks = [];

  sections.filter(Boolean).forEach((section) => {
    const sectionChunks = splitIntoChunks(section.text);
    const totalChunks = sectionChunks.length || 1;

    (sectionChunks.length > 0 ? sectionChunks : [section.text]).forEach(
      (chunkText, index) => {
        const sectionSlug =
          section.section_type === "article" && section.section_number !== null
            ? `article-${section.section_number}`
            : slugify(section.section_label || section.section_type || "section");

        const chunk = {
          id: `${section.doc_id}::${sectionSlug}::chunk-${index + 1}`,
          doc_id: section.doc_id,
          title: section.title,
          source_document: section.source_document,
          processed_text_file: section.processed_text_file,
          section_order: section.section_order,
          chunk_index: index + 1,
          total_chunks_in_section: totalChunks,
          section_type: section.section_type,
          section_number: section.section_number,
          section_label: section.section_label,
          section_title: section.section_title,
          chapter: section.chapter,
          section: section.section,
          text: chunkText,
          character_count: chunkText.length,
        };

        chunk.search_text = buildSearchText(chunk);
        chunks.push(chunk);
      },
    );
  });

  return chunks;
}

function loadReferenceTexts(referenceDir) {
  const metadataRows = readReferenceMetadata(referenceDir);
  const metadataByOutputFile = new Map(
    metadataRows.map((row) => [row.output_file, row]),
  );

  return fs
    .readdirSync(referenceDir)
    .filter((entry) => path.extname(entry).toLowerCase() === ".txt")
    .sort((left, right) => left.localeCompare(right))
    .map((entry) => {
      const filePath = path.join(referenceDir, entry);
      const stem = path.basename(entry, ".txt");
      const metadata = metadataByOutputFile.get(entry) || {};
      const rawText = fs.readFileSync(filePath, "utf8");
      const text = normalizeWhitespace(rawText);

      return {
        docId: slugify(stem),
        title: resolveDocumentTitle(text, stem),
        sourceDocument: metadata.source_file || entry,
        processedTextFile: entry,
        text,
      };
    });
}

function main() {
  const referenceDir = process.argv[2] || DEFAULT_REFERENCE_DIR;
  const outputPath = process.argv[3] || DEFAULT_OUTPUT_PATH;
  const metadataPath = process.argv[4] || DEFAULT_METADATA_PATH;

  if (!fs.existsSync(referenceDir)) {
    throw new Error(`Reference directory not found at ${referenceDir}`);
  }

  const documents = loadReferenceTexts(referenceDir);

  if (documents.length === 0) {
    throw new Error(`No processed law text files found in ${referenceDir}`);
  }

  const sections = documents.flatMap((documentInfo) =>
    parseStructuredSections(documentInfo.text, documentInfo),
  );
  const chunks = buildChunksFromSections(sections);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });

  fs.writeFileSync(outputPath, `${JSON.stringify(chunks, null, 2)}\n`, "utf8");

  const metadata = {
    reference_directory: referenceDir,
    output_file: outputPath,
    document_count: documents.length,
    section_count: sections.length,
    chunk_count: chunks.length,
    source_documents: documents.map((documentInfo) => ({
      doc_id: documentInfo.docId,
      title: documentInfo.title,
      source_document: documentInfo.sourceDocument,
      processed_text_file: documentInfo.processedTextFile,
    })),
  };

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  console.log(`Processed ${documents.length} laws into ${chunks.length} chunks.`);
  console.log(`Chunk dataset: ${outputPath}`);
  console.log(`Chunk metadata: ${metadataPath}`);
}

main();
