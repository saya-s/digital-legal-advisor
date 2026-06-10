// Reuse clause splitting and labeling so validation can look for legal structure, not only keywords.
const { splitIntoClauses, labelClause } = require("./clauses");

// Strong phrases that are very common in real contracts and legal agreements.
// Change or add phrases here if you want stricter or broader validation.
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

// General contract-related words that provide weaker but still useful evidence.
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

// File-name hints that can help when the content is short but the file name is informative.
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

// Clean whitespace so matching behaves consistently.
function normalizeWhitespace(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

// Lowercase and strip punctuation to make text easier to search.
function normalizeForSearch(value = "") {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Add spaces around the text so whole-phrase checks do not match inside larger words.
function padForWholePhraseMatch(value = "") {
  const normalized = normalizeForSearch(value);
  return normalized ? ` ${normalized} ` : " ";
}

// Check whether a full phrase exists in normalized text.
function containsWholePhrase(paddedText = " ", phrase = "") {
  const normalizedPhrase = normalizeForSearch(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  return paddedText.includes(` ${normalizedPhrase} `);
}

// Return only the phrases that were actually found.
function collectMatches(paddedText = " ", phrases = []) {
  return phrases.filter((phrase) => containsWholePhrase(paddedText, phrase));
}

// Use early clause labels as another signal that the document behaves like a contract.
function collectSpecificClauseLabels(text = "", clauseTexts = []) {
  const sourceClauses =
    Array.isArray(clauseTexts) && clauseTexts.length > 0
      ? clauseTexts
      : splitIntoClauses(text);

  return sourceClauses
    // Use the first part of the document because contract structure is usually clearest there.
    .slice(0, 24)
    .map((clauseText, index) => {
      // Neighbor clauses help the labeler understand the local context.
      const previousClause = sourceClauses[index - 1] || "";
      const nextClause = sourceClauses[index + 1] || "";
      const clauseContext = `${previousClause} ${nextClause}`;
      return labelClause(clauseText, clauseContext);
    })
    .filter((label) => label && label !== "General");
}

// Main validation helper: decide whether the uploaded document looks enough like a contract.
function assessContractDocument({ fileName = "", text = "", clauseTexts = [] }) {
  // Limit validation to the first chunk of text so very large files do not slow down checks.
  const normalizedText = normalizeForSearch(text).slice(0, 20000);
  const paddedText = normalizedText ? ` ${normalizedText} ` : " ";
  const normalizedFileName = normalizeForSearch(fileName);
  const paddedFileName = normalizedFileName ? ` ${normalizedFileName} ` : " ";

  // STEP 1: Collect evidence from the document text and file name.
  const strongContractMatches = collectMatches(
    paddedText,
    STRONG_CONTRACT_PHRASES,
  );
  const contractKeywordMatches = collectMatches(paddedText, CONTRACT_KEYWORDS);
  const contractFileMatches = collectMatches(
    paddedFileName,
    CONTRACT_FILE_PATTERNS,
  );
  const specificClauseLabels = collectSpecificClauseLabels(text, clauseTexts);
  const uniqueSpecificClauseLabels = [...new Set(specificClauseLabels)];

  // STEP 2: Convert the collected evidence into a weighted score.
  // CHANGE HERE if you want stronger or weaker thresholds for validation.
  const contractScore =
    strongContractMatches.length * 4 +
    Math.min(contractKeywordMatches.length, 8) * 1.5 +
    uniqueSpecificClauseLabels.length * 2 +
    Math.min(specificClauseLabels.length, 4) * 0.75 +
    contractFileMatches.length * 2;

  // Strong signals can pass even if the numeric score is not very high.
  const hasCoreContractSignal =
    strongContractMatches.length >= 1 ||
    contractKeywordMatches.length >= 6 ||
    uniqueSpecificClauseLabels.length >= 2 ||
    (contractKeywordMatches.length >= 4 && uniqueSpecificClauseLabels.length >= 1);

  // Final pass/fail rule combining score and special-case strong evidence.
  const hasEnoughContractSignals =
    contractScore >= 10 ||
    hasCoreContractSignal ||
    (contractFileMatches.length >= 1 && contractKeywordMatches.length >= 4) ||
    (strongContractMatches.length >= 1 && contractKeywordMatches.length >= 3);

  return {
    // This is the value checked by analyzeControllers.js before contract analysis continues.
    isLikelyContract: hasEnoughContractSignals,
    contractScore: Number(contractScore.toFixed(2)),
    strongContractMatches,
    contractKeywordMatches,
    contractFileMatches,
    specificClauseLabels,
    uniqueSpecificClauseLabels,
  };
}

// Build a clear frontend error when the file fails validation.
function buildContractDocumentErrorMessage(fileName = "", assessment = {}) {
  const normalizedFileName = normalizeWhitespace(fileName) || "This file";
  const fileLead = normalizedFileName === "This file" ? normalizedFileName : `"${normalizedFileName}"`;

  return `${fileLead} does not look like a contract. Please upload an agreement, lease, NDA, employment contract, service contract, or similar legal document.`;
}

module.exports = {
  assessContractDocument,
  buildContractDocumentErrorMessage,
};
