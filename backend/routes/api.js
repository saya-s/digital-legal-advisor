// Build the main API router used under /api.
const express = require('express');
const router = express.Router();
// Controllers for authentication, document analysis, search, comparison, and history features.
const authControllers = require('../controllers/authControllers');
const compareControllers = require("../controllers/compareControllers");
const legalDictionaryController = require("../controllers/legalDictionaryController");
const legalQaController = require("../controllers/legalQaController");
const lawyerControllers = require('../controllers/lawyerControllers');
const templateControllers = require('../controllers/templateControllers');
const protect = require('../middleware/middleware');
const historyControllers = require("../controllers/historyControllers");
const clauseExplainerController = require("../controllers/clauseExplainerController");
// Multer handles uploaded files for analysis and comparison routes.
const multer = require("multer");
const analyzeControllers = require("../controllers/upload/analyzeControllers");

// Change this limit if you want to allow larger uploads.
const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// Store uploaded files in memory because the app immediately extracts text from them.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
  },
});

// Wrap multer so file-upload errors return clean JSON instead of default HTML errors.
function handleUpload(middleware) {
  return (req, res, next) => {
    middleware(req, res, (error) => {
      // Handle known multer-specific errors first, such as file size limits.
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: "File is too large. Upload a PDF, DOCX, or TXT file up to 10 MB.",
          });
        }

        return res.status(400).json({
          error: error.message || "Could not process the uploaded file.",
        });
      }

      // Handle any other upload/parsing errors next.
      if (error) {
        return res.status(400).json({
          error: error.message || "Could not process the uploaded file.",
        });
      }

      // Continue to the real controller when upload parsing succeeds.
      return next();
    });
  };
}

// Simple protected test route used to confirm the JWT middleware is working.
router.get('/dashboard-data', protect, (req, res) => {
  res.json({ message: `Welcome User ${req.user.id}, here is your private data.` });
});

// Authentication routes
router.post('/register', authControllers.register);
router.post('/google-auth', authControllers.googleAuth);
router.post('/google-login', authControllers.googleLogin);
router.post('/login', authControllers.login);
router.post('/forgot-password', authControllers.requestPasswordReset);
router.post('/reset-password', authControllers.resetPassword);

// Public directory/library routes
router.get('/templates', templateControllers.getTemplates);
router.get('/lawyers', lawyerControllers.getLawyers);

// Protected search route for the legal dictionary experience.
router.get("/legal-dictionary/search", protect, legalDictionaryController.searchDictionary);

// Protected history routes used by the dashboard and Q&A save flow.
router.post("/history", protect, historyControllers.saveHistory);
router.get("/history", protect, historyControllers.getHistory);

// Public route for one lawyer profile.
router.get("/lawyers/:id", lawyerControllers.getLawyerById);

// Protected upload-analysis route for one contract file.
router.post(
  "/upload/analyze",
  protect,
  handleUpload(upload.single("contractFile")),
  analyzeControllers.analyzeContract
);

// Protected AI clause explanation route for a selected clause.
router.post(
  "/upload/explain-clause",
  protect,
  clauseExplainerController.explainClause,
);

// Protected comparison route that supports either template mode or version-vs-version mode.
router.post(
  "/compare",
  protect,
  handleUpload(
    upload.fields([
      { name: "contractDocument", maxCount: 1 },
      { name: "originalDocument", maxCount: 1 },
      { name: "revisedDocument", maxCount: 1 },
    ]),
  ),
  compareControllers.compareDocuments,
);

// Protected legal Q&A routes. Both paths currently reuse the same controller.
router.post("/legal-qa", protect, legalQaController.askLegalQuestion);
router.post("/legal-qa/contract", protect, legalQaController.askLegalQuestion);

module.exports = router;
