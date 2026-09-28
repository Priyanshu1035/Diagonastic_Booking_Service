const sequelize = require('../../config/postgres');
const User = require('./User');
const Booking = require('./Booking');
const Payment = require('./Payment');

// Associations
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Booking.hasMany(Payment, { foreignKey: 'booking_id', as: 'payments' });
Payment.belongsTo(Booking, { foreignKey: 'booking_id', as: 'booking' });

module.exports = {
  sequelize,
  User,
  Booking,
  Payment,
};
