const mongoose = require('mongoose');

const diagnosticTestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Test name is required'],
      trim: true,
      maxlength: [200, 'Test name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: ['BLOOD', 'URINE', 'IMAGING', 'CARDIAC', 'PATHOLOGY', 'RADIOLOGY', 'OTHER'],
        message: '{VALUE} is not a valid category',
      },
    },
  },
  {
    timestamps: true,
  }
);

diagnosticTestSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('DiagnosticTest', diagnosticTestSchema);
