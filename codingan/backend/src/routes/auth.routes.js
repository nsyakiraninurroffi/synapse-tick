const express = require('express');
const { body } = require('express-validator');
const { register, login, getMe, updateProfile, socialLogin } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi.'),
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid.'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  body('role').optional().isIn(['pengunjung', 'organizer', 'staff', 'vendor']).withMessage('Role tidak valid.'),
], register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid.'),
  body('password').notEmpty().withMessage('Password wajib diisi.'),
], login);

// POST /api/auth/social-login — OAuth social login callback (Google, Facebook, TikTok)
router.post('/social-login', [
  body('provider').notEmpty().withMessage('Provider wajib diisi.'),
  body('email').isEmail().normalizeEmail().withMessage('Email tidak valid.'),
], socialLogin);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

// PUT /api/auth/profile
router.put('/profile', authenticate, [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi.'),
], updateProfile);

module.exports = router;
