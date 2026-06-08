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

module.exports = {
  cleanExtractedText,
};
