# Krasa App - Güzellik Salonu Yönetim Paneli

Bu proje, güzellik salonları için modern ve kullanıcı dostu bir yönetim paneli frontend'idir. MERN stack ile geliştirilmek üzere tasarlanmıştır. Sadece tasarım ve arayüz kodları içerir.

## Özellikler
- Responsive ve modern bir arayüz
- Sabit ve mobil uyumlu sidebar
- Dashboard, Çalışanlar, Randevular, Müşteriler, Hizmetler sayfaları
- Her sayfa için modern kart, tablo ve arama/ekle butonları
- Sadece frontend (tasarım) kodları, backend yoktur

## Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```
3. Tarayıcınızda `http://localhost:5173` adresine gidin.

## Sayfa Yapısı

- **Dashboard:** Hoşgeldiniz mesajı ve özet kutuları
- **Çalışanlar:** Kartlı çalışan listesi ve arama
- **Randevular:** Tablo ve yeni randevu ekle butonu
- **Müşteriler:** Kartlı müşteri listesi, arama ve ekle butonu
- **Hizmetler:** Kartlı hizmet listesi ve ekle butonu

## Klasör Yapısı

```
src/
  pages/
    Dashboard.jsx
    Employess.jsx
    Appointments.jsx
    Customers.jsx
    Services.jsx
  layout/
    MainLayout.jsx
  App.jsx
  main.jsx
```

## Notlar
- Tüm sayfalar sadece tasarımdır, veri statiktir.
- Tasarımda Tailwind CSS ve Material Icons kullanılmıştır.
- Backend entegrasyonu için hazırdır.

---

Her türlü geliştirme ve özelleştirme için uygundur. İyi çalışmalar!
