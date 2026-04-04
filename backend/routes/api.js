const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const lawyerControllers = require('../controllers/lawyerControllers');
const templateControllers = require('../controllers/templateControllers');
const protect = require('../middleware/middleware');
const historyControllers = require("../controllers/historyControllers");
const multer = require("multer");
const analyzeControllers = require("../controllers/upload/analyzeControllers");
const upload = multer({ storage: multer.memoryStorage() });

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

//history routes
router.post("/history", protect, historyControllers.saveHistory);
router.get("/history", protect, historyControllers.getHistory);

//lawyer routes
router.get("/lawyers/:id", lawyerControllers.getLawyerById);

//upload route
router.post(
  "/upload/analyze",
  protect,
  upload.single("contractFile"),
  analyzeControllers.analyzeContract
);

module.exports = router;
