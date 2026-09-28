const { DataTypes } = require('sequelize');
const sequelize = require('../../config/postgres');

const PAYMENT_STATUSES = ['PENDING', 'SUCCESS', 'FAILED'];

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'bookings', key: 'id' },
  },
  transaction_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(...PAYMENT_STATUSES),
    defaultValue: 'PENDING',
    allowNull: false,
  },
  webhook_event_id: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: true,
    comment: 'Unique event ID from webhook for idempotency',
  },
  provider_response: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

Payment.STATUSES = PAYMENT_STATUSES;

module.exports = Payment;
