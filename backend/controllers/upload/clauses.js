// Change these rules if you want different clause categories or more keywords.
const CLAUSE_LABEL_RULES = [
  {
    label: "Termination",
    keywords: ["terminate", "termination", "cancel", "cancellation", "expiry"],
  },
  {
    label: "Payment",
    keywords: [
      "payment","invoice","fee",
      "amount","salary","compensation",
      "rent","base rent","security deposit",
    ],
  },
  {
    label: "Confidentiality",
    keywords: ["confidential", "non-disclosure", "nda", "secret", "proprietary"],
  },
  {
    label: "Liability",
    keywords: ["liability", "liable", "indemnify", "damages", "losses"],
  },
  {
    label: "Intellectual Property",
    keywords: ["intellectual property", "copyright", "ownership", "license"],
  },
  {
    label: "Governing Law",
    keywords: ["governing law", "jurisdiction", "dispute", "arbitration", "court"],
  },
];

// These patterns help the splitter recognize headings, numbered sections, and subclauses.
const NAMED_SECTION_PATTERN =
  /^(?:section|article|clause)\s+\d+[a-z0-9.\-]*\b/i;
const NUMBERED_SECTION_PATTERN =
  /^(?:(?:\d+(?:\.\d+)*)|[A-Z]|[a-z]|[IVXLCDM]+)[.)]\s+[A-Z]/;
const HEADING_WITH_COLON_PATTERN =
  /^[A-Z][A-Za-z0-9/&(),'\- ]{2,80}:\s*$/;
const ALL_CAPS_HEADING_PATTERN =
  /^(?:[A-Z][A-Z0-9/&(),'\-]*)(?:\s+[A-Z0-9/&(),'\-]+){0,8}$/;
const SUBCLAUSE_PATTERN =
  /^(?:\([a-z0-9]+\)|[a-z]\)|[ivxlcdm]+\)|\d+\.\d+)\s+/i;

// Clean raw extracted text so later splitting is more consistent.
function normalizeWhitespace(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Collapse a single text block into one trimmed line.
function normalizeBlock(text) {
  return text.replace(/\s+/g, " ").trim();
}

// Detect obvious starts of new contract sections.
function isStrongClauseStart(text) {
  return (
    NAMED_SECTION_PATTERN.test(text) ||
    NUMBERED_SECTION_PATTERN.test(text) ||
    HEADING_WITH_COLON_PATTERN.test(text)
  );
}

// Detect short standalone headings so they can be attached to the next clause.
function isStandaloneHeading(text) {
  const normalized = normalizeBlock(text);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  if (!normalized || wordCount > 10) {
    return false;
  }

  if (normalized.endsWith(".") || normalized.endsWith(";")) {
    return false;
  }

  return (
    HEADING_WITH_COLON_PATTERN.test(normalized) ||
    ALL_CAPS_HEADING_PATTERN.test(normalized) ||
    NAMED_SECTION_PATTERN.test(normalized)
  );
}

// First pass: break the extracted text into blocks based on lines and strong section starts.
function buildBlocks(text) {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return [];
  }

  const lines = normalized.split("\n");
  const blocks = [];
  let currentBlock = [];

  // Move the current buffered lines into the final block list.
  const flushBlock = () => {
    if (currentBlock.length === 0) {
      return;
    }

    const blockText = normalizeBlock(currentBlock.join(" "));
    if (blockText) {
      blocks.push(blockText);
    }
    currentBlock = [];
  };

  lines.forEach((rawLine) => {
    const line = normalizeBlock(rawLine);

    // Blank lines end the current block.
    if (!line) {
      flushBlock();
      return;
    }

    // A strong new heading usually means the previous clause/block is complete.
    if (
      currentBlock.length > 0 &&
      isStrongClauseStart(line) &&
      !SUBCLAUSE_PATTERN.test(line)
    ) {
      flushBlock();
    }

    currentBlock.push(line);
  });

  flushBlock();
  return blocks;
}

// Merge tiny fragments back into the previous clause so the output is less noisy.
function mergeShortClauses(clauses) {
  return clauses.reduce((mergedClauses, clauseText) => {
    const normalized = normalizeBlock(clauseText);

    if (!normalized) {
      return mergedClauses;
    }

    if (
      normalized.length < 80 &&
      mergedClauses.length > 0 &&
      !isStrongClauseStart(normalized)
    ) {
      mergedClauses[mergedClauses.length - 1] = normalizeBlock(
        `${mergedClauses[mergedClauses.length - 1]} ${normalized}`,
      );
      return mergedClauses;
    }

    mergedClauses.push(normalized);
    return mergedClauses;
  }, []);
}

// Preferred strategy: use headings and section-start patterns to build clauses.
function buildHeadingAwareClauses(blocks) {
  const clauses = [];
  let currentClause = "";
  let pendingHeading = "";

  // Save the current assembled clause if it has content.
  const flushClause = () => {
    if (!currentClause) {
      return;
    }

    clauses.push(normalizeBlock(currentClause));
    currentClause = "";
  };

  blocks.forEach((block) => {
    // Headings are remembered and attached to the next real clause text.
    if (isStandaloneHeading(block)) {
      pendingHeading = pendingHeading
        ? `${pendingHeading} ${block}`
        : block;
      return;
    }

    const nextChunk = pendingHeading ? `${pendingHeading} ${block}` : block;
    // Start a new clause when a fresh heading or strong section start appears.
    const startsNewClause =
      !!currentClause && (pendingHeading || isStrongClauseStart(block));

    pendingHeading = "";

    if (startsNewClause) {
      flushClause();
    }

    currentClause = currentClause ? `${currentClause} ${nextChunk}` : nextChunk;
  });

  if (pendingHeading) {
    currentClause = currentClause
      ? `${currentClause} ${pendingHeading}`
      : pendingHeading;
  }

  flushClause();
  return mergeShortClauses(clauses).filter((clause) => clause.length > 20);
}

// Fallback strategy: merge nearby paragraphs when the document does not have clear headings.
function buildParagraphClauses(blocks) {
  const clauses = [];
  let currentClause = "";
  let pendingHeading = "";

  // Save the current assembled clause if it has content.
  const flushClause = () => {
    if (!currentClause) {
      return;
    }

    clauses.push(normalizeBlock(currentClause));
    currentClause = "";
  };

  blocks.forEach((block) => {
    // Headings are remembered and attached to the next real clause text.
    if (isStandaloneHeading(block)) {
      pendingHeading = pendingHeading
        ? `${pendingHeading} ${block}`
        : block;
      return;
    }

    const nextChunk = pendingHeading ? `${pendingHeading} ${block}` : block;
    // Short paragraphs and subclauses are usually continuations of the same clause.
    const shouldAppend =
      !currentClause ||
      SUBCLAUSE_PATTERN.test(block) ||
      block.length < 120 ||
      currentClause.length < 120;

    pendingHeading = "";

    if (shouldAppend) {
      currentClause = currentClause ? `${currentClause} ${nextChunk}` : nextChunk;
      return;
    }

    flushClause();
    currentClause = nextChunk;
  });

  if (pendingHeading) {
    currentClause = currentClause
      ? `${currentClause} ${pendingHeading}`
      : pendingHeading;
  }

  flushClause();
  return mergeShortClauses(clauses).filter((clause) => clause.length > 20);
}

// Public helper: split extracted contract text into the most clause-like chunks we can detect.
function splitIntoClauses(text) {
  const blocks = buildBlocks(text);

  if (blocks.length === 0) {
    return [];
  }

  // Try the heading-aware strategy first because it gives cleaner legal sections.
  const headingAwareClauses = buildHeadingAwareClauses(blocks);

  if (headingAwareClauses.length > 1) {
    return headingAwareClauses;
  }

  // If the document structure is weak, fall back to paragraph grouping.
  return buildParagraphClauses(blocks);
}

// Public helper: assign one topic label to a clause using simple keyword matching.
function labelClause(clauseText, contextText = "") {
  const normalizedClause = `${clauseText} ${contextText}`.toLowerCase();

  // The first matching rule wins, so ordering above matters.
  const matchedRule = CLAUSE_LABEL_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedClause.includes(keyword)),
  );

  return matchedRule ? matchedRule.label : "General";
}

module.exports = {
  splitIntoClauses,
  labelClause,
};
