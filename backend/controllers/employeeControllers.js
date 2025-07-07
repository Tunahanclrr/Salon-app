// controllers/employeeController.js
const Employee = require('../models/Employee');

// Yeni çalışan ekleme
exports.createEmployee = async (req, res) => {
    try {
        const { name, email, phone, role, gender } = req.body;

        // Gerekli alanlar kontrolü
        if (!name || !email || !phone || !role, !gender) {
            return res.status(400).json({ message: 'Tüm zorunlu alanlar doldurulmalı.' });
        }

        // Email benzersizlik kontrolü
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
        }

        const newEmployee = new Employee({
            name,
            email,
            phone,
            role,
            gender
        });

        await newEmployee.save();

        res.status(201).json({ message: 'Çalışan başarıyla eklendi.', data: newEmployee });
    } catch (error) {
        console.error('createEmployee error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Tüm çalışanları listeleme
exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find()
          .populate({
            path: 'appointments',
            populate: [
              { path: 'customer', select: 'name phone email' },
              { path: 'employee', select: 'name' }
            ]
          });
        res.status(200).json(employees);
    } catch (error) {
        console.error('getAllEmployees error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        await Employee.findByIdAndDelete(id);
        res.status(200).json({ message: 'Çalışan başarıyla silindi.' });
    } catch (error) {
        console.error('deleteEmployee error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
}

// Belirli bir çalışanı ID ile getirir
// GET: /api/employees/:id
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id)
          .populate({
            path: 'appointments',
            populate: [
              { path: 'employee', select: 'name email phone role gender' },
              { path: 'customer', select: 'name phone email' }
            ]
          });
        if (!employee) {
            return res.status(404).json({ message: 'Çalışan bulunamadı.' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error('getEmployeeById error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Belirli bir çalışanı ID ile günceller
// PUT: /api/employees/:id
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, role } = req.body;

        // Güncellenecek alanlar
        const updateFields = { name, email, phone, role };

        // Sadece gönderilen alanları güncelle
        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === undefined) {
                delete updateFields[key];
            }
        });
        const updatedEmployee = await Employee.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Çalışan bulunamadı.' });
        }
        res.status(200).json({ message: 'Çalışan başarıyla güncellendi.', data: updatedEmployee });
    } catch (error) {
        console.error('updateEmployee error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};