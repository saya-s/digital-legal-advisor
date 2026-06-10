// Clean common PDF/DOCX extraction noise before downstream parsing begins.
function cleanExtractedText(rawText) {
  return rawText
    // Normalize line endings and whitespace.
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\t/g, " ")
    // Remove page-count markers often added by PDF extraction.
    .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, "\n")
    // Drop lines that contain only page numbers.
    .replace(/^\s*\d+\s*$/gm, "")
    // Collapse repeated spaces and overly large blank gaps.
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n[ ]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

module.exports = {
  cleanExtractedText,
};
