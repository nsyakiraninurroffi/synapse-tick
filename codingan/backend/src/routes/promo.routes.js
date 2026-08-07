const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
const { createPromo, validatePromo, getPromosByEvent, deletePromo } = require('../controllers/promo.controller');

// Organizer: Manage promo codes
router.post('/', authMiddleware, roleMiddleware('organizer'), createPromo);
router.get('/event/:eventId', authMiddleware, roleMiddleware('organizer'), getPromosByEvent);
router.delete('/:id', authMiddleware, roleMiddleware('organizer'), deletePromo);

// Pengunjung: Validate promo code during checkout
router.post('/validate', authMiddleware, validatePromo);

module.exports = router;
