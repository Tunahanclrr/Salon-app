const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  duration: { type: Number, required: true } // dakika
});

module.exports = mongoose.model('Service', serviceSchema);