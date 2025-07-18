const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 5 // minimum 5 dakika
  },
  price: {
    type: Number,
    required: true,
    min: 0 // minimum 0 TL
  }
}, { _id: false }); // _id alanı otomatik oluşturulmasın

const appointmentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD formatında
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  time: {
    type: String, // HH:MM formatında
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  services: [serviceSchema], // Hizmetler dizisi
  duration: {
    type: Number,
    required: true,
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  customerNotArrived: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Tarih ve saat birleşimi için bileşik unique index

// Toplam tutarı hesaplayan virtual alan (isteğe bağlı)
appointmentSchema.virtual('totalPrice').get(function() {
  return this.services.reduce((sum, service) => sum + (service.price || 0), 0);
});

// Randevu bitiş saatini hesaplayan virtual alan
appointmentSchema.virtual('endTime').get(function() {
  if (!this.time || !this.duration) return null;
  const [hours, minutes] = this.time.split(':').map(Number);
  const start = new Date(2000, 0, 1, hours, minutes);
  const end = new Date(start.getTime() + this.duration * 60000);
  return end.toTimeString().slice(0, 5);
});

module.exports = mongoose.model('Appointment', appointmentSchema);