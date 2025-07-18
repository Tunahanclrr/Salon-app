const express = require('express');
const router = express.Router();
const packageSaleController = require('../controllers/packageSaleController');

// Paket satış rotaları
router.post('/package-sales', packageSaleController.createPackageSale);
router.get('/package-sales', packageSaleController.getAllPackageSales);
router.get('/package-sales/:id', packageSaleController.getPackageSaleById);
router.put('/package-sales/:id', packageSaleController.updatePackageSale);

// Taksit ödemeleri
router.post('/package-sales/:id/installments/:installmentIndex/pay', packageSaleController.payInstallment);

// Tahsilat işlemleri
const paymentController = require('../controllers/paymentController');
router.post('/package-sales/:id/payments', paymentController.addPayment);

// Hizmet kullanımı
router.post('/package-sales/:id/use-service', packageSaleController.usePackageService);

// Müşteri paketleri
router.get('/customers/:customerId/packages', packageSaleController.getCustomerPackages);

module.exports = router;