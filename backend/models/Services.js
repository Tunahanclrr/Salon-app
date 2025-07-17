// backend/models/serviceModel.js
const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hizmet adı zorunludur.'],
    unique: true,
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, 'Süre zorunludur.'],
    min: [1, 'Süre en az 1 dakika olmalıdır.'],
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);