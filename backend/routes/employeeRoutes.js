const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeControllers');

// Yeni çalışan ekleme
router.post('/employees', employeeController.createEmployee);
//http://localhost:4000/employees
router.get('/employes',employeeController.getEmployeeById)
router.get('/employees/:id', employeeController.getEmployeeById);
// Tüm çalışanları listeleme
router.get('/employees', employeeController.getAllEmployees);

module.exports = router;
