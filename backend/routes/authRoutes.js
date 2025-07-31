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

// Genel auth routes
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

// Admin-only routes
router.post('/register', authenticateToken, requireAdmin, register);
router.get('/users', authenticateToken, getAllUsers); // requireAdmin kaldırıldı
router.put('/users/:userId/permissions', authenticateToken, requireAdmin, updatePermissions);
router.patch('/users/:userId/toggle-status', authenticateToken, requireAdmin, toggleUserStatus);

module.exports = router;