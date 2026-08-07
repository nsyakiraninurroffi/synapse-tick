const express = require('express');
const { processBoothPayment, getVendorTransactions, getVendorsByEvent, registerVendor } = require('../controllers/vendor.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/pay', authenticate, authorize('vendor'), processBoothPayment);
router.get('/transactions', authenticate, authorize('vendor'), getVendorTransactions);
router.get('/event/:eventId', authenticate, getVendorsByEvent);
router.post('/register', authenticate, authorize('vendor'), registerVendor);

module.exports = router;
