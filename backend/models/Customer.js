const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true, // Aynı numaradan birden fazla müşteri olmasın
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  isRegular: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
