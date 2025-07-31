const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticateToken, requirePermission } = require('../middleware/auth');

// Tüm müşterileri listeleme (veya isme göre arama)
router.get('/customers', authenticateToken, requirePermission('canViewCustomers'), customerController.getAllCustomers);
// Yeni müşteri ekleme
router.post('/customers', authenticateToken, requirePermission('canEditCustomers'), customerController.createCustomer);
// Müşteri silme
router.delete('/customers/:id', authenticateToken, requirePermission('canEditCustomers'), customerController.deleteCustomer);
// Bir müşterinin randevularını getir
router.get('/customers/:id/appointments', authenticateToken, requirePermission('canViewCustomers'), customerController.getCustomerAppointments);

module.exports = router;
