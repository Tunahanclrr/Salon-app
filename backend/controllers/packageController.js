const Package = require('../models/Package');
const Service = require('../models/Services');

// Tüm paketleri getir
exports.getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .populate('service', 'name price duration')
      .sort({ createdAt: -1 });

    res.status(200).json({ data: packages });
  } catch (error) {
    console.error('getAllPackages error:', error);
    res.status(500).json({
      message: 'Paketler yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Paket detayını getir
exports.getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const package = await Package.findById(id)
      .populate('service', 'name price duration');

    if (!package) {
      return res.status(404).json({ message: 'Paket bulunamadı.' });
    }

    res.status(200).json({ data: package });
  } catch (error) {
    console.error('getPackageById error:', error);
    res.status(500).json({
      message: 'Paket yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Yeni paket oluştur
exports.createPackage = async (req, res) => {
  try {
    console.log('Creating package with data:', req.body);
    const { quantity, type, service, price, isActive } = req.body;

    // Zorunlu alanları kontrol et
    if (!quantity || !type || !service || price === undefined) {
      console.log('Validation failed - missing required fields:', { quantity, type, service, price });
      return res.status(400).json({
        message: 'Miktar, tip, hizmet ve fiyat zorunludur.'
      });
    }

    // Tip kontrolü
    if (!['dakika', 'seans'].includes(type)) {
      console.log('Validation failed - invalid type:', type);
      return res.status(400).json({
        message: 'Tip sadece "dakika" veya "seans" olabilir.'
      });
    }

    // Hizmeti doğrula
    try {
      const foundService = await Service.findById(service);
      if (!foundService) {
        console.log('Service not found with ID:', service);
        return res.status(400).json({ message: 'Seçilen hizmet bulunamadı.' });
      }
    } catch (serviceError) {
      console.error('Error finding service:', serviceError);
      return res.status(400).json({ 
        message: 'Hizmet bilgisi alınırken bir hata oluştu.',
        error: process.env.NODE_ENV === 'development' ? serviceError.message : undefined
      });
    }

    // Paket oluştur
    try {
      const newPackage = new Package({
        quantity,
        type,
        service,
        price,
        isActive: isActive !== undefined ? isActive : true
      });

      console.log('Saving new package:', newPackage);
      await newPackage.save();

      // Populate edilmiş veriyi döndür
      const populated = await Package.findById(newPackage._id)
        .populate('service', 'name price duration');

      console.log('Package created successfully:', populated);
      return res.status(201).json({
        message: 'Paket başarıyla oluşturuldu.',
        data: populated
      });
    } catch (saveError) {
      console.error('Error saving package:', saveError);
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Geçersiz paket verisi',
          errors: saveError.errors
        });
      }
      throw saveError;
    }

  } catch (error) {
    console.error('Unexpected error in createPackage:', error);
    res.status(500).json({
      message: 'Paket oluşturulurken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    });
  }
};

// Paket güncelle
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type, service, price, isActive } = req.body;

    // Paketi bul
    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ message: 'Paket bulunamadı.' });
    }

    // Tip kontrolü
    if (type && !['dakika', 'seans'].includes(type)) {
      return res.status(400).json({
        message: 'Tip sadece "dakika" veya "seans" olabilir.'
      });
    }

    // Hizmeti doğrula
    if (service) {
      const foundService = await Service.findById(service);
      if (!foundService) {
        return res.status(400).json({ message: 'Seçilen hizmet bulunamadı.' });
      }
    }

    // Paketi güncelle
    if (quantity !== undefined) package.quantity = quantity;
    if (type) package.type = type;
    if (service) package.service = service;
    if (price !== undefined) package.price = price;
    if (isActive !== undefined) package.isActive = isActive;

    await package.save();

    // Populate edilmiş veriyi döndür
    const populated = await Package.findById(package._id)
      .populate('service', 'name price duration');

    res.status(200).json({
      message: 'Paket başarıyla güncellendi.',
      data: populated
    });

  } catch (error) {
    console.error('updatePackage error:', error);
    res.status(500).json({
      message: 'Paket güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Paket sil
exports.deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Package.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ message: 'Paket bulunamadı.' });
    }

    res.status(200).json({
      message: 'Paket başarıyla silindi.'
    });

  } catch (error) {
    console.error('deletePackage error:', error);
    res.status(500).json({
      message: 'Paket silinirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};