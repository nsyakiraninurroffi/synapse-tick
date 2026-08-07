const express = require('express');
const { verifyGate, syncOfflineLogs, downloadEventTickets } = require('../controllers/gate.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/verify', authenticate, authorize('staff', 'organizer'), verifyGate);
router.post('/sync', authenticate, authorize('staff', 'organizer'), syncOfflineLogs);
router.get('/download/:eventId', authenticate, authorize('staff', 'organizer'), downloadEventTickets);

module.exports = router;
