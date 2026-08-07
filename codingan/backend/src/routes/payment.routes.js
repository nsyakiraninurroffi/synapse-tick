const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const {
  createSnap,
  midtransNotification,
  paymentCallback,
  mockPaymentSuccess,
  checkPaymentStatus,
  topUpWallet,
} = require('../controllers/payment.controller');

// ── Midtrans Routes ──
router.post('/create-snap', authMiddleware, createSnap);
router.post('/midtrans-notification', midtransNotification); // No auth — Midtrans webhook

// ── Legacy Routes ──
router.post('/callback', paymentCallback);
router.post('/mock-success', mockPaymentSuccess);

// ── Authenticated Routes ──
router.get('/status/:referenceId', authMiddleware, checkPaymentStatus);
router.post('/topup', authMiddleware, topUpWallet);

module.exports = router;
