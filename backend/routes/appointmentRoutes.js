const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

router.post('/appointments', appointmentController.createAppointment);
router.get('/appointments', appointmentController.getAllAppointments);
router.put('/appointments/:id', appointmentController.updateAppointment);

module.exports = router;
