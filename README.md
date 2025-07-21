# Krasa App - Kuaför Salonu Yönetim Sistemi

## 🚀 Projeyi Çalıştırma

### Gereksinimler
- Node.js (v14 veya üzeri)
- MongoDB (yerel kurulum veya MongoDB Atlas)
- npm veya yarn

### Kurulum

#### 1. Projeyi Klonlayın
```bash
git clone https://github.com/kullaniciadi/krasa-app.git
cd krasa-app
```

#### 2. Backend Kurulumu
```bash
cd backend
npm install
```



#### 3. Frontend Kurulumu
```bash
cd ../frontend/front
npm install
```

### Çalıştırma

#### Backend'i Başlatın
```bash
cd backend
npm start
```
Backend http://localhost:4000 adresinde çalışacaktır.

#### Frontend'i Başlatın
Yeni bir terminal açın:
```bash
cd frontend/front
npm run dev
```
Frontend http://localhost:5173 adresinde çalışacaktır.

### Özellikler
- 👥 Müşteri yönetimi
- 📅 Randevu sistemi
- 👨‍💼 Çalışan yönetimi
- 🎯 Hizmet yönetimi
- 📦 Paket satış sistemi
- 💰 Ödeme takibi
- 📊 Taksit sistemi

### Teknolojiler
- **Frontend:** React, Redux Toolkit, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Diğer:** Axios, React Router

### API Endpoints
- `GET /api/customers` - Müşterileri listele
- `POST /api/customers` - Yeni müşteri ekle
- `GET /api/appointments` - Randevuları listele
- `POST /api/appointments` - Yeni randevu oluştur
- `GET /api/services` - Hizmetleri listele
- `GET /api/packages` - Paketleri listele
- `GET /api/employees` - Çalışanları listele

### Geliştirme
Geliştirme modunda çalıştırmak için her iki servisi de ayrı terminallerde başlatın ve değişiklikler otomatik olarak yansıyacaktır.
