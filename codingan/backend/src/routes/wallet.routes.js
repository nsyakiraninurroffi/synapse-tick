const express = require('express');
const { getBalance, getWalletTransactions, updateNfcUid } = require('../controllers/wallet.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/balance', authenticate, getBalance);
router.get('/transactions', authenticate, getWalletTransactions);
router.put('/nfc', authenticate, updateNfcUid);

module.exports = router;
