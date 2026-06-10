// Extract raw text from DOCX files.
const mammoth = require("mammoth");
// Extract raw text from PDF files.
const { PDFParse } = require("pdf-parse");

// Change this if you want uploads to wait longer before timing out.
const EXTRACTION_TIMEOUT_MS = 15000;

// Wrap long-running extraction work so the server does not hang forever on bad files.
function withTimeout(promise, errorMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, EXTRACTION_TIMEOUT_MS);

    // Clear the timer whether extraction succeeds or fails.
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

// Main helper: detect the file type and return extracted plain text.
async function extractTextFromFile(file) {
  // Stop early if the upload object is incomplete.
  if (!file?.buffer || !file?.originalname) {
    throw new Error("Uploaded file data is missing.");
  }

  // Normalize the file name so extension checks are consistent.
  const fileName = file.originalname.toLowerCase();

  // TXT files are already plain text, so we can decode the buffer directly.
  if (file.mimetype === "text/plain" || fileName.endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  // DOCX files need a document parser that reads the text content out of the file.
  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.endsWith(".docx")
  ) {
    // Mammoth returns an object; the extracted text is in result.value.
    const result = await withTimeout(
      mammoth.extractRawText({ buffer: file.buffer }),
      "Text extraction took too long. Try a smaller DOCX file.",
    );
    return result.value;
  }

  // PDF files use a PDF parser because the text is stored differently from DOCX/TXT.
  if (file.mimetype === "application/pdf" || fileName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });

    try {
      // Some PDFs are very slow or image-based, so keep a timeout here too.
      const result = await withTimeout(
        parser.getText(),
        "PDF text extraction took too long. Try a smaller or text-based PDF.",
      );
      return result.text;
    } finally {
      // Always clean up parser resources even if extraction fails.
      await parser.destroy();
    }
  }

  // Reject any upload format the analyzer does not know how to read.
  throw new Error("Only PDF, DOCX, and TXT files are supported right now.");
}

module.exports = extractTextFromFile;
