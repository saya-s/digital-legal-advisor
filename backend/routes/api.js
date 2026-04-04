const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const lawyerControllers = require('../controllers/lawyerControllers');
const templateControllers = require('../controllers/templateControllers');
const protect = require('../middleware/authMiddleware');

//public route 
router.get('/status', (req, res) => res.json({ msg: "Online" }));

// Protected route so that only the people loged in can see it 
router.get('/dashboard-data', protect, (req, res) => {
  res.json({ message: `Welcome User ${req.user.id}, here is your private data.` });
});

// Auth Routes
router.post('/register', authControllers.register);
router.post('/google-auth', authControllers.googleAuth);
router.post('/login', authControllers.login);

// Service Routes
router.get('/templates', templateControllers.getTemplates);
router.get('/lawyers', lawyerControllers.getLawyers);

module.exports = router;