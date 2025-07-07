const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// Yeni müşteri ekleme
router.post('/customers', customerController.createCustomer);

// Tüm müşterileri listeleme (veya isme göre arama)
router.get('/customers', customerController.getAllCustomers);
router.delete('/customers/:id', customerController.deleteCustomer)

// Bir müşterinin randevularını getir
router.get('/customers/:id/appointments', customerController.getCustomerAppointments);

module.exports = router;
