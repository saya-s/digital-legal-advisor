const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

async function extractTextFromFile(file) {
  const fileName = file.originalname.toLowerCase();

  if (file.mimetype === "text/plain" || fileName.endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  if (file.mimetype === "application/pdf" || fileName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Only PDF, DOCX, and TXT files are supported right now.");
}

module.exports = extractTextFromFile;
