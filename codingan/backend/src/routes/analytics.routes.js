const express = require('express');
const { getOrganizerDashboard, getEventAnalytics } = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/dashboard', authenticate, authorize('organizer'), getOrganizerDashboard);
router.get('/events/:eventId', authenticate, authorize('organizer'), getEventAnalytics);

module.exports = router;
