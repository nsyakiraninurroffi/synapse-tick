const express = require('express');
const { body } = require('express-validator');
const {
  getAllEvents, getEventById, createEvent, updateEvent,
  deleteEvent, getMyEvents, togglePublish,
} = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/my', authenticate, authorize('organizer'), getMyEvents);
router.get('/:id', getEventById);

// Organizer only routes
router.post('/', authenticate, authorize('organizer'), [
  body('namaEvent').trim().notEmpty().withMessage('Nama event wajib diisi.'),
  body('lokasi').trim().notEmpty().withMessage('Lokasi wajib diisi.'),
  body('tanggal').isISO8601().withMessage('Format tanggal tidak valid.'),
  body('kapasitas').isInt({ min: 1 }).withMessage('Kapasitas harus bilangan positif.'),
], createEvent);

router.put('/:id', authenticate, authorize('organizer'), updateEvent);
router.delete('/:id', authenticate, authorize('organizer'), deleteEvent);
router.patch('/:id/publish', authenticate, authorize('organizer'), togglePublish);

module.exports = router;
