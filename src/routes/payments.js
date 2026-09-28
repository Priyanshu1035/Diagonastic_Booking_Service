const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// POST /api/payments - Initiate payment (authenticated)
router.post(
  '/',
  authenticate,
  validate([
    body('booking_id')
      .notEmpty().withMessage('Booking ID is required')
      .isUUID().withMessage('Booking ID must be a valid UUID'),
  ]),
  paymentController.initiatePayment
);

// POST /api/payments/webhook - Payment webhook (no auth - simulates external provider)
router.post(
  '/webhook',
  validate([
    body('event_id')
      .notEmpty().withMessage('Event ID is required'),
    body('transaction_id')
      .notEmpty().withMessage('Transaction ID is required')
      .isUUID().withMessage('Transaction ID must be a valid UUID'),
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn(['SUCCESS', 'FAILED']).withMessage('Status must be SUCCESS or FAILED'),
  ]),
  paymentController.paymentWebhook
);

module.exports = router;
