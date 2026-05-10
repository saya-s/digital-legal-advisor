const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const EXTRACTION_TIMEOUT_MS = 15000;

function withTimeout(promise, errorMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, EXTRACTION_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function extractTextFromFile(file) {
  if (!file?.buffer || !file?.originalname) {
    throw new Error("Uploaded file data is missing.");
  }

  const fileName = file.originalname.toLowerCase();

  if (file.mimetype === "text/plain" || fileName.endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    const result = await withTimeout(
      mammoth.extractRawText({ buffer: file.buffer }),
      "Text extraction took too long. Try a smaller DOCX file.",
    );
    return result.value;
  }

  if (file.mimetype === "application/pdf" || fileName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });

    try {
      const result = await withTimeout(
        parser.getText(),
        "PDF text extraction took too long. Try a smaller or text-based PDF.",
      );
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  throw new Error("Only PDF, DOCX, and TXT files are supported right now.");
}

module.exports = extractTextFromFile;
