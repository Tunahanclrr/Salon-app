const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Tüm paketleri getir
router.get('/', authenticateToken, requirePermission('canViewPackages'), packageController.getAllPackages);

// Paket detayını getir
router.get('/:id', authenticateToken, requirePermission('canViewPackages'), packageController.getPackageById);

// Yeni paket oluştur
router.post('/', authenticateToken, requirePermission('canEditPackages'), packageController.createPackage);

// Paket güncelle
router.put('/:id', authenticateToken, requirePermission('canEditPackages'), packageController.updatePackage);

// Paket sil
router.delete('/:id', authenticateToken, requirePermission('canEditPackages'), packageController.deletePackage);

module.exports = router;