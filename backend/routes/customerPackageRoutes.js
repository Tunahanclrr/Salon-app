const express = require('express');
const router = express.Router();
const customerPackageController = require('../controllers/customerPackageController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Tüm müşteri paketlerini getir (debug için)
router.get('/debug/all', authenticateToken, requirePermission('canViewPackages'), customerPackageController.getAllCustomerPackages);

// Müşterinin paketlerini getir
router.get('/customer/:customerId', authenticateToken, requirePermission('canViewPackages'), customerPackageController.getCustomerPackages);

// Müşteri paketi oluştur
router.post('/', authenticateToken, requirePermission('canEditPackages'), customerPackageController.createCustomerPackage);

// Seans kullan
router.post('/:customerPackageId/use-session', authenticateToken, requirePermission('canEditPackages'), customerPackageController.useSession);

// Müşteri paketini güncelle
router.put('/:id', authenticateToken, requirePermission('canEditPackages'), customerPackageController.updateCustomerPackage);

// Müşteri paketini sil
router.delete('/:id', authenticateToken, requirePermission('canEditPackages'), customerPackageController.deleteCustomerPackage);

module.exports = router; 