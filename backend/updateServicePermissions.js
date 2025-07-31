const mongoose = require('mongoose');
const User = require('./models/User');

async function updateServicePermissions() {
    try {
        await mongoose.connect('mongodb://localhost:27017/krasa');
        console.log('MongoDB bağlantısı başarılı');

        // Tüm employee kullanıcılarının canViewServices permission'ını false yap
        const result = await User.updateMany(
            { role: 'employee' },
            { 
                $set: { 
                    'permissions.canViewServices': false,
                    'permissions.canEditServices': false
                }
            }
        );

        console.log(`${result.modifiedCount} personel kullanıcısının hizmet izinleri güncellendi`);

        // Güncellenmiş durumu kontrol et
        const users = await User.find({}, 'username role permissions.canViewServices permissions.canEditServices');
        
        console.log('\n=== Güncellenmiş Kullanıcı Hizmet İzinleri ===');
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

updateServicePermissions();