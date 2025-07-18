const PackageSale = require('../models/PackageSale');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');

// Paket satışına ödeme ekle
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, note } = req.body;

    // Zorunlu alanları kontrol et
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: 'Geçerli bir ödeme tutarı girilmelidir.'
      });
    }

    const packageSale = await PackageSale.findById(id);
    if (!packageSale) {
      return res.status(404).json({ message: 'Paket satışı bulunamadı.' });
    }

    // Kalan tutardan fazla ödeme yapılmamalı
    if (amount > packageSale.remainingAmount) {
      return res.status(400).json({
        message: `Ödeme tutarı kalan tutardan fazla olamaz. Kalan tutar: ${packageSale.remainingAmount}`
      });
    }

    // Ödeme bilgilerini ekle
    if (!packageSale.payments) {
      packageSale.payments = [];
    }

    packageSale.payments.push({
      amount,
      paymentMethod: paymentMethod || 'cash',
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes: note
    });

    // Ödenen tutarı güncelle
    packageSale.paidAmount += parseFloat(amount);
    packageSale.remainingAmount = packageSale.totalAmount - packageSale.paidAmount;

    // Tüm ödeme yapıldıysa durumu güncelle
    if (packageSale.remainingAmount <= 0) {
      packageSale.status = 'completed';
    }

    await packageSale.save();

    // Populate edilmiş veriyi döndür
    const populated = await PackageSale.findById(packageSale._id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration');

    res.status(200).json({
      message: 'Ödeme başarıyla kaydedildi.',
      data: populated
    });

  } catch (error) {
    console.error('addPayment error:', error);
    res.status(500).json({
      message: 'Ödeme kaydedilirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  addPayment: exports.addPayment
};