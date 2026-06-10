
//this connects each route to the correct controller function
//this ads middleware like protect for routes that need authentication

const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const compareControllers = require("../controllers/compareControllers");
const legalDictionaryController = require("../controllers/legalDictionaryController");
const legalQaController = require("../controllers/legalQaController");
const lawyerControllers = require('../controllers/lawyerControllers');
const templateControllers = require('../controllers/templateControllers');
const protect = require('../middleware/middleware');
const historyControllers = require("../controllers/historyControllers");
const clauseExplainerController = require("../controllers/clauseExplainerController");
const multer = require("multer");
const analyzeControllers = require("../controllers/upload/analyzeControllers");

const MAX_UPLOAD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
  },
});

function handleUpload(middleware) {
  return (req, res, next) => {
    middleware(req, res, (error) => {
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

      if (error) {
        return res.status(400).json({
          error: error.message || "Could not process the uploaded file.",
        });
      }

      return next();
    });
  };
}

// Protected route so that only the people loged in can see it 
router.get('/dashboard-data', protect, (req, res) => {
  res.json({ message: `Welcome User ${req.user.id}, here is your private data.` });
});

// Auth Routes
router.post('/register', authControllers.register);
router.post('/google-auth', authControllers.googleAuth);
router.post('/google-login', authControllers.googleLogin);
router.post('/login', authControllers.login);
router.post('/forgot-password', authControllers.requestPasswordReset);
router.post('/reset-password', authControllers.resetPassword);

// Service Routes
router.get('/templates', templateControllers.getTemplates);
router.get('/lawyers', lawyerControllers.getLawyers);
router.get("/legal-dictionary/search", protect, legalDictionaryController.searchDictionary);

//history routes
router.post("/history", protect, historyControllers.saveHistory);
router.get("/history", protect, historyControllers.getHistory);

//lawyer routes
router.get("/lawyers/:id", lawyerControllers.getLawyerById);

//upload route
router.post(
  "/upload/analyze",
  protect,
  handleUpload(upload.single("contractFile")),
  analyzeControllers.analyzeContract
);

router.post(
  "/upload/explain-clause",
  protect,
  clauseExplainerController.explainClause,
);

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

router.post("/legal-qa", protect, legalQaController.askLegalQuestion);
router.post("/legal-qa/contract", protect, legalQaController.askLegalQuestion);

module.exports = router;
