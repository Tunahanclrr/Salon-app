const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, requirePermission, requireOwnershipOrAdmin } = require('../middleware/auth');

// Randevuları görüntüleme - admin tümünü, personel sadece kendi randevularını görebilir
router.get('/appointments', authenticateToken, appointmentController.getAllAppointments);
router.get('/appointments/:id', authenticateToken, appointmentController.getAppointmentById);
router.post('/appointments', authenticateToken, requirePermission('canEditAppointments'), appointmentController.createAppointment);
router.put('/appointments/:id', authenticateToken, requirePermission('canEditAppointments'), appointmentController.updateAppointment);
router.put('/appointments/:id/customer-not-arrived', authenticateToken, requirePermission('canEditAppointments'), appointmentController.updateCustomerNotArrived);

// Test randevuları oluştur (sadece development için)
router.post('/appointments/create-test', authenticateToken, appointmentController.createTestAppointments);

module.exports = router;
