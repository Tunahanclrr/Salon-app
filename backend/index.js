require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const connectDB = require('./config/db');

const cors = require('cors');
// Express uygulamasını başlatır. app, Express'in çalıştıracağı ana nesnedir.
const app = express();

connectDB(); // MongoDB bağlantısı

// Sunucunun çalışacağı port numarasını belirler. Eğer .env dosyasındaki PORT değişkeni varsa, onu kullanır. Yoksa, varsayılan olarak 3000 portunu kullanır.
const PORT = process.env.PORT || 4000;
app.use(cors());

// Express uygulamasına JSON verisini işleyebilmesi için middleware ekler. Bu, gelen verilerin JSON formatında olduğunu belirterek doğru bir şekilde işlenmesini sağlar.
app.use(express.json());

// Ana dizine gelen GET isteği için bir route tanımlar. Bu, bir kullanıcı "/ " adresine geldiğinde şu yanıtı dönecektir.
app.get('/', (req, res) => {
    res.send('Backend çalışıyor!'); // "/ " adresine gelen isteklerin yanıtı olarak bu mesaj döndürülür.
});

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api', appointmentRoutes);
//müşteri route
const customerRoutes = require('./routes/customerRoutes');
app.use('/api', customerRoutes);

app.use('/api/services', require('./routes/serviceRoutes'));

// Paket satış routes
const packageSaleRoutes = require('./routes/packageSaleRoutes');
app.use('/api', packageSaleRoutes);

// Paket routes
const packageRoutes = require('./routes/packageRoutes');
app.use('/api/packages', packageRoutes);

// Uygulamanın belirtilen port numarasında çalışmaya başlamasını sağlar. Sunucu başlatıldığında bir konsol mesajı verir.
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`); // Sunucunun hangi portta çalıştığını konsola yazar.
});
