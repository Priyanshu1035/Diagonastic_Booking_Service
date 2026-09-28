const mongoose = require('mongoose');

const centreTestSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DiagnosticTest',
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Test price is required'],
    min: [0.01, 'Price must be greater than 0'],
  },
});

const diagnosticCentreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Centre name is required'],
      trim: true,
      maxlength: [200, 'Centre name cannot exceed 200 characters'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      pincode: {
        type: String,
        required: [true, 'Pincode is required'],
        trim: true,
      },
    },
    tests: [centreTestSchema],
  },
  {
    timestamps: true,
  }
);

diagnosticCentreSchema.index({ 'location.city': 1 });
diagnosticCentreSchema.index({ name: 'text', 'location.city': 'text' });

module.exports = mongoose.model('DiagnosticCentre', diagnosticCentreSchema);
