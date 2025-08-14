const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  quantity: {
    type: Number,
    required: [true, 'Miktar zorunludur.'],
    min: [1, 'Miktar en az 1 olmalıdır.']
  },
  type: {
    type: String,
    required: [true, 'Tip zorunludur.'],
    enum: ['dakika', 'seans'],
    default: 'seans'
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Hizmet seçimi zorunludur.']
  },
  price: {
    type: Number,
    required: [true, 'Fiyat zorunludur.'],
    min: [0, 'Fiyat 0 veya daha büyük olmalıdır.']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Package', packageSchema);