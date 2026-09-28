const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/bookings
router.post(
  '/',
  authenticate,
  validate([
    body('centre_id').notEmpty().withMessage('Centre ID is required'),
    body('test_id').notEmpty().withMessage('Test ID is required'),
    body('appointment_datetime')
      .notEmpty().withMessage('Appointment date/time is required')
      .isISO8601().withMessage('Appointment must be a valid ISO 8601 date'),
  ]),
  bookingController.createBooking
);

// GET /api/bookings
router.get('/', authenticate, bookingController.listBookings);

// GET /api/bookings/:id
router.get('/:id', authenticate, bookingController.getBooking);

// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', authenticate, bookingController.cancelBooking);

module.exports = router;
