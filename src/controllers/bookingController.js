const { Booking } = require('../models/pg');
const DiagnosticCentre = require('../models/mongo/DiagnosticCentre');
const DiagnosticTest = require('../models/mongo/DiagnosticTest');
const mongoose = require('mongoose');

// POST /api/bookings - Create a booking
exports.createBooking = async (req, res, next) => {
  try {
    const { centre_id, test_id, appointment_datetime } = req.body;

    // Validate MongoDB ObjectIds
    if (!mongoose.Types.ObjectId.isValid(centre_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid centre ID format.',
      });
    }
    if (!mongoose.Types.ObjectId.isValid(test_id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid test ID format.',
      });
    }

    // Validate appointment is in the future
    const appointmentDate = new Date(appointment_datetime);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date/time format.',
      });
    }
    if (appointmentDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment must be in the future.',
      });
    }

    // Fetch centre and verify test availability
    const centre = await DiagnosticCentre.findById(centre_id).populate('tests.test');
    if (!centre) {
      return res.status(404).json({
        success: false,
        message: 'Diagnostic centre not found.',
      });
    }

    const centreTest = centre.tests.find(
      (t) => t.test._id.toString() === test_id
    );
    if (!centreTest) {
      return res.status(400).json({
        success: false,
        message: 'This test is not available at the selected centre.',
      });
    }

    // Create booking
    const booking = await Booking.create({
      user_id: req.user.id,
      diagnostic_test_id: test_id,
      diagnostic_centre_id: centre_id,
      test_name: centreTest.test.name,
      centre_name: centre.name,
      appointment_datetime: appointmentDate,
      amount: centreTest.price,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please proceed to payment.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings - List user's bookings
exports.listBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = { user_id: req.user.id };

    if (status) {
      if (!Booking.STATUSES.includes(status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Booking.STATUSES.join(', ')}`,
        });
      }
      where.status = status.toUpperCase();
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows: bookings } = await Booking.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id - Get booking details
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Authorization: users can only see their own bookings
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this booking.',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/bookings/:id/cancel - Cancel a booking
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found.',
      });
    }

    // Authorization
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to cancel this booking.',
      });
    }

    // Only PENDING bookings can be cancelled
    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a booking with status '${booking.status}'. Only PENDING bookings can be cancelled.`,
      });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
