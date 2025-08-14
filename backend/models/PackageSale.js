const mongoose = require('mongoose');

const packageSaleSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  packageName: {
    type: String,
    required: true
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
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    usedQuantity: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  packageType: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'installment'],
    default: 'cash'
  },
  installments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidDate: {
      type: Date
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      default: 'cash'
    }
  }],
  payments: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'transfer'],
      required: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  isInstallment: {
    type: Boolean,
    default: false
  },
  installmentCount: {
    type: Number,
    default: 1,
    min: 1
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  notes: {
    type: String,
    trim: true
  },
  validUntil: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Kalan tutarı otomatik hesapla
packageSaleSchema.pre('save', function(next) {
  // Eğer taksitli ödeme ise ve taksitler tanımlanmışsa
  if (this.isInstallment && this.installments.length > 0) {
    const paidInstallments = this.installments.filter(inst => inst.isPaid);
    this.paidAmount = paidInstallments.reduce((sum, inst) => sum + inst.amount, 0);
  }
  
  // Eğer payments varsa, ödemeleri de hesaba kat
  if (this.payments && this.payments.length > 0) {
    // Eğer taksitli ödeme değilse, ödemeleri topla
    if (!this.isInstallment) {
      this.paidAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
    }
    // Taksitli ödemede, ödemeler taksitlere yansıtılmış olmalı, ekstra hesaplama yapma
  }
  
  // Kalan tutarı hesapla
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // Durum güncelleme
  if (this.remainingAmount <= 0) {
    this.status = 'completed';
  } else if (this.validUntil && new Date() > this.validUntil) {
    this.status = 'expired';
  }
  
  next();
});

// Hizmet kullanım durumunu kontrol et
packageSaleSchema.methods.canUseService = function(serviceId, quantity = 1) {
  const servicePackage = this.services.find(s => s.service.toString() === serviceId.toString());
  if (!servicePackage) return false;
  
  return (servicePackage.quantity - servicePackage.usedQuantity) >= quantity;
};

// Hizmet kullan
packageSaleSchema.methods.useService = function(serviceId, quantity = 1) {
  const servicePackage = this.services.find(s => s.service.toString() === serviceId.toString());
  if (!servicePackage) throw new Error('Hizmet pakette bulunamadı');
  
  if (!this.canUseService(serviceId, quantity)) {
    throw new Error('Yetersiz hizmet hakkı');
  }
  
  servicePackage.usedQuantity += quantity;
  
  // Tüm hizmetler tükendiyse paketi tamamlanmış olarak işaretle
  const allServicesUsed = this.services.every(s => s.usedQuantity >= s.quantity);
  if (allServicesUsed && this.remainingAmount <= 0) {
    this.status = 'completed';
  }
  
  return this.save();
};

module.exports = mongoose.model('PackageSale', packageSaleSchema);