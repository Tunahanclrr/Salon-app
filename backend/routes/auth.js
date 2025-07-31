const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getProfile, 
    updatePermissions, 
    getAllUsers, 
    toggleUserStatus,
    changePassword 
} = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

// Tüm authenticated kullanıcılar users listesini görebilir (randevu takvimi için gerekli)
router.get('/users', authenticateToken, getAllUsers);

// Admin only routes
router.put('/users/:id/permissions', authenticateToken, requireAdmin, updatePermissions);
router.put('/users/:id/toggle-status', authenticateToken, requireAdmin, toggleUserStatus);

module.exports = router;