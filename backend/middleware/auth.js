const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token doğrulama middleware
const authenticateToken = async (req, res, next) => {
    console.log('🔐 authenticateToken middleware called for:', req.method, req.originalUrl);
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        console.log('🔑 Token found:', token ? 'YES' : 'NO');

        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ 
                success: false, 
                message: 'Erişim token\'ı bulunamadı' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        console.log('✅ Token decoded successfully, userId:', decoded.userId);
        const user = await User.findById(decoded.userId);
        console.log('👤 User found:', user ? 'YES' : 'NO');
        
        if (!user || !user.isActive) {
            console.log('❌ User not found or inactive');
            return res.status(401).json({ 
                success: false, 
                message: 'Geçersiz token veya kullanıcı aktif değil' 
            });
        }

        req.user = user;
        console.log('✅ User authenticated:', user.username, 'role:', user.role);
        next();
    } catch (error) {
        console.log('❌ Token verification failed:', error.message);
        return res.status(403).json({ 
            success: false, 
            message: 'Geçersiz token' 
        });
    }
};

// Admin yetkisi kontrolü
const requireAdmin = (req, res, next) => {
    console.log('👑 requireAdmin middleware called for user:', req.user?.username, 'role:', req.user?.role);
    if (req.user.role !== 'admin') {
        console.log('❌ Access denied - not admin');
        return res.status(403).json({ 
            success: false, 
            message: 'Bu işlem için admin yetkisi gerekli' 
        });
    }
    console.log('✅ Admin access granted');
    next();
};

// Belirli izin kontrolü
const requirePermission = (permission) => {
    return (req, res, next) => {
        console.log('🔒 requirePermission middleware called for:', permission);
        console.log('👤 User role:', req.user?.role);
        console.log('🔑 User permissions:', req.user?.permissions);
        
        if (req.user.role === 'admin') {
            console.log('✅ Admin access granted for permission:', permission);
            return next(); // Admin her şeyi yapabilir
        }
        
        if (!req.user.permissions || !req.user.permissions[permission]) {
            console.log('❌ Permission denied for:', permission);
            return res.status(403).json({ 
                success: false, 
                message: 'Bu işlem için yetkiniz yok' 
            });
        }
        
        console.log('✅ Permission granted for:', permission);
        next();
    };
};

// Kendi verilerine erişim veya admin kontrolü
const requireOwnershipOrAdmin = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    
    // Eğer employee ise sadece kendi verilerine erişebilir
    if (req.user.role === 'employee') {
        req.params.id = req.user._id.toString();
    }
    
    next();
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requirePermission,
    requireOwnershipOrAdmin
};