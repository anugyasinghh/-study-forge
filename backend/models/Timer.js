const mongoose = require('mongoose');

const timerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 40 },
    minutes: { type: Number, required: true, min: 1, max: 600 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Timer', timerSchema);
