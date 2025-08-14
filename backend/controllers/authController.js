const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

// JWT token oluşturma fonksiyonu
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );
};

// Kullanıcı kaydı (Admin tarafından)
const register = async (req, res) => {
    try {
        const { username, email, password, role, name, phone, gender, job } = req.body;

        // Gerekli alanlar kontrolü
        if (!username || !email || !password || !role || !name) {
            return res.status(400).json({ message: 'Gerekli alanlar eksik.' });
        }

        // Employee rolü için ek alanlar kontrolü
        if (role === 'employee' && (!phone || !gender || !job)) {
            return res.status(400).json({ message: 'Personel için telefon, cinsiyet ve meslek alanları gerekli.' });
        }

        // Kullanıcı adı benzersizlik kontrolü
        const existingUser = await User.findOne({ 
            $or: [{ username }, { email }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: existingUser.username === username 
                    ? 'Bu kullanıcı adı zaten kullanılıyor.' 
                    : 'Bu e-posta adresi zaten kullanılıyor.' 
            });
        }

        // Yeni kullanıcı oluştur
        const userData = {
            username,
            email,
            password,
            role,
            name,
            isAdmin: role === 'admin'
        };

        // Employee rolü için ek bilgiler
        if (role === 'employee') {
            userData.phone = phone;
            userData.gender = gender;
            userData.job = job;
        }

        const newUser = new User(userData);
        await newUser.save();

        res.status(201).json({ 
            success: true,
            message: 'Kullanıcı başarıyla oluşturuldu.',
            data: {
                user: {
                    _id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    name: newUser.name,
                    phone: newUser.phone,
                    gender: newUser.gender,
                    job: newUser.job,
                    isActive: newUser.isActive,
                    permissions: newUser.permissions,
                    lastLogin: newUser.lastLogin
                }
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Kullanıcı girişi
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { username, password: '***' });

        // Kullanıcıyı bul
        const user = await User.findOne({ username });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            console.log('User not found for username:', username);
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kullanıcı adı veya şifre'
            });
        }

        // Kullanıcı aktif mi kontrol et
        if (!user.isActive) {
            console.log('User is not active:', username);
            return res.status(401).json({
                success: false,
                message: 'Hesabınız devre dışı bırakılmış'
            });
        }

        // Şifre kontrolü
        const isPasswordValid = await user.comparePassword(password);
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({
                success: false,
                message: 'Geçersiz kullanıcı adı veya şifre'
            });
        }

        // Son giriş zamanını güncelle
        user.lastLogin = new Date();
        await user.save();

        const token = generateToken(user._id);
        console.log('Login successful for user:', username);

        res.json({
            success: true,
            message: 'Giriş başarılı',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.isAdmin,
                    permissions: user.permissions,
                    name: user.name,
                    phone: user.phone,
                    gender: user.gender,
                    job: user.job
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Giriş yapılırken hata oluştu',
            error: error.message
        });
    }
};

// Kullanıcı bilgilerini getir
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password');

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isAdmin: user.isAdmin,
                    permissions: user.permissions,
                    name: user.name,
                    phone: user.phone,
                    gender: user.gender,
                    job: user.job,
                    lastLogin: user.lastLogin
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Profil bilgileri alınırken hata oluştu',
            error: error.message
        });
    }
};

// Kullanıcı izinlerini güncelle (sadece admin)
const updatePermissions = async (req, res) => {
    try {
        const { userId } = req.params;
        const { permissions } = req.body;

        // ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID formatı'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Admin kullanıcının izinleri değiştirilemez'
            });
        }

        user.permissions = { ...user.permissions, ...permissions };
        await user.save();

        res.json({
            success: true,
            message: 'İzinler başarıyla güncellendi',
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    permissions: user.permissions
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'İzinler güncellenirken hata oluştu',
            error: error.message
        });
    }
};

// Tüm kullanıcıları getir (admin tümünü, personel sadece aktif personelleri görür)
const getAllUsers = async (req, res) => {
    try {
        console.log('🔥 GET ALL USERS API ENDPOINT HIT');
        console.log('👤 Request user:', req.user ? req.user.username : 'No user');
        console.log('👑 Is admin:', req.user ? req.user.isAdmin : 'No user');
        
        let query = {};
        let selectFields = '-password';
        
        // Eğer admin değilse, sadece aktif personelleri göster
        if (!req.user.isAdmin) {
            query = { 
                role: 'employee', 
                isActive: true 
            };
            // Personel kullanıcıları için sadece gerekli alanları döndür
            selectFields = 'name job _id role isActive';
        }
        
        const users = await User.find(query, selectFields);
        console.log('👥 Found users count:', users.length);
        console.log('📋 Users summary:', users.map(u => ({ id: u._id, username: u.username, role: u.role })));
        
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Kullanıcılar getirilirken hata:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası'
        });
    }
};

// Kullanıcı durumunu değiştir (aktif/pasif)
const toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // ObjectId validation
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Geçersiz kullanıcı ID formatı'
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Admin kullanıcının durumu değiştirilemez'
            });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            success: true,
            message: `Kullanıcı ${user.isActive ? 'aktif' : 'pasif'} hale getirildi`,
            data: {
                user: {
                    _id: user._id,
                    username: user.username,
                    isActive: user.isActive
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Kullanıcı durumu değiştirilirken hata oluştu',
            error: error.message
        });
    }
};

// Şifre değiştirme
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        console.log('🔐 Change password request for user:', userId);

        // Gerekli alanlar kontrolü
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre ve yeni şifre gereklidir'
            });
        }

        // Yeni şifre uzunluk kontrolü
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Yeni şifre en az 6 karakter olmalıdır'
            });
        }

        // Kullanıcıyı bul
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Kullanıcı bulunamadı'
            });
        }

        // Mevcut şifreyi kontrol et
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Mevcut şifre yanlış'
            });
        }

        // Yeni şifreyi hash'le
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Şifreyi güncelle
        await User.findByIdAndUpdate(userId, {
            password: hashedNewPassword
        });

        console.log('✅ Password changed successfully for user:', userId);

        res.json({
            success: true,
            message: 'Şifre başarıyla değiştirildi'
        });
    } catch (error) {
        console.error('❌ Şifre değiştirme hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Sunucu hatası',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Kullanıcı silme (sadece admin)  
const deleteUser = async (req, res) => {  
    try {  
        const { userId } = req.params;  
          
        // ObjectId validation  
        if (!mongoose.Types.ObjectId.isValid(userId)) {  
            return res.status(400).json({  
                success: false,  
                message: 'Geçersiz kullanıcı ID formatı'  
            });  
        }  
          
        const user = await User.findById(userId);  
        if (!user) {  
            return res.status(404).json({  
                success: false,  
                message: 'Kullanıcı bulunamadı'  
            });  
        }  
  
        if (user.role === 'admin') {  
            return res.status(400).json({  
                success: false,  
                message: 'Admin kullanıcı silinemez'  
            });  
        }  
  
        // Kullanıcıyı sil  
        await User.findByIdAndDelete(userId);  
  
        res.json({  
            success: true,  
            message: 'Kullanıcı başarıyla silindi'  
        });  
    } catch (error) {  
        res.status(500).json({  
            success: false,  
            message: 'Kullanıcı silinirken hata oluştu',  
            error: error.message  
        });  
    }  
};

module.exports = {
    register,
    login,
    getProfile,
    updatePermissions,
    getAllUsers,
    toggleUserStatus,
    changePassword,
    deleteUser
};