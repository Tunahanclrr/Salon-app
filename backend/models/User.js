const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: function() {
            return this.role === 'employee';
        }
    },
    gender: {
        type: String,
        enum: ['erkek', 'kadın'],
        required: function() {
            return this.role === 'employee';
        }
    },
    job: {
        type: String,
        enum: ['manikür', 'cilt bakım uzmanı', 'epilasyon uzmanı'],
        required: function() {
            return this.role === 'employee';
        }
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'employee'],
        default: 'employee'
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    permissions: {
        canViewAppointments: { type: Boolean, default: true },
        canEditAppointments: { type: Boolean, default: true }, // Personel de randevu düzenleyebilir
        canViewCustomers: { type: Boolean, default: true },
        canEditCustomers: { type: Boolean, default: true }, // Personel müşteri ekleyebilir
        canViewServices: { type: Boolean, default: false },
        canEditServices: { type: Boolean, default: false },
        canViewPackages: { type: Boolean, default: false },
        canEditPackages: { type: Boolean, default: false },
        canViewUsers: { type: Boolean, default: false },
        canEditUsers: { type: Boolean, default: false },
        canViewReports: { type: Boolean, default: false }
    },
    appointments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    }]
}, { 
    timestamps: true 
});

// Virtual field for package sales
userSchema.virtual('packageSales', {
    ref: 'PackageSale',
    localField: '_id',
    foreignField: 'seller'
});

// Şifre hashleme middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Şifre karşılaştırma metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Admin kullanıcıya tüm izinleri ver
userSchema.pre('save', function(next) {
    if (this.role === 'admin') {
        this.isAdmin = true;
        this.permissions = {
            canViewAppointments: true,
            canEditAppointments: true,
            canViewCustomers: true,
            canEditCustomers: true,
            canViewServices: true,
            canEditServices: true,
            canViewPackages: true,
            canEditPackages: true,
            canViewUsers: true,
            canEditUsers: true,
            canViewReports: true
        };
    }
    next();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);