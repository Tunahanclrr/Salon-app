const express = require('express');
const router = express.Router();
const packageSaleController = require('../controllers/packageSaleController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Paket satış rotaları
router.get('/package-sales', authenticateToken, requirePermission('canViewPackages'), packageSaleController.getAllPackageSales);
router.get('/package-sales/:id', authenticateToken, requirePermission('canViewPackages'), packageSaleController.getPackageSaleById);
router.post('/package-sales', authenticateToken, requirePermission('canEditPackages'), packageSaleController.createPackageSale);
router.put('/package-sales/:id', authenticateToken, requirePermission('canEditPackages'), packageSaleController.updatePackageSale);

// Taksit ödemeleri
router.post('/package-sales/:id/installments/:installmentIndex/pay', authenticateToken, requirePermission('canEditPackages'), packageSaleController.payInstallment);

// Tahsilat işlemleri
const paymentController = require('../controllers/paymentController');
router.post('/package-sales/:id/payments', authenticateToken, requirePermission('canEditPackages'), paymentController.addPayment);

// Hizmet kullanımı
router.post('/package-sales/:id/use-service', authenticateToken, requirePermission('canEditPackages'), packageSaleController.usePackageService);

// Müşteri paketleri
router.get('/customers/:customerId/packages', authenticateToken, requirePermission('canViewPackages'), packageSaleController.getCustomerPackages);

module.exports = router;