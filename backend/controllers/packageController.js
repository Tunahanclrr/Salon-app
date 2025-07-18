const Package = require('../models/Package');
const Service = require('../models/Services');

// Tüm paketleri getir
exports.getAllPackages = async (req, res) => {
  try {
    const { active } = req.query;
    
    let filter = {};
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    const packages = await Package.find(filter)
      .populate('services.service', 'name price duration')
      .sort({ createdAt: -1 });

    res.status(200).json({ packages });
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
      .populate('services.service', 'name price duration');

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
    const { name, description, services, price, validityPeriod, isActive } = req.body;

    // Zorunlu alanları kontrol et
    if (!name || !services || !services.length || price === undefined) {
      return res.status(400).json({
        message: 'Paket adı, en az bir hizmet ve fiyat zorunludur.'
      });
    }

    // Hizmetleri doğrula
    const serviceIds = services.map(s => s.service);
    const foundServices = await Service.find({ _id: { $in: serviceIds } });

    if (foundServices.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Bazı hizmetler bulunamadı.' });
    }

    // Paket oluştur
    const newPackage = new Package({
      name,
      description,
      services,
      price,
      validityPeriod: validityPeriod || 365,
      isActive: isActive !== undefined ? isActive : true
    });

    await newPackage.save();

    // Populate edilmiş veriyi döndür
    const populated = await Package.findById(newPackage._id)
      .populate('services.service', 'name price duration');

    res.status(201).json({
      message: 'Paket başarıyla oluşturuldu.',
      data: populated
    });

  } catch (error) {
    console.error('createPackage error:', error);
    res.status(500).json({
      message: 'Paket oluşturulurken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Paket güncelle
exports.updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, services, price, validityPeriod, isActive } = req.body;

    // Paketi bul
    const package = await Package.findById(id);
    if (!package) {
      return res.status(404).json({ message: 'Paket bulunamadı.' });
    }

    // Hizmetleri doğrula
    if (services && services.length) {
      const serviceIds = services.map(s => s.service);
      const foundServices = await Service.find({ _id: { $in: serviceIds } });

      if (foundServices.length !== serviceIds.length) {
        return res.status(400).json({ message: 'Bazı hizmetler bulunamadı.' });
      }
    }

    // Paketi güncelle
    if (name) package.name = name;
    if (description !== undefined) package.description = description;
    if (services && services.length) package.services = services;
    if (price !== undefined) package.price = price;
    if (validityPeriod) package.validityPeriod = validityPeriod;
    if (isActive !== undefined) package.isActive = isActive;

    await package.save();

    // Populate edilmiş veriyi döndür
    const populated = await Package.findById(id)
      .populate('services.service', 'name price duration');

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