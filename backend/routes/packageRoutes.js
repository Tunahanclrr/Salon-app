const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');

// Tüm paketleri getir
router.get('/', packageController.getAllPackages);

// Paket detayını getir
router.get('/:id', packageController.getPackageById);

// Yeni paket oluştur
router.post('/', packageController.createPackage);

// Paket güncelle
router.put('/:id', packageController.updatePackage);

// Paket sil
router.delete('/:id', packageController.deletePackage);

module.exports = router;