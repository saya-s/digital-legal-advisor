const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const lawyerControllers = require('../controllers/lawyerControllers');
const templateControllers = require('../controllers/templateControllers');

// Auth Routes
router.post('/register', authControllers.register);
router.post('/google-auth', authControllers.googleAuth);
router.post('/login', authControllers.login);

// Service Routes
router.get('/templates', templateControllers.getTemplates);
router.get('/lawyers', lawyerControllers.getLawyers);

module.exports = router;