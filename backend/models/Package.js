const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Paket adı zorunludur.'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  services: [{
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  price: {
    type: Number,
    required: [true, 'Fiyat zorunludur.'],
    min: [0, 'Fiyat 0 veya daha büyük olmalıdır.'],
  },
  validityPeriod: {
    type: Number,
    default: 365,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);