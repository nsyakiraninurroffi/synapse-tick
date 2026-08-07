const express = require('express');
const { bookTicket, getMyTickets, getTicketById, checkQueuePosition, refreshQrToken } = require('../controllers/ticket.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/my', authenticate, getMyTickets);
router.get('/queue/:eventId', authenticate, checkQueuePosition);
router.post('/book', authenticate, bookTicket);
// FIX: Added route for dynamic 30s QR code refresh
router.post('/:id/refresh-qr', authenticate, refreshQrToken);
router.get('/:id', authenticate, getTicketById);

module.exports = router;
