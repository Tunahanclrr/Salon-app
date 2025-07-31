const mongoose = require('mongoose');
const User = require('./models/User');

async function checkServicePermissions() {
    try {
        await mongoose.connect('mongodb://localhost:27017/krasa');
        console.log('MongoDB bağlantısı başarılı');

        const users = await User.find({}, 'username role permissions.canViewServices permissions.canEditServices');
        
        console.log('\n=== Kullanıcı Hizmet İzinleri ===');
        users.forEach(user => {
            console.log(`Kullanıcı: ${user.username}`);
            console.log(`Rol: ${user.role}`);
            console.log(`Hizmetleri Görme: ${user.permissions.canViewServices}`);
            console.log(`Hizmetleri Düzenleme: ${user.permissions.canEditServices}`);
            console.log('---');
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Hata:', error);
    }
}

checkServicePermissions();