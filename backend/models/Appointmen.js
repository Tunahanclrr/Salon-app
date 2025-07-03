const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer', // az sonra bunu da oluşturacağız
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD formatında saklanabilir
    required: true
  },
  time: {
    type: String, // örnek: "14:00"
    required: true
  },
  service: {
    type: String,
    required: true // örnek: "Manikür"
  },
  duration: {
    type: Number, // dakika cinsinden
    required: true,
    default: 30
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
