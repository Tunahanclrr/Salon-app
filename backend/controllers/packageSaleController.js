const PackageSale = require('../models/PackageSale');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Service = require('../models/Services');
const { DateTime } = require('luxon');

// Yeni paket satışı oluştur
exports.createPackageSale = async (req, res) => {
  try {
    const {
      customer,
      seller,
      services,
      packageType,
      paymentMethod,
      isInstallment,
      installmentCount,
      notes,
      validUntil,
      paidAmount,
      totalAmount: frontendTotalAmount
    } = req.body;

    // Zorunlu alanları kontrol et
    if (!customer || !seller) {
      return res.status(400).json({
        message: 'Müşteri ve satıcı seçilmelidir.'
      });
    }
    
    // Services null veya undefined ise boş array olarak ayarla
    if (!services) {
      services = [];
    }

    // Hizmetleri doğrula ve fiyatları hesapla - sadece boş olmayan hizmetleri kontrol et
    const validServices = services.filter(s => s.service && s.service !== '');
    
    if (validServices.length === 0) {
      // Hiç hizmet yoksa sadece paket satışı yap
      const packageSale = new PackageSale({
        customer,
        seller,
        services: [],
        packageType: packageType || 'custom',
        totalAmount: frontendTotalAmount || 0,
        paidAmount: paidAmount || 0,
        paymentMethod: paymentMethod || 'cash',
        isInstallment: isInstallment || false,
        installmentCount: installmentCount || 1,
        notes,
        validUntil: validUntil ? new Date(validUntil) : null
      });

      await packageSale.save();

      // Müşteri ve çalışan ilişkilerini güncelle
      await Customer.findByIdAndUpdate(customer, {
        $addToSet: { packageSales: packageSale._id }
      });

      await Employee.findByIdAndUpdate(seller, {
        $addToSet: { packageSales: packageSale._id }
      });

      const populated = await PackageSale.findById(packageSale._id)
        .populate('customer', 'name email phone')
        .populate('seller', 'name role');

      return res.status(201).json({
        message: 'Paket satışı başarıyla oluşturuldu.',
        data: populated
      });
    }

    const serviceIds = validServices.map(s => s.service);
    const foundServices = await Service.find({ _id: { $in: serviceIds } });

    if (foundServices.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Bazı hizmetler bulunamadı.' });
    }

    // Hizmet detaylarını hazırla
    const packageServices = validServices.map(serviceItem => {
      const foundService = foundServices.find(s => s._id.toString() === serviceItem.service);
      const unitPrice = serviceItem.unitPrice || foundService.price;
      const quantity = serviceItem.quantity || 1;
      
      return {
        service: serviceItem.service,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: unitPrice * quantity,
        usedQuantity: 0
      };
    });

    // Frontend'den gelen toplam tutarı kullan, yoksa hesapla
    const totalAmount = frontendTotalAmount || packageServices.reduce((sum, service) => sum + service.totalPrice, 0);

    // Paket satışını oluştur
    const packageSale = new PackageSale({
      customer,
      seller,
      services: packageServices,
      packageType: packageType || 'custom',
      totalAmount,
      paidAmount: paidAmount || 0,
      paymentMethod: paymentMethod || 'cash',
      isInstallment: isInstallment || false,
      installmentCount: installmentCount || 1,
      notes,
      validUntil: validUntil ? new Date(validUntil) : null
    });

    // Taksitli ödeme ise taksitleri oluştur
    if (isInstallment && installmentCount > 1) {
      const installmentAmount = Math.ceil(totalAmount / installmentCount);
      const installments = [];
      
      // Eğer peşinat ödendiyse ilk taksit için
      const firstInstallmentPaid = paidAmount > 0;
      
      // Eğer taksit tarihleri belirtilmişse onları kullan, yoksa otomatik oluştur
      const installmentDates = req.body.installmentDates || [];
      
      for (let i = 0; i < installmentCount; i++) {
        // Kullanıcı tarafından belirtilen tarih varsa onu kullan, yoksa varsayılan hesapla
        let dueDate;
        if (installmentDates[i]) {
          dueDate = new Date(installmentDates[i]);
        } else {
          // Varsayılan olarak bugünden i ay sonrası
          dueDate = DateTime.now().plus({ months: i }).toJSDate();
        }
        
        const amount = i === installmentCount - 1 
          ? totalAmount - (installmentAmount * (installmentCount - 1)) // Son taksitte kalan tutarı ver
          : installmentAmount;
        
        installments.push({
          amount,
          dueDate,
          isPaid: i === 0 && firstInstallmentPaid, // İlk taksit peşinat ödendiyse ödenmiş olarak işaretle
          paymentMethod: paymentMethod || 'cash'
        });
      }
      
      packageSale.installments = installments;
    }

    await packageSale.save();

    // Müşteri ve çalışan ilişkilerini güncelle
    await Customer.findByIdAndUpdate(customer, {
      $addToSet: { packageSales: packageSale._id }
    });

    // Çalışan bilgilerini güncelle ve satış kaydını ekle
    await Employee.findByIdAndUpdate(seller, {
      $addToSet: { packageSales: packageSale._id }
    });

    // Populate edilmiş veriyi döndür
    const populated = await PackageSale.findById(packageSale._id)
      .populate('customer', 'name email phone')
      .populate('seller', 'name role')
      .populate('services.service', 'name price duration');

    res.status(201).json({
      message: 'Paket satışı başarıyla oluşturuldu.',
      data: populated
    });

  } catch (error) {
    console.error('createPackageSale error:', error);
    res.status(500).json({
      message: 'Paket satışı oluşturulurken bir hata oluştu.',
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
      .populate('services.service', 'name price duration')
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