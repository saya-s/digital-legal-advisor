const { splitIntoClauses, labelClause } = require("./clauses");

const STRONG_CONTRACT_PHRASES = [
  "this agreement",
  "the parties",
  "effective date",
  "governing law",
  "term and termination",
  "payment terms",
  "confidential information",
  "non disclosure agreement",
  "scope of work",
  "services agreement",
  "employment agreement",
  "lease agreement",
  "in witness whereof",
];

const CONTRACT_KEYWORDS = [
  "agreement",
  "contract",
  "party",
  "parties",
  "shall",
  "obligation",
  "obligations",
  "payment",
  "invoice",
  "fee",
  "fees",
  "rent",
  "deposit",
  "termination",
  "notice",
  "confidentiality",
  "confidential",
  "liability",
  "damages",
  "breach",
  "jurisdiction",
  "arbitration",
  "signature",
  "client",
  "contractor",
  "employee",
  "employer",
  "tenant",
  "landlord",
  "buyer",
  "seller",
  "vendor",
  "supplier",
  "service provider",
];

const NON_CONTRACT_PHRASES = [
  "lecture",
  "slides",
  "slide deck",
  "chapter",
  "course",
  "syllabus",
  "assignment",
  "homework",
  "quiz",
  "exam",
  "student",
  "students",
  "university",
  "learning objectives",
  "learning outcomes",
  "table of contents",
  "bibliography",
  "reference list",
  "resource oriented architecture",
  "class notes",
];

const NON_CONTRACT_FILE_PATTERNS = [
  "lecture",
  "slides",
  "chapter",
  "notes",
  "syllabus",
  "assignment",
  "homework",
  "quiz",
  "exam",
  "lesson",
];

const CONTRACT_FILE_PATTERNS = [
  "contract",
  "agreement",
  "lease",
  "nda",
  "employment",
  "service",
  "vendor",
  "supplier",
  "consult",
  "terms",
];

function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeForSearch(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function padForWholePhraseMatch(value = "") {
  const normalized = normalizeForSearch(value);
  return normalized ? ` ${normalized} ` : " ";
}

function containsWholePhrase(paddedText = " ", phrase = "") {
  const normalizedPhrase = normalizeForSearch(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  return paddedText.includes(` ${normalizedPhrase} `);
}

function collectMatches(paddedText = " ", phrases = []) {
  return phrases.filter((phrase) => containsWholePhrase(paddedText, phrase));
}

function collectSpecificClauseLabels(text = "", clauseTexts = []) {
  const sourceClauses =
    Array.isArray(clauseTexts) && clauseTexts.length > 0
      ? clauseTexts
      : splitIntoClauses(text);

  return sourceClauses
    .slice(0, 24)
    .map((clauseText, index) => {
      const previousClause = sourceClauses[index - 1] || "";
      const nextClause = sourceClauses[index + 1] || "";
      const clauseContext = `${previousClause} ${nextClause}`;
      return labelClause(clauseText, clauseContext);
    })
    .filter((label) => label && label !== "General");
}

function assessContractDocument({ fileName = "", text = "", clauseTexts = [] }) {
  const normalizedText = normalizeForSearch(text).slice(0, 20000);
  const paddedText = normalizedText ? ` ${normalizedText} ` : " ";
  const normalizedFileName = normalizeForSearch(fileName);
  const paddedFileName = normalizedFileName ? ` ${normalizedFileName} ` : " ";

  const strongContractMatches = collectMatches(
    paddedText,
    STRONG_CONTRACT_PHRASES,
  );
  const contractKeywordMatches = collectMatches(paddedText, CONTRACT_KEYWORDS);
  const nonContractMatches = collectMatches(paddedText, NON_CONTRACT_PHRASES);
  const contractFileMatches = collectMatches(
    paddedFileName,
    CONTRACT_FILE_PATTERNS,
  );
  const nonContractFileMatches = collectMatches(
    paddedFileName,
    NON_CONTRACT_FILE_PATTERNS,
  );
  const specificClauseLabels = collectSpecificClauseLabels(text, clauseTexts);
  const uniqueSpecificClauseLabels = [...new Set(specificClauseLabels)];

  const contractScore =
    strongContractMatches.length * 4 +
    Math.min(contractKeywordMatches.length, 8) * 1.5 +
    uniqueSpecificClauseLabels.length * 2 +
    Math.min(specificClauseLabels.length, 4) * 0.75 +
    contractFileMatches.length * 2;
  const nonContractScore =
    nonContractMatches.length * 3 + nonContractFileMatches.length * 4;
  const hasCoreContractSignal =
    strongContractMatches.length >= 1 ||
    contractKeywordMatches.length >= 6 ||
    uniqueSpecificClauseLabels.length >= 2 ||
    (contractKeywordMatches.length >= 4 && uniqueSpecificClauseLabels.length >= 1);
  const looksNonContract =
    (nonContractFileMatches.length >= 1 &&
      !hasCoreContractSignal &&
      contractScore < 10) ||
    (nonContractScore >= 9 && contractScore < 10) ||
    (!hasCoreContractSignal && contractScore < 7) ||
    (nonContractMatches.length >= 2 &&
      uniqueSpecificClauseLabels.length === 0 &&
      contractKeywordMatches.length < 4);

  return {
    isLikelyContract: !looksNonContract,
    contractScore: Number(contractScore.toFixed(2)),
    nonContractScore: Number(nonContractScore.toFixed(2)),
    strongContractMatches,
    contractKeywordMatches,
    nonContractMatches,
    contractFileMatches,
    nonContractFileMatches,
    specificClauseLabels,
    uniqueSpecificClauseLabels,
  };
}

function buildContractDocumentErrorMessage(fileName = "", assessment = {}) {
  const looksAcademic =
    (assessment.nonContractFileMatches || []).length > 0 ||
    (assessment.nonContractMatches || []).length > 0;
  const normalizedFileName = normalizeWhitespace(fileName) || "This file";
  const fileLead = normalizedFileName === "This file" ? normalizedFileName : `"${normalizedFileName}"`;

  if (looksAcademic) {
    return `${fileLead} does not look like a contract. It seems closer to lecture slides, notes, or another general document. Please upload an agreement, lease, NDA, employment contract, service contract, or similar legal document.`;
  }

  return `${fileLead} does not look enough like a contract for reliable analysis. Please upload an agreement, lease, NDA, employment contract, service contract, or similar legal document.`;
}

module.exports = {
  assessContractDocument,
  buildContractDocumentErrorMessage,
};
