const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments', appointmentController.getAllAppointments);
router.put('/appointments/:id', appointmentController.updateAppointment);
router.put('/appointments/:id/customer-not-arrived', appointmentController.updateCustomerNotArrived);

module.exports = router;
