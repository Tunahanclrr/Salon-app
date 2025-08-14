import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import Select from "react-select";
import { fetchServices } from "../redux/servicesSlice";
import { fetchCustomerPackages } from "../redux/customerPackagesSlice";

// Basit Modal bileşeni
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded p-6 max-w-md w-full shadow-lg relative">
        {children}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold"
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

const AppointmentForm = ({ 
  users, 
  customers, 
  services: servicesFromProps, 
  appointments, 
  onSubmit, 
  onCancel, 
  onAddCustomer, 
  initialData 
}) => {
  const dispatch = useDispatch();
  const { items: servicesFromRedux, loading } = useSelector((state) => state.services);
  const { items: customerPackages } = useSelector((state) => state.customerPackages);
  
  // Services'i Redux'tan veya props'tan al
  const services = servicesFromRedux && servicesFromRedux.length > 0 ? servicesFromRedux : servicesFromProps || [];

  // Form state ve validasyon hataları
  const [form, setForm] = useState({
    customerId: initialData?.customerId || "",
    employeeId: initialData?.employeeId || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    time: initialData?.time || "",
    selectedServices: [],
    notes: initialData?.notes || "",
    selectedCustomerPackage: null,
    packageSessionCount: 1,
    // manualDuration kaldırıldı
  });
  const [errors, setErrors] = useState({});

  // Çakışma ve zorla gönderim durumu
  const [forceSend, setForceSend] = useState(false);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);

  // Modal yeni müşteri için - artık kullanılmıyor, parent component'te yönetiliyor

  // Arama için debounce kullanılan müşteri arama state'i
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");

  // Toplam süre ve fiyat
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // --- EFFECTS ---

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Müşteri seçildiğinde paketlerini çek
  useEffect(() => {
    if (form.customerId) {
      console.log('🔄 Müşteri paketleri yükleniyor:', form.customerId);
      dispatch(fetchCustomerPackages(form.customerId));
    }
  }, [dispatch, form.customerId]);

  // Debug: Müşteri paketlerini kontrol et
  useEffect(() => {
    console.log('📦 Müşteri paketleri:', customerPackages);
    console.log('👤 Seçili müşteri:', form.customerId);
    console.log('📦 Paket sayısı:', customerPackages.length);
  }, [customerPackages, form.customerId]);

  // Debounce müşteri araması için
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [customerSearch]);

  // initialData değişince formu setle
  useEffect(() => {
    if (initialData) {
      setForm((prev) => {
        // Her zaman kullanıcının seçtiği hizmetleri koru
        const shouldKeepServices = prev.selectedServices.length > 0;

        return {
          ...prev,
          customerId: initialData.customerId || prev.customerId,
          employeeId: initialData.employeeId || prev.employeeId,
          date: initialData.date || prev.date,
          time: initialData.time || prev.time,
          // Kullanıcının seçtiği hizmetleri her zaman koru
          selectedServices: shouldKeepServices
            ? prev.selectedServices
            : initialData.serviceId
              ? [services.find((s) => s._id === initialData.serviceId)]
                  .filter(Boolean)
                  .map((svc) => ({
                    value: svc._id,
                    label: `${svc.name} (${svc.duration} dk)`,
                    duration: svc.duration,
                    price: svc.price,
                  }))
              : prev.selectedServices,
        };
      });
    }
  }, [initialData, services]);

  // Seçili hizmetler veya paket değişince toplam süre ve fiyatı güncelle
  useEffect(() => {
    if (form.selectedCustomerPackage) {
      // Paket seçilmişse paketin süresini kullan
      const packageDuration = (form.selectedCustomerPackage.package?.service?.duration || 0) * form.packageSessionCount;
      setTotalDuration(packageDuration);
      setTotalPrice(0); // Paket ücretsiz
    } else {
      // Normal hizmetler için hesapla
      const duration = form.selectedServices.reduce(
        (sum, svc) => sum + (svc.duration || 0),
        0
      );
      const price = form.selectedServices.reduce(
        (sum, svc) => sum + (svc.price || 0),
        0
      );
      setTotalDuration(duration);
      setTotalPrice(price);
    }
  }, [form.selectedServices, form.selectedCustomerPackage, form.packageSessionCount]);

  // --- OPTIONS ---
  const serviceOptions = useMemo(() => {
    // Normal hizmetler
    const normalServices = services.map((svc) => ({
      value: svc._id,
      label: `${svc.name} (${svc.duration} dk) - ₺${(svc.price ?? 0).toFixed(2)}`,
      duration: svc.duration,
      price: svc.price ?? 0,
    }));

    // Paket hizmetleri (eğer müşteri seçilmişse ve paketleri varsa)
    const packageServices = form.customerId && customerPackages.length > 0 
      ? customerPackages
          .filter(pkg => pkg.status === 'active' && pkg.remainingQuantity > 0)
          .map(pkg => ({
            value: `package_${pkg._id}`,
            label: `📦 ${pkg.package?.service?.name || 'Paket Hizmeti'} (${pkg.package?.service?.duration || 0} dk) - ${pkg.remainingQuantity} seans kaldı`,
            duration: pkg.package?.service?.duration || 0,
            price: 0,
            isPackage: true,
            packageData: pkg
          }))
      : [];

    // Paket hizmetlerini en üste koy
    return [...packageServices, ...normalServices];
  }, [services, customerPackages, form.customerId]);

  const employeeOptions = users
    .filter((user) => user.role === 'employee' || user.role === 'admin')
    .map((emp) => ({
      value: emp._id || emp.id,
      label: `${emp.name || emp.username} - ${emp.job || emp.role}`,
    }));

  console.log('Users prop:', users);
  console.log('Employee options:', employeeOptions);

  const customerOptions = customers.map((cust) => ({
    value: cust._id,
    label: `${cust.name} - ${cust.phone}`,
  }));

  const filteredCustomerOptions = useMemo(() => {
    return customerOptions.filter((c) =>
      c.label.toLowerCase().includes(debouncedCustomerSearch.toLowerCase())
    );
  }, [debouncedCustomerSearch, customerOptions]);

  // --- Saat seçenekleri ve uygunluk kontrolü ---
  const timeOptions = useMemo(() => {
    if (!form.employeeId || !form.date || totalDuration === 0) return [];

    const startHour = 9;
    const endHour = 20;
    const interval = 15;

    const times = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += interval) {
        const time = `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`;
        times.push(time);
      }
    }

    const employeeAppointments = appointments.filter(
      (app) =>
        app.employee?._id === form.employeeId &&
        app.date === form.date &&
        app.status !== "cancelled"
    );

    const isTimeSlotAvailable = (timeSlot) => {
      const [startHourSlot, startMinuteSlot] = timeSlot.split(":").map(Number);
      const slotStart = new Date(0, 0, 0, startHourSlot, startMinuteSlot);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

      const endOfDay = new Date(0, 0, 0, 20, 0, 0);
      if (slotEnd > endOfDay) return false;

      return !employeeAppointments.some((app) => {
        if (!app.time) return false;

        const [appHour, appMinute] = app.time.split(":").map(Number);
        const appStart = new Date(0, 0, 0, appHour, appMinute);
        const appEnd = new Date(
          appStart.getTime() + (app.duration || 30) * 60000
        );

        // Çakışma kontrolü: iki zaman aralığı çakışıyor mu?
        return (slotStart < appEnd && slotEnd > appStart);
      });
    };

    const availableSlots = times.map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const slotStart = new Date(0, 0, 0, hour, minute);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);
      const endTimeStr = `${slotEnd
        .getHours()
        .toString()
        .padStart(2, "0")}:${slotEnd.getMinutes().toString().padStart(2, "0")}`;

        const isAvailable = isTimeSlotAvailable(time);

        return {
          value: time,
          label: isAvailable
            ? `${time} - ${endTimeStr} (${totalDuration} dk)`
            : `${time} - dolu (seçilebilir)`,
          // Artık hiçbir zaman dilimini devre dışı bırakmıyoruz. Kullanıcı çakışmalı
          // bir saat seçerse form gönderiminde onay istenecek.
          isDisabled: false,
          endTime: endTimeStr,
        };
    });

    return availableSlots;
  }, [
    form.employeeId,
    form.date,
    form.selectedServices,
    appointments,
    totalDuration,
  ]);

  // --- Zaman çakışması kontrolü ---
  const checkTimeConflict = useCallback(() => {
    if (!form.time) return false;
    const [sh, sm] = form.time.split(":").map(Number);
    const selectedStart = new Date(0, 0, 0, sh, sm);
    const selectedEnd = new Date(
      selectedStart.getTime() + totalDuration * 60000
    );

    return appointments.some((app) => {
      if (
        app.employee?._id !== form.employeeId ||
        app.date !== form.date ||
        app.status === "cancelled"
      )
        return false;
      if (!app.time) return false;

      const [appHour, appMinute] = app.time.split(":").map(Number);
      const appStart = new Date(0, 0, 0, appHour, appMinute);
      const appEnd = new Date(
        appStart.getTime() + (app.duration || 30) * 60000
      );

      return (
        selectedStart < appEnd && selectedEnd > appStart // Çakışma varsa true
      );
    });
  }, [appointments, form.date, form.employeeId, form.time, totalDuration]);

  // --- Form validasyonu ---
  const validateForm = () => {
    const newErrors = {};
    if (!form.customerId) newErrors.customerId = "Müşteri seçimi zorunludur.";
    if (!form.employeeId) newErrors.employeeId = "Çalışan seçimi zorunludur.";
    if (!form.date) newErrors.date = "Tarih zorunludur.";
    if (!form.time) newErrors.time = "Saat seçimi zorunludur.";
    
    // Paket seçilmişse hizmet seçimi zorunlu değil, aksi takdirde zorunlu
    if (form.selectedServices.length === 0 && !form.selectedCustomerPackage) {
      newErrors.selectedServices = "En az bir hizmet seçmelisiniz.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Form submit ---
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!forceSend && checkTimeConflict()) {
      setConflictModalOpen(true);
      return;
    }

    // Paket hizmetleri ve normal hizmetleri ayır
    const packageServices = form.selectedServices.filter(svc => svc.isPackage);
    const normalServices = form.selectedServices.filter(svc => !svc.isPackage);

    // Normal hizmetler için payload
    const selectedServicesForPayload = normalServices.map((svc) => ({
      _id: svc.value,
      name: svc.label.split(" (")[0],
      duration: svc.duration,
      price: svc.price,
    }));

    // Paket hizmeti varsa onu da ekle
    if (packageServices.length > 0) {
      packageServices.forEach(pkgSvc => {
        selectedServicesForPayload.push({
          _id: pkgSvc.packageData?.package?.service?._id,
          name: pkgSvc.packageData?.package?.service?.name || 'Paket Hizmeti',
          duration: pkgSvc.duration,
          price: 0, // Paket hizmeti ücretsiz
        });
      });
    }

    const calculatedDuration = selectedServicesForPayload.reduce(
      (total, svc) => total + (svc.duration || 30),
      0
    );

    // Paket bilgisini belirle
    let customerPackageInfo = null;
    if (packageServices.length > 0) {
      customerPackageInfo = {
        _id: packageServices[0].packageData?._id,
        sessionCount: form.packageSessionCount
      };
    } else if (form.selectedCustomerPackage) {
      customerPackageInfo = {
        _id: form.selectedCustomerPackage._id,
        sessionCount: form.packageSessionCount
      };
    }

    const payload = {
      customerId: form.customerId,
      employee: form.employeeId,
      date: form.date,
      time: form.time,
      services: selectedServicesForPayload.map((svc) => svc._id),
      duration: calculatedDuration, // Manuel süre kaldırıldı, sadece hesaplanan süre kullanılıyor
      notes: form.notes || undefined,
      force: forceSend,
      customerPackage: customerPackageInfo,
    };
    
    console.log("Gönderilen veri:", payload);
    onSubmit(payload);
  };

  // --- Yeni müşteri ekleme işlemleri ---
  const handleAddNewCustomer = () => {
    onAddCustomer(); // Parent component'teki modal'ı aç
  };

  return (
    <>
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Müşteri seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Müşteri
          </label>
          <Select
            options={filteredCustomerOptions}
            onInputChange={(value) => setCustomerSearch(value)}
            onChange={(opt) =>
              setForm({ ...form, customerId: opt?.value || "" })
            }
            placeholder="Müşteri ara / seç..."
            isClearable
            value={
              customerOptions.find((opt) => opt.value === form.customerId) ||
              null
            }
            classNamePrefix="react-select"
          />
          {errors.customerId && (
            <p className="text-red-600 text-sm mt-1">{errors.customerId}</p>
          )}
          <button
            type="button"
            className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
            onClick={handleAddNewCustomer}
          >
            + Yeni Müşteri
          </button>
        </div>

        {/* Müşteri Paketleri - Bu kısmı kaldırıyoruz */}
        {/* {form.customerId && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Müşteri Paketleri (Opsiyonel)
              </label>
              
              <div className="text-xs text-gray-500 mb-2">
                Paket sayısı: {customerPackages.length} | 
                Aktif paketler: {customerPackages.filter(pkg => pkg.status === 'active' && pkg.remainingQuantity > 0).length}
              </div>
              
              <Select
                options={customerPackages
                  .filter(pkg => pkg.status === 'active' && pkg.remainingQuantity > 0)
                  .map(pkg => ({
                    value: pkg._id,
                    label: `${pkg.package?.service?.name || 'Hizmet'} - ${pkg.remainingQuantity} seans kaldı`,
                    package: pkg
                  }))}
                onChange={(opt) => {
                  setForm({ 
                    ...form, 
                    selectedCustomerPackage: opt?.package || null,
                    packageSessionCount: 1 // Paket seçildiğinde seans sayısını sıfırla
                  });
                }}
                placeholder={customerPackages.length === 0 ? "Müşterinin paketi bulunmuyor..." : "Paket seçin (opsiyonel)..."}
                isClearable
                classNamePrefix="react-select"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paket seçerseniz, randevu ücretsiz olacak ve seans kullanılacak
              </p>
            </div>
          </div>
        )} */}

        {/* Paket seçildiğinde seans sayısı ve manuel süre seçimi */}
        {(form.selectedCustomerPackage || form.selectedServices.some(svc => svc.isPackage)) && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h4 className="font-medium text-blue-900">Paket Ayarları</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kullanılacak Seans Sayısı
                </label>
                <select
                  value={form.packageSessionCount}
                  onChange={(e) => setForm({ ...form, packageSessionCount: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: Math.min(
                    form.selectedCustomerPackage?.remainingQuantity || 
                    form.selectedServices.find(svc => svc.isPackage)?.packageData?.remainingQuantity || 
                    10, 10) }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} seans</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Kalan: {form.selectedCustomerPackage?.remainingQuantity || 
                  form.selectedServices.find(svc => svc.isPackage)?.packageData?.remainingQuantity || 0} seans
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manuel Süre (dakika)
                </label>
                <input
                  type="number"
                  value={form.manualDuration}
                  onChange={(e) => setForm({ ...form, manualDuration: e.target.value })}
                  placeholder="Otomatik hesaplanacak"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Boş bırakırsanız otomatik hesaplanır
                </p>
              </div>
            </div>

            <div className="bg-white p-3 rounded border">
              <p className="text-sm text-gray-700">
                <strong>Seçilen Paket:</strong> {
                  form.selectedCustomerPackage?.package?.service?.name || 
                  form.selectedServices.find(svc => svc.isPackage)?.packageData?.package?.service?.name || 
                  'Hizmet'
                }
              </p>
              <p className="text-sm text-gray-600">
                {form.packageSessionCount} seans kullanılacak • 
                Süre otomatik hesaplanacak
              </p>
            </div>
          </div>
        )}

        {/* Çalışan seçimi */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Çalışan
          </label>
          <Select
            options={employeeOptions}
            onChange={(opt) =>
              setForm({ ...form, employeeId: opt?.value || "" })
            }
            placeholder="Çalışan seçin..."
            isClearable
            value={
              employeeOptions.find((opt) => opt.value === form.employeeId) ||
              null
            }
            classNamePrefix="react-select"
          />
          {errors.employeeId && (
            <p className="text-red-600 text-sm mt-1">{errors.employeeId}</p>
          )}
        </div>

        {/* Tarih ve Saat */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tarih
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value, time: "" }))
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={new Date().toISOString().split("T")[0]}
            />
            {errors.date && (
              <p className="text-red-600 text-sm mt-1">{errors.date}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Saat
            </label>
            <Select
              options={timeOptions}
              value={timeOptions.find((opt) => opt.value === form.time) || null}
              onChange={(opt) =>
                setForm((prev) => ({ ...prev, time: opt?.value || "" }))
              }
              placeholder="Saat seçin..."
              isClearable
              isDisabled={
                !form.employeeId ||
                !form.date ||
                (form.selectedServices.length === 0 && !form.selectedCustomerPackage)
              }
              noOptionsMessage={() => "Uygun zaman aralığı bulunamadı"}
              classNamePrefix="react-select"
              isOptionDisabled={(option) => option.isDisabled}
              styles={{
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isDisabled
                    ? "#f3f4f6"
                    : state.isSelected
                    ? "#3b82f6"
                    : "white",
                  color: state.isDisabled
                    ? "#9ca3af"
                    : state.isSelected
                    ? "white"
                    : "#1f2937",
                  cursor: state.isDisabled ? "not-allowed" : "default",
                  "&:hover": {
                    backgroundColor: state.isDisabled
                      ? "#f3f4f6"
                      : state.isSelected
                      ? "#2563eb"
                      : "#f3f4f6",
                  },
                }),
              }}
            />
            {errors.time && (
              <p className="text-red-600 text-sm mt-1">{errors.time}</p>
            )}
          </div>
        </div>

        {/* Hizmetler */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Hizmetler
            </label>
            <span className="text-sm text-gray-500">
              Toplam süre: {totalDuration} dakika | Toplam fiyat: ₺
              {totalPrice.toFixed(2)}
            </span>
          </div>
          <Select
            isMulti
            options={serviceOptions}
            value={form.selectedServices}
            onChange={(selected) => {
              const selectedArray = selected || [];
              
              // Paket hizmeti seçildi mi kontrol et
              const packageService = selectedArray.find(svc => svc.isPackage);
              
              if (packageService) {
                // Paket seçildiğinde paket bilgilerini güncelle ve sadece paket hizmetini bırak
                setForm({ 
                  ...form, 
                  selectedServices: [packageService],
                  selectedCustomerPackage: packageService.packageData,
                  packageSessionCount: 1
                });
              } else {
                // Normal hizmet seçimi
                setForm({ 
                  ...form, 
                  selectedServices: selectedArray,
                  selectedCustomerPackage: null,
                  packageSessionCount: 1
                });
              }
            }}
            placeholder="Hizmet seçin..."
            classNamePrefix="react-select"
            isLoading={loading}
            closeMenuOnSelect={false}
            styles={{
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.data?.isPackage 
                  ? (state.isSelected ? '#2563eb' : '#dbeafe')
                  : (state.isSelected ? '#3b82f6' : 'white'),
                color: state.data?.isPackage && !state.isSelected ? '#1e40af' : provided.color,
                fontWeight: state.data?.isPackage ? '600' : 'normal'
              })
            }}
          />
          {errors.selectedServices && (
            <p className="text-red-600 text-sm mt-1">
              {errors.selectedServices}
            </p>
          )}
        </div>

        {/* Notlar */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Notlar
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
          />
        </div>

        {/* İşlem butonları */}
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Randevu Oluştur
          </button>
        </div>
      </form>

      {/* Çakışma Modalı */}
      <Modal
        open={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
      >
        <h3 className="text-lg font-semibold mb-4">Zaman Çakışması</h3>
        <p>
          Seçtiğiniz tarih ve saat, başka bir randevu ile çakışıyor. Yine de
          devam etmek istiyor musunuz?
        </p>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setConflictModalOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Vazgeç
          </button>
          <button
            onClick={() => {
              setForceSend(true);
              setConflictModalOpen(false);
              // Formu tekrar submit et
              setTimeout(() => {
                document
                  .querySelector("form")
                  .dispatchEvent(
                    new Event("submit", { cancelable: true, bubbles: true })
                  );
              }, 10);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            Zorla Gönder
          </button>
        </div>
      </Modal>
    </>
  );
};

export default AppointmentForm;
