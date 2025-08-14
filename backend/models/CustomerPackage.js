const mongoose = require('mongoose');

const customerPackageSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  packageSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PackageSale',
    required: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  usedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'],
    default: 'active'
  },
  validUntil: {
    type: Date
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Kalan miktarı otomatik hesapla
customerPackageSchema.pre('save', function(next) {
  this.remainingQuantity = this.totalQuantity - this.usedQuantity;
  
  // Eğer tüm seanslar kullanıldıysa tamamlanmış olarak işaretle
  if (this.remainingQuantity <= 0) {
    this.status = 'completed';
  }
  
  // Eğer geçerlilik tarihi geçtiyse süresi dolmuş olarak işaretle
  if (this.validUntil && new Date() > this.validUntil) {
    this.status = 'expired';
  }
  
  next();
});

// Seans kullan
customerPackageSchema.methods.useSession = function(quantity = 1) {
  if (this.remainingQuantity < quantity) {
    throw new Error('Yetersiz seans hakkı');
  }
  
  this.usedQuantity += quantity;
  this.remainingQuantity = this.totalQuantity - this.usedQuantity;
  
  if (this.remainingQuantity <= 0) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Seans ekle (iade/geri yükleme)
customerPackageSchema.methods.addSession = function(quantity = 1) {
  if (this.usedQuantity < quantity) {
    throw new Error('İade edilecek seans sayısı kullanılan seans sayısından fazla olamaz');
  }
  
  this.usedQuantity -= quantity;
  this.remainingQuantity = this.totalQuantity - this.usedQuantity;
  
  // Eğer paket daha önce tamamlanmışsa ve seans eklendiyse aktif yap
  if (this.status === 'completed' && this.remainingQuantity > 0) {
    this.status = 'active';
  }
  
  return this.save();
};

// Kalan seans sayısını kontrol et
customerPackageSchema.methods.canUseSession = function(quantity = 1) {
  return this.remainingQuantity >= quantity && this.status === 'active';
};

module.exports = mongoose.model('CustomerPackage', customerPackageSchema);