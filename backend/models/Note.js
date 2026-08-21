const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    content: { type: String, trim: true, maxlength: 1000 },
    color: { type: String, default: '#f4f1ea' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);
