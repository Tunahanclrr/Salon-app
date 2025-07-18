# 🌟 Krasa App - Güzellik Salonu Yönetim Sistemi

> **Modern, Kapsamlı ve Kullanıcı Dostu Güzellik Salonu Yönetim Platformu**

## 📋 İçindekiler
- [🎯 Proje Hakkında](#-proje-hakkında)
- [🏗️ Sistem Mimarisi](#️-sistem-mimarisi)
- [🔧 Backend Yapısı](#-backend-yapısı)
- [⚛️ Frontend Yapısı](#️-frontend-yapısı)
- [🗄️ Veritabanı Tasarımı](#️-veritabanı-tasarımı)
- [🚀 Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [📱 Özellikler](#-özellikler)
- [🔄 Veri Akışı](#-veri-akışı)
- [🎨 UI/UX Tasarım](#-uiux-tasarım)

---

## 🎯 Proje Hakkında

**Krasa App**, güzellik salonları için geliştirilmiş tam kapsamlı bir yönetim sistemidir. Bu sistem, salon işletmecilerinin günlük operasyonlarını dijitalleştirmek ve optimize etmek için tasarlanmıştır.

### 🎪 **Sunum: Neden Bu Projeyi Geliştirdik?**

Güzellik salonları günümüzde hala çoğunlukla manuel süreçlerle çalışmaktadır:
- 📝 Kağıt üzerinde randevu takibi
- 📞 Telefon ile müşteri yönetimi  
- 💰 Elle hesaplanan ödeme takibi
- 👥 Karmaşık personel programlama

**Krasa App bu sorunları çözer:**
- ✅ Dijital randevu takvimi
- ✅ Otomatik müşteri yönetimi
- ✅ Paket satış sistemi
- ✅ Gerçek zamanlı raporlama

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────┐    HTTP/REST API    ┌─────────────────┐
│                 │ ◄─────────────────► │                 │
│   FRONTEND      │                     │    BACKEND      │
│   (React SPA)   │                     │   (Node.js)     │
│                 │                     │                 │
└─────────────────┘                     └─────────────────┘
         │                                        │
         │                                        │
         ▼                                        ▼
┌─────────────────┐                     ┌─────────────────┐
│   BROWSER       │                     │    MongoDB      │
│   (Client)      │                     │   (Database)    │
└─────────────────┘                     └─────────────────┘
```

### 🔄 **Teknoloji Stack'i**

**Frontend:**
- ⚛️ React 19.1.0 (Modern UI Framework)
- 🎨 Tailwind CSS (Utility-First Styling)
- 🔄 Redux Toolkit (State Management)
- 🖱️ React DnD (Drag & Drop)
- 📅 FullCalendar (Takvim Sistemi)
- 🚀 Vite (Build Tool)

**Backend:**
- 🟢 Node.js (Runtime Environment)
- 🚀 Express.js (Web Framework)
- 🍃 MongoDB (NoSQL Database)
- 🔗 Mongoose (ODM)
- 🌐 CORS (Cross-Origin Resource Sharing)

---

## 🔧 Backend Yapısı

### 📁 **Klasör Organizasyonu**
```
backend/
├── 📁 config/          # Yapılandırma dosyaları
│   └── db.js           # MongoDB bağlantısı
├── 📁 controllers/     # İş mantığı katmanı
│   ├── appointmentController.js
│   ├── customerController.js
│   ├── employeeControllers.js
│   ├── packageController.js
│   ├── packageSaleController.js
│   ├── paymentController.js
│   └── serviceControllers.js
├── 📁 models/          # Veritabanı şemaları
│   ├── Appointmen.js
│   ├── Customer.js
│   ├── Employee.js
│   ├── Package.js
│   ├── PackageSale.js
│   └── Services.js
├── 📁 routes/          # API endpoint'leri
│   ├── appointmentRoutes.js
│   ├── customerRoutes.js
│   ├── employeeRoutes.js
│   ├── packageRoutes.js
│   ├── packageSaleRoutes.js
│   └── serviceRoutes.js
├── index.js            # Ana server dosyası
└── package.json        # Bağımlılıklar
```

### 🔄 **Backend Çalışma Mantığı**

#### 1. **Server Başlatma Süreci**
```javascript
// 1. Environment değişkenleri yüklenir
require('dotenv').config();

// 2. MongoDB bağlantısı kurulur
connectDB();

// 3. Express server başlatılır
const app = express();

// 4. Middleware'ler eklenir
app.use(cors());
app.use(express.json());

// 5. Route'lar tanımlanır
app.use('/api', employeeRoutes);
app.use('/api', appointmentRoutes);
// ... diğer route'lar

// 6. Server dinlemeye başlar
app.listen(PORT);
```

#### 2. **API Endpoint Yapısı**
```
📡 API Endpoints:
├── /api/employees      # Personel yönetimi
├── /api/customers      # Müşteri yönetimi  
├── /api/appointments   # Randevu yönetimi
├── /api/services       # Hizmet yönetimi
├── /api/packages       # Paket yönetimi
└── /api/package-sales  # Paket satış yönetimi
```

#### 3. **Controller Pattern**
Her controller, belirli bir entity için CRUD operasyonlarını yönetir:
```javascript
// Örnek: customerController.js
exports.getAllCustomers = async (req, res) => {
  // Tüm müşterileri getir
};

exports.createCustomer = async (req, res) => {
  // Yeni müşteri oluştur
};

exports.updateCustomer = async (req, res) => {
  // Müşteri güncelle
};

exports.deleteCustomer = async (req, res) => {
  // Müşteri sil
};
```

---

## ⚛️ Frontend Yapısı

### 📁 **Klasör Organizasyonu**
```
frontend/front/src/
├── 📁 components/      # Yeniden kullanılabilir bileşenler
│   ├── AppointmentForm.jsx
│   ├── CustomerForm.jsx
│   ├── Modal.jsx
│   ├── Sidebar.jsx
│   └── ...
├── 📁 pages/          # Ana sayfa bileşenleri
│   ├── Dashboard.jsx
│   ├── Appointments.jsx
│   ├── Customers.jsx
│   ├── Employes.jsx
│   ├── Services.jsx
│   └── PackageSales.jsx
├── 📁 redux/          # State yönetimi
│   ├── appointmentsSlice.jsx
│   ├── customersSlice.jsx
│   ├── employeesSlice.jsx
│   └── ...
├── 📁 layout/         # Layout bileşenleri
│   └── MainLayout.jsx
├── App.jsx            # Ana uygulama bileşeni
├── main.jsx           # Giriş noktası
└── store.js           # Redux store
```

### 🎯 **Frontend Çalışma Mantığı**

#### 1. **Component Hiyerarşisi**
```
App.jsx
└── MainLayout.jsx
    ├── Sidebar.jsx
    └── Pages/
        ├── Dashboard.jsx
        ├── Appointments.jsx
        ├── Customers.jsx
        ├── Employes.jsx
        ├── Services.jsx
        └── PackageSales.jsx
```

#### 2. **State Management (Redux)**
```javascript
// Store yapısı
{
  appointments: {
    items: [],
    loading: false,
    error: null
  },
  customers: {
    items: [],
    loading: false,
    error: null
  },
  employees: {
    items: [],
    loading: false,
    error: null
  }
  // ... diğer slice'lar
}
```

#### 3. **Async Thunk Pattern**
```javascript
// Örnek: customersSlice.jsx
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async () => {
    const response = await axios.get('/api/customers');
    return response.data;
  }
);
```

---

## 🗄️ Veritabanı Tasarımı

### 📊 **Entity Relationship Diagram**
```
┌─────────────┐    1:N    ┌─────────────┐    N:M    ┌─────────────┐
│  Employee   │◄─────────►│ Appointment │◄─────────►│   Service   │
└─────────────┘           └─────────────┘           └─────────────┘
                                 │
                                 │ N:1
                                 ▼
                          ┌─────────────┐
                          │  Customer   │
                          └─────────────┘
                                 │
                                 │ 1:N
                                 ▼
                          ┌─────────────┐    N:1    ┌─────────────┐
                          │PackageSale  │◄─────────►│   Package   │
                          └─────────────┘           └─────────────┘
```

### 🏗️ **Model Şemaları**

#### **Customer Model**
```javascript
{
  name: String,           // Müşteri adı
  phone: String,          // Telefon (unique)
  email: String,          // E-posta
  isRegular: Boolean,     // Düzenli müşteri mi?
  notes: String,          // Notlar
  appointments: [ObjectId], // Randevular
  packageSales: [ObjectId], // Paket satışları
  timestamps: true        // createdAt, updatedAt
}
```

#### **Appointment Model**
```javascript
{
  customer: ObjectId,     // Müşteri referansı
  employee: ObjectId,     // Personel referansı
  services: [ObjectId],   // Hizmetler
  date: String,           // Randevu tarihi
  time: String,           // Randevu saati
  duration: Number,       // Süre (dakika)
  status: String,         // Durum
  customerNotArrived: Boolean, // Müşteri gelmedi mi?
  notes: String,          // Notlar
  timestamps: true
}
```

---

## 🚀 Kurulum ve Çalıştırma

### 🔧 **Backend Kurulumu**
```bash
# 1. Backend klasörüne git
cd backend

# 2. Bağımlılıkları yükle
npm install

# 3. Environment dosyası oluştur
echo "MONGO_URI=mongodb://localhost:27017/krasa-app" > .env
echo "PORT=4000" >> .env

# 4. MongoDB'yi başlat (ayrı terminal)
mongod

# 5. Backend'i çalıştır
npm start
```

### ⚛️ **Frontend Kurulumu**
```bash
# 1. Frontend klasörüne git
cd frontend/front

# 2. Bağımlılıkları yükle
npm install

# 3. Development server'ı başlat
npm run dev

# 4. Tarayıcıda aç
# http://localhost:5173
```

### 🐳 **Docker ile Çalıştırma (Opsiyonel)**
```bash
# MongoDB container'ı başlat
docker run -d -p 27017:27017 --name krasa-mongo mongo

# Backend ve Frontend'i normal şekilde çalıştır
```

---

## 📱 Özellikler

### 🎯 **Ana Özellikler**

#### 1. **📅 Randevu Yönetimi**
- **Drag & Drop Takvim**: Randevuları sürükleyerek taşıma
- **Çakışma Kontrolü**: Otomatik çakışma tespiti
- **Responsive Tasarım**: Mobil ve desktop uyumlu
- **Gerçek Zamanlı Güncelleme**: Anlık değişiklik yansıması

#### 2. **👥 Müşteri Yönetimi**
- **Kapsamlı Profiller**: Detaylı müşteri bilgileri
- **Randevu Geçmişi**: Tüm geçmiş randevular
- **Paket Takibi**: Satın alınan paketler
- **Arama ve Filtreleme**: Hızlı müşteri bulma

#### 3. **👨‍💼 Personel Yönetimi**
- **Personel Profilleri**: Detaylı personel bilgileri
- **Uzmanlık Alanları**: Hangi hizmetleri verebileceği
- **Çalışma Programı**: Müsaitlik durumu
- **Performans Takibi**: Randevu istatistikleri

#### 4. **💼 Hizmet Yönetimi**
- **Hizmet Katalogu**: Tüm salon hizmetleri
- **Fiyat Yönetimi**: Dinamik fiyatlandırma
- **Süre Tanımları**: Her hizmet için süre
- **Kategori Sistemi**: Hizmet gruplandırması

#### 5. **📦 Paket Sistemi**
- **Paket Oluşturma**: Hizmet paketleri
- **Taksitli Ödeme**: Esnek ödeme seçenekleri
- **Kullanım Takibi**: Paket kullanım durumu
- **Otomatik Hesaplama**: Kalan hizmet sayısı

### 🎨 **Kullanıcı Deneyimi Özellikleri**

#### **📱 Responsive Design**
- **Mobile First**: Önce mobil tasarım
- **Adaptive Layout**: Ekran boyutuna göre uyum
- **Touch Friendly**: Dokunmatik ekran optimizasyonu

#### **🎯 Intuitive Interface**
- **Minimal Design**: Sade ve anlaşılır arayüz
- **Color Coding**: Renk kodlu kategorizasyon
- **Quick Actions**: Hızlı işlem butonları

#### **⚡ Performance**
- **Lazy Loading**: İhtiyaç anında yükleme
- **Caching**: Akıllı önbellekleme
- **Optimized Rendering**: Optimize edilmiş render

---

## 🔄 Veri Akışı

### 📊 **Frontend → Backend Akışı**

#### 1. **Randevu Oluşturma Süreci**
```
User Action → Component → Redux Action → API Call → Backend Controller → Database → Response → Redux State → UI Update
```

**Detaylı Akış:**
```javascript
// 1. Kullanıcı randevu formu doldurur
<AppointmentForm onSubmit={handleSubmit} />

// 2. Form submit edilir
const handleSubmit = (formData) => {
  dispatch(addAppointment(formData));
};

// 3. Redux thunk çalışır
export const addAppointment = createAsyncThunk(
  'appointments/add',
  async (appointmentData) => {
    const response = await axios.post('/api/appointments', appointmentData);
    return response.data;
  }
);

// 4. Backend controller çalışır
exports.createAppointment = async (req, res) => {
  const appointment = new Appointment(req.body);
  await appointment.save();
  res.json(appointment);
};

// 5. Database'e kaydedilir
// 6. Response frontend'e döner
// 7. Redux state güncellenir
// 8. UI otomatik güncellenir
```

### 🔄 **Real-time Updates**

#### **Optimistic Updates**
```javascript
// Kullanıcı deneyimini iyileştirmek için
// Backend'den cevap gelmeden UI güncellenir
const optimisticUpdate = (newData) => {
  // 1. UI'ı hemen güncelle
  dispatch(updateUIOptimistically(newData));
  
  // 2. Backend'e gönder
  dispatch(saveToBackend(newData))
    .then(() => {
      // 3. Başarılı ise onaylı
      dispatch(confirmUpdate());
    })
    .catch(() => {
      // 4. Hata varsa geri al
      dispatch(revertUpdate());
    });
};
```

---

## 🎨 UI/UX Tasarım

### 🎯 **Tasarım Prensipleri**

#### **1. Minimalizm**
- **Clean Interface**: Gereksiz öğeler kaldırıldı
- **White Space**: Nefes alabilir boşluklar
- **Typography**: Okunabilir font seçimleri

#### **2. Consistency**
- **Design System**: Tutarlı bileşen kütüphanesi
- **Color Palette**: Harmonik renk paleti
- **Spacing System**: Matematiksel boşluk sistemi

#### **3. Accessibility**
- **Keyboard Navigation**: Klavye ile navigasyon
- **Screen Reader**: Ekran okuyucu desteği
- **Color Contrast**: Yeterli renk kontrastı

### 🎨 **Renk Paleti**
```css
/* Ana Renkler */
--primary: #8B5CF6;     /* Mor - Ana renk */
--secondary: #EC4899;   /* Pembe - Vurgu rengi */
--success: #10B981;     /* Yeşil - Başarı */
--warning: #F59E0B;     /* Sarı - Uyarı */
--error: #EF4444;       /* Kırmızı - Hata */

/* Nötr Renkler */
--gray-50: #F9FAFB;
--gray-100: #F3F4F6;
--gray-200: #E5E7EB;
--gray-300: #D1D5DB;
--gray-400: #9CA3AF;
--gray-500: #6B7280;
--gray-600: #4B5563;
--gray-700: #374151;
--gray-800: #1F2937;
--gray-900: #111827;
```

### 📱 **Responsive Breakpoints**
```css
/* Mobile First Approach */
/* xs: 0px - 639px */
/* sm: 640px - 767px */
/* md: 768px - 1023px */
/* lg: 1024px - 1279px */
/* xl: 1280px - 1535px */
/* 2xl: 1536px+ */
```

---

## 🔮 Gelecek Planları

### 🚀 **Yakın Dönem (1-3 Ay)**
- [ ] **📊 Analytics Dashboard**: Detaylı raporlama
- [ ] **💬 WhatsApp Entegrasyonu**: Otomatik mesajlaşma
- [ ] **📧 Email Notifications**: E-posta bildirimleri
- [ ] **🔐 Multi-tenant Architecture**: Çoklu salon desteği

### 🌟 **Orta Dönem (3-6 Ay)**
- [ ] **📱 Mobile App**: React Native uygulaması
- [ ] **💳 Payment Integration**: Ödeme sistemi entegrasyonu
- [ ] **📈 Advanced Analytics**: Makine öğrenmesi ile analiz
- [ ] **🌐 Multi-language**: Çoklu dil desteği

### 🚀 **Uzun Dönem (6+ Ay)**
- [ ] **🤖 AI Recommendations**: Yapay zeka önerileri
- [ ] **📊 Business Intelligence**: İş zekası modülleri
- [ ] **🔗 Third-party Integrations**: Üçüncü parti entegrasyonlar
- [ ] **☁️ Cloud Infrastructure**: Bulut altyapısı

---

## 👥 Katkıda Bulunma

### 🤝 **Nasıl Katkıda Bulunabilirsiniz?**

1. **🍴 Fork**: Projeyi fork edin
2. **🌿 Branch**: Feature branch oluşturun
3. **💻 Code**: Kodunuzu yazın
4. **✅ Test**: Testlerinizi ekleyin
5. **📝 Commit**: Anlamlı commit mesajları
6. **🔄 Pull Request**: PR oluşturun

### 📋 **Coding Standards**
```javascript
// ✅ İyi örnek
const handleAppointmentSubmit = async (appointmentData) => {
  try {
    const result = await dispatch(addAppointment(appointmentData));
    if (addAppointment.fulfilled.match(result)) {
      toast.success('Randevu başarıyla oluşturuldu');
      setModalOpen(false);
    }
  } catch (error) {
    toast.error('Bir hata oluştu');
  }
};

// ❌ Kötü örnek
const handleSubmit = (data) => {
  dispatch(addAppointment(data));
};
```

---

## 📞 İletişim


**GitHub**: [github.com/tunahanclrr](https://github.com/tunahanclrr)  

---

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

---

## 🙏 Teşekkürler

Bu projeyi mümkün kılan tüm açık kaynak topluluğuna ve katkıda bulunan geliştiricilere teşekkür ederiz.

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

---

*Son güncelleme: 2025*
