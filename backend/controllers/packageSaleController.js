const PackageSale = require('../models/PackageSale');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Service = require('../models/Services');
const CustomerPackage = require('../models/CustomerPackage');
const Package = require('../models/Package');
const { DateTime } = require('luxon');

// Yeni paket satışı oluştur
// In packageSaleController.js
exports.createPackageSale = async (req, res) => {
  try {
    const {
      customer,
      seller,
      services = [],
      package: packageId,
      paymentMethod,
      isInstallment = false,
      installmentCount = 1,
      notes,
      validUntil,
      totalAmount,
      discount = 0
    } = req.body;

    if (!customer || !seller || !packageId) {
      return res.status(400).json({ success: false, message: 'Müşteri, satıcı ve paket bilgileri zorunludur.' });
    }

    // Get the package with its service populated
    const packageDoc = await Package.findById(packageId).populate('service', 'name');
    if (!packageDoc) {
      return res.status(404).json({ success: false, message: 'Paket bulunamadı.' });
    }

    if (!packageDoc.service) {
      return res.status(400).json({ success: false, message: 'Paket için hizmet bilgisi bulunamadı.' });
    }

    // Create package sale with all required fields
    // Create package sale with all required fields
    const packageSale = new PackageSale({
      customer,
      seller,
      package: packageId,
      packageType: `${packageDoc.quantity} ${packageDoc.type}`,
      packageName: packageDoc.service.name,
      totalQuantity: packageDoc.quantity,
      services: services.map(s => ({
        service: s.service,
        quantity: s.quantity || 1,
        unitPrice: s.unitPrice || 0,
        totalPrice: (s.quantity || 1) * (s.unitPrice || 0),
        usedQuantity: 0
      })),
      paymentMethod: paymentMethod || 'cash',
      isInstallment,
      installmentCount: isInstallment ? Math.max(1, installmentCount) : 1,
      notes,
      validUntil: validUntil ? new Date(validUntil) : null,
      totalAmount: parseFloat(totalAmount) || 0,
      discount: parseFloat(discount) || 0,
      finalAmount: (parseFloat(totalAmount) || 0) - (parseFloat(discount) || 0),
      paidAmount: 0, // Initialize paid amount
      status: 'active' // Add status field
    });

    await packageSale.save();

    // Create customer package with all required fields
    const customerPackage = new CustomerPackage({
      customer,
      package: packageId,
      packageSale: packageSale._id,
      totalQuantity: packageDoc.quantity,
      usedQuantity: 0,
      remainingQuantity: packageDoc.quantity,
      status: 'active',
      purchaseDate: new Date()
    });

    await customerPackage.save();

    // Update customer with the new package sale
    await Customer.findByIdAndUpdate(customer, {
      $push: { 
        packageSales: packageSale._id, 
        customerPackages: customerPackage._id 
      }
    });

    // Populate and return the result with all necessary fields
    const result = await PackageSale.findById(packageSale._id)
      .populate('customer', 'name phone')
      .populate('seller', 'name')
      .populate('package', 'quantity type price')
      .populate('services.service', 'name');

    // Ensure the response includes all required fields
    const response = {
      ...result.toObject(),
      packageName: packageDoc.service?.name || 'Bilinmeyen Hizmet',
      packageType: packageDoc.type
    };

    res.status(201).json({ 
      success: true, 
      data: response,
      message: 'Paket satışı başarıyla oluşturuldu' 
    });

  } catch (error) {
    console.error('❌ Package sale error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Paket satışı oluşturulurken bir hata oluştu', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Tüm paket satışlarını getir
exports.getAllPackageSales = async (req, res) => {
  try {
    const { status, customer, seller, startDate, endDate } = req.query;
    
    let filter = {};
    
    if (status) filter.status = status;
    if (customer) filter.customer = customer;
    if (seller) filter.seller = seller;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const packageSales = await PackageSale.find(filter)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('package', 'quantity type service')
      .populate('services.service', 'name price duration')
      .populate({
        path: 'package',
        populate: {
          path: 'service',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ packageSales });
  } catch (error) {
    console.error('getAllPackageSales error:', error);
    res.status(500).json({
      message: 'Paket satışları yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Paket satışı detayını getir
exports.getPackageSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const packageSale = await PackageSale.findById(id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration');

    if (!packageSale) {
      return res.status(404).json({ message: 'Paket satışı bulunamadı.' });
    }

    res.status(200).json({ data: packageSale });
  } catch (error) {
    console.error('getPackageSaleById error:', error);
    res.status(500).json({
      message: 'Paket satışı yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Taksit ödemesi yap
exports.payInstallment = async (req, res) => {
  try {
    const { id, installmentIndex } = req.params;
    const { paymentMethod, paidDate } = req.body;

    const packageSale = await PackageSale.findById(id);
    if (!packageSale) {
      return res.status(404).json({ message: 'Paket satışı bulunamadı.' });
    }

    // Taksitli ödeme değilse veya taksit yoksa normal ödeme yap
    if (!packageSale.isInstallment || !packageSale.installments || packageSale.installments.length === 0 || !packageSale.installments[installmentIndex]) {
      // Taksit yoksa normal ödeme olarak kaydet
      const payment = {
        amount: req.body.amount || 0,
        paymentMethod: paymentMethod || 'cash',
        paymentDate: paidDate ? new Date(paidDate) : new Date(),
        description: req.body.description || ''
      };

      // Ödemeleri güncelle
      if (!packageSale.payments) {
        packageSale.payments = [];
      }
      packageSale.payments.push(payment);

      // Ödenen tutarı güncelle
      packageSale.paidAmount = (packageSale.paidAmount || 0) + (payment.amount || 0);
      
      // Kalan tutar 0 veya daha az ise durumu tamamlandı olarak işaretle
      if (packageSale.paidAmount >= packageSale.totalAmount) {
        packageSale.status = 'completed';
      }

      await packageSale.save();

      const populated = await PackageSale.findById(packageSale._id)
        .populate('customer', 'name email phone')
        .populate('seller', 'name role')
        .populate('services.service', 'name price duration');

      return res.status(200).json({
        message: 'Ödeme başarıyla kaydedildi.',
        data: populated
      });
    }

    // Taksitli ödeme ise taksiti kontrol et
    const installment = packageSale.installments[installmentIndex];
    
    if (installment.isPaid) {
      return res.status(400).json({ message: 'Bu taksit zaten ödenmiş.' });
    }

    // Taksiti ödenmiş olarak işaretle
    installment.isPaid = true;
    installment.paidDate = paidDate ? new Date(paidDate) : new Date();
    installment.paymentMethod = paymentMethod || installment.paymentMethod;

    await packageSale.save();

    const populated = await PackageSale.findById(packageSale._id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration');

    res.status(200).json({
      message: 'Taksit ödemesi başarıyla kaydedildi.',
      data: populated
    });

  } catch (error) {
    console.error('payInstallment error:', error);
    res.status(500).json({
      message: 'Taksit ödemesi kaydedilirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Hizmet kullan
exports.usePackageService = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceId, quantity = 1 } = req.body;

    const packageSale = await PackageSale.findById(id);
    if (!packageSale) {
      return res.status(404).json({ message: 'Paket satışı bulunamadı.' });
    }

    if (packageSale.status !== 'active') {
      return res.status(400).json({ message: 'Bu paket aktif değil.' });
    }

    await packageSale.useService(serviceId, quantity);

    const populated = await PackageSale.findById(packageSale._id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration');

    res.status(200).json({
      message: 'Hizmet kullanımı başarıyla kaydedildi.',
      data: populated
    });

  } catch (error) {
    console.error('usePackageService error:', error);
    res.status(500).json({
      message: error.message || 'Hizmet kullanımı kaydedilirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Paket satışını güncelle
exports.updatePackageSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const packageSale = await PackageSale.findById(id);
    if (!packageSale) {
      return res.status(404).json({ message: 'Paket satışı bulunamadı.' });
    }

    // Güncelleme yapılabilir alanları kontrol et
    const allowedUpdates = ['notes', 'status', 'validUntil', 'paidAmount'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));

    if (!isValidUpdate) {
      return res.status(400).json({ message: 'Geçersiz güncelleme alanları.' });
    }

    Object.assign(packageSale, updates);
    await packageSale.save();

    const populated = await PackageSale.findById(packageSale._id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration');

    res.status(200).json({
      message: 'Paket satışı başarıyla güncellendi.',
      data: populated
    });

  } catch (error) {
    console.error('updatePackageSale error:', error);
    res.status(500).json({
      message: 'Paket satışı güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Müşterinin aktif paketlerini getir
exports.getCustomerPackages = async (req, res) => {
  try {
    const { customerId } = req.params;

    const packages = await PackageSale.find({
      customer: customerId,
      status: { $in: ['active', 'completed'] }
    })
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration')
      .sort({ createdAt: -1 });

    res.status(200).json({ packages });
  } catch (error) {
    console.error('getCustomerPackages error:', error);
    res.status(500).json({
      message: 'Müşteri paketleri yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createPackageSale: exports.createPackageSale,
  getAllPackageSales: exports.getAllPackageSales,
  getPackageSaleById: exports.getPackageSaleById,
  payInstallment: exports.payInstallment,
  usePackageService: exports.usePackageService,
  updatePackageSale: exports.updatePackageSale,
  getCustomerPackages: exports.getCustomerPackages
};