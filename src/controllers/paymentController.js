const { Payment, Booking, sequelize } = require('../models/pg');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

// POST /api/payments - Initiate a simulated payment
exports.initiatePayment = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { booking_id } = req.body;

    // Find booking
    const booking = await Booking.findByPk(booking_id, { transaction: t });

    if (!booking) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Authorization: only the booking owner can pay
    if (booking.user_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to make a payment for this booking.',
      });
    }

    // Only PENDING bookings can be paid for
    if (booking.status !== 'PENDING') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Cannot process payment for a booking with status '${booking.status}'.`,
      });
    }

    // Check for existing pending/successful payment
    const existingPayment = await Payment.findOne({
      where: { booking_id, status: { [Op.in]: ['PENDING', 'SUCCESS'] } },
      transaction: t,
    });

    if (existingPayment) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'A payment has already been initiated or completed for this booking.',
        data: { transaction_id: existingPayment.transaction_id, status: existingPayment.status },
      });
    }

    // Simulate payment processing
    const successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE) || 0.8;
    const isSuccess = Math.random() < successRate;
    const paymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';

    // Create payment record
    const payment = await Payment.create(
      {
        booking_id,
        transaction_id: uuidv4(),
        amount: booking.amount,
        status: paymentStatus,
        provider_response: {
          simulated: true,
          timestamp: new Date().toISOString(),
          result: paymentStatus,
        },
      },
      { transaction: t }
    );

    // Update booking status
    booking.status = isSuccess ? 'CONFIRMED' : 'FAILED';
    await booking.save({ transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: isSuccess
        ? 'Payment successful. Booking confirmed.'
        : 'Payment failed. Please try again.',
      data: {
        payment_id: payment.id,
        transaction_id: payment.transaction_id,
        amount: payment.amount,
        status: payment.status,
        booking_status: booking.status,
      },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// POST /api/payments/webhook - Handle payment webhook (idempotent)
exports.paymentWebhook = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { event_id, transaction_id, status } = req.body;

    // Validate status
    if (!['SUCCESS', 'FAILED'].includes(status)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status. Must be SUCCESS or FAILED.',
      });
    }

    // Idempotency check: look for existing payment with this event_id
    const existingEvent = await Payment.findOne({
      where: { webhook_event_id: event_id },
      transaction: t,
    });

    if (existingEvent) {
      await t.rollback();
      return res.status(200).json({
        success: true,
        message: 'Webhook event already processed.',
        data: {
          transaction_id: existingEvent.transaction_id,
          status: existingEvent.status,
        },
      });
    }

    // Find payment by transaction_id
    const payment = await Payment.findOne({
      where: { transaction_id },
      transaction: t,
    });

    if (!payment) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found for the given transaction ID.',
      });
    }

    // Update payment status and stamp event_id
    payment.status = status;
    payment.webhook_event_id = event_id;
    payment.provider_response = {
      ...payment.provider_response,
      webhook_event_id: event_id,
      webhook_status: status,
      webhook_received_at: new Date().toISOString(),
    };
    await payment.save({ transaction: t });

    // Update booking status accordingly
    const booking = await Booking.findByPk(payment.booking_id, { transaction: t });
    if (booking) {
      // Only update if booking hasn't been cancelled by the user
      if (booking.status !== 'CANCELLED') {
        booking.status = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';
        await booking.save({ transaction: t });
      }
    }

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully.',
      data: {
        transaction_id: payment.transaction_id,
        payment_status: payment.status,
        booking_status: booking ? booking.status : null,
      },
    });
  } catch (error) {
    await t.rollback();

    // Handle unique constraint violation on webhook_event_id (race condition)
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields?.webhook_event_id) {
      return res.status(200).json({
        success: true,
        message: 'Webhook event already processed (concurrent request).',
      });
    }

    next(error);
  }
};
