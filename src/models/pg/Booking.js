const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres');

const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED'];

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  diagnostic_test_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'MongoDB ObjectId of the diagnostic test',
  },
  diagnostic_centre_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'MongoDB ObjectId of the diagnostic centre',
  },
  test_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  centre_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  appointment_datetime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: { msg: 'Must be a valid date' },
      isAfterNow(value) {
        if (new Date(value) <= new Date()) {
          throw new Error('Appointment must be in the future');
        }
      },
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0.01], msg: 'Amount must be greater than 0' },
    },
  },
  status: {
    type: DataTypes.ENUM(...BOOKING_STATUSES),
    defaultValue: 'PENDING',
    allowNull: false,
  },
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true,
});

Booking.STATUSES = BOOKING_STATUSES;

module.exports = Booking;
