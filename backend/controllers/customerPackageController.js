const CustomerPackage = require('../models/CustomerPackage');
const Package = require('../models/Package');
const Customer = require('../models/Customer');
const PackageSale = require('../models/PackageSale');
const mongoose = require('mongoose');

// Müşterinin paketlerini getir
exports.getCustomerPackages = async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log('🔍 Müşteri paketleri aranıyor:', customerId);

    // Convert customerId to ObjectId for proper querying
    const customerObjectId = new mongoose.Types.ObjectId(customerId);
    
    console.log('🔍 MongoDB Sorgusu:', { customer: customerObjectId });

    // CustomerPackage'ları bul
    const customerPackages = await CustomerPackage.find({ 
      customer: customerObjectId 
    })
    .populate('customer', 'name phone')
    .populate({
      path: 'package',
      populate: {
        path: 'service',
        model: 'Service'
      }
    })
    .populate('packageSale')
    .sort({ createdAt: -1 });

    console.log('📦 Bulunan müşteri paketleri sayısı:', customerPackages.length);
    console.log('📦 Paket detayları:', JSON.stringify(customerPackages, null, 2));
    
    if (customerPackages.length === 0) {
      // Müşteriye ait paket yoksa, müşteri ID'sini kontrol et
      const customerExists = await Customer.exists({ _id: customerObjectId });
      console.log('👤 Müşteri mevcut mu?', customerExists);
      
      if (!customerExists) {
        return res.status(404).json({ 
          message: 'Müşteri bulunamadı.',
          data: []
        });
      }
    }

    res.status(200).json({ 
      success: true,
      data: customerPackages 
    });
  } catch (error) {
    console.error('❌ getCustomerPackages error:', error);
    res.status(500).json({
      success: false,
      message: 'Müşteri paketleri yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Paket satışından müşteri paketi oluştur
exports.createCustomerPackage = async (req, res) => {
  try {
    const { customerId, packageId, packageSaleId, quantity } = req.body;
    console.log('🟢 Paket satışında gelen customerId:', customerId);

    // Paketi doğrula
    const package = await Package.findById(packageId);
    if (!package) {
      return res.status(404).json({ message: 'Paket bulunamadı.' });
    }

    // Müşteriyi doğrula
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı.' });
    }

    // Paket satışını doğrula
    const packageSale = await PackageSale.findById(packageSaleId);
    if (!packageSale) {
      return res.status(404).json({ message: 'Paket satışı bulunamadı.' });
    }

    // Müşteri paketi oluştur
    const customerPackage = new CustomerPackage({
      customer: customerId,
      package: packageId,
      packageSale: packageSaleId,
      totalQuantity: quantity,
      usedQuantity: 0,
      validUntil: packageSale.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: 'active',
      purchaseDate: new Date()
    });

    await customerPackage.save();

    // Müşteriye paketi ekle
    await Customer.findByIdAndUpdate(
      customerId,
      { $addToSet: { packages: customerPackage._id } },
      { new: true }
    );

    // Populate edilmiş veriyi döndür
    const populated = await CustomerPackage.findById(customerPackage._id)
      .populate('customer', 'name phone')
      .populate('package', 'quantity type service price')
      .populate('package.service', 'name')
      .populate('packageSale', 'purchaseDate');

    res.status(201).json({
      message: 'Müşteri paketi başarıyla oluşturuldu.',
      data: populated
    });

  } catch (error) {
    console.error('createCustomerPackage error:', error);
    res.status(500).json({
      message: 'Müşteri paketi oluşturulurken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Seans kullan
exports.useSession = async (req, res) => {
  try {
    const { customerPackageId } = req.params;
    const { quantity = 1 } = req.body;

    const customerPackage = await CustomerPackage.findById(customerPackageId);
    if (!customerPackage) {
      return res.status(404).json({ message: 'Müşteri paketi bulunamadı.' });
    }

    if (!customerPackage.canUseSession(quantity)) {
      return res.status(400).json({ 
        message: `Yetersiz seans hakkı. Kalan seans: ${customerPackage.remainingQuantity}` 
      });
    }

    await customerPackage.useSession(quantity);

    // Güncellenmiş veriyi döndür
    const updated = await CustomerPackage.findById(customerPackageId)
      .populate('package', 'quantity type service price')
      .populate('package.service', 'name')
      .populate('packageSale', 'purchaseDate');

    res.status(200).json({
      message: 'Seans başarıyla kullanıldı.',
      data: updated
    });

  } catch (error) {
    console.error('useSession error:', error);
    res.status(500).json({
      message: 'Seans kullanılırken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Müşteri paketini güncelle
exports.updateCustomerPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { validUntil, status } = req.body;

    const customerPackage = await CustomerPackage.findById(id);
    if (!customerPackage) {
      return res.status(404).json({ message: 'Müşteri paketi bulunamadı.' });
    }

    if (validUntil) customerPackage.validUntil = validUntil;
    if (status) customerPackage.status = status;

    await customerPackage.save();

    // Güncellenmiş veriyi döndür
    const updated = await CustomerPackage.findById(id)
      .populate('package', 'quantity type service price')
      .populate('package.service', 'name')
      .populate('packageSale', 'purchaseDate');

    res.status(200).json({
      message: 'Müşteri paketi başarıyla güncellendi.',
      data: updated
    });

  } catch (error) {
    console.error('updateCustomerPackage error:', error);
    res.status(500).json({
      message: 'Müşteri paketi güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Müşteri paketini sil
exports.deleteCustomerPackage = async (req, res) => {
  try {
    const { id } = req.params;

    const customerPackage = await CustomerPackage.findById(id);
    if (!customerPackage) {
      return res.status(404).json({ message: 'Müşteri paketi bulunamadı.' });
    }

    await CustomerPackage.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Müşteri paketi başarıyla silindi.'
    });

  } catch (error) {
    console.error('deleteCustomerPackage error:', error);
    res.status(500).json({
      message: 'Müşteri paketi silinirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 

// Tüm müşteri paketlerini getir (debug için)
exports.getAllCustomerPackages = async (req, res) => {
  try {
    console.log('🔍 Tüm müşteri paketleri aranıyor...');
    
    const customerPackages = await CustomerPackage.find()
      .populate('customer', 'name phone')
      .populate('package', 'quantity type service price')
      .populate('package.service', 'name')
      .populate('packageSale', 'purchaseDate')
      .sort({ createdAt: -1 });

    console.log('📦 Toplam müşteri paketi sayısı:', customerPackages.length);
    customerPackages.forEach(pkg => {
      console.log('CustomerPackage:', pkg._id.toString(), 'customer:', pkg.customer?._id?.toString(), 'name:', pkg.customer?.name);
    });
    console.log('📦 Paket detayları:', customerPackages);

    res.status(200).json({ data: customerPackages });
  } catch (error) {
    console.error('getAllCustomerPackages error:', error);
    res.status(500).json({
      message: 'Müşteri paketleri yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};