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
    unique: true, //benzersiz baska telefon no girilmez
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
  },
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  packageSales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageSale'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
