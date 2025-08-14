import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomerPackages } from "../redux/customerPackagesSlice";

const AppointmentEditForm = ({ 
  initialData, 
  users, 
  customers, 
  services: availableServices, 
  appointments, 
  onSubmit, 
  onCancel, 
  onAddCustomer 
}) => {
  const dispatch = useDispatch();
  const { items: customerPackages } = useSelector((state) => state.customerPackages);
  
  const [form, setForm] = useState({
    customerId: '',
    employeeId: '',
    date: '',
    time: '',
    selectedServices: [],
    notes: '',
    customerPackage: null,
    packageSessionCount: 1,
    manualDuration: '', // Manuel süre için eklendi
  });

  const [serviceSearch, setServiceSearch] = useState('');
  const [totalDuration, setTotalDuration] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceDuration, setServiceDuration] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(null); // Modalda onay bekleyen submit verisi
  
  // initialData değiştiğinde formu ayarla
  useEffect(() => {
    if (initialData) {
      const selectedServices = initialData.services?.map(service => ({
        value: service._id,
        label: `${service.name} (${service.duration} dk - ${service.price} TL)`,
        duration: service.duration,
        price: service.price
      })) || [];

      setForm({
        customerId: initialData.customer?._id || '',
        employeeId: initialData.employee?._id || '',
        date: initialData.date || '',
        time: initialData.time || '',
        selectedServices,
        notes: initialData.notes || '',
        customerPackage: initialData.customerPackage || null,
        packageSessionCount: initialData.packageSessionCount || 1,
      });

      // Toplam süre ve fiyatı hesapla
      const duration = selectedServices.reduce((sum, svc) => sum + (svc.duration || 0), 0);
      const price = selectedServices.reduce((sum, svc) => sum + (svc.price || 0), 0);
      setTotalDuration(duration);
      setTotalPrice(price);
      setServiceDuration(duration);
    }
  }, [initialData, availableServices]);

  // Seçili hizmetler değiştiğinde toplam süre ve fiyatı güncelle
  useEffect(() => {
    const duration = form.selectedServices.reduce((sum, svc) => sum + (svc.duration || 0), 0);
    const price = form.selectedServices.reduce((sum, svc) => sum + (svc.price || 0), 0);
    setTotalDuration(duration);
    setTotalPrice(price);
    setServiceDuration(duration);
    
    // Hizmet değiştiğinde zaman seçimini koruyalım, ancak uygun olup olmadığını kontrol edelim
    if (form.time && form.employeeId && form.date) {
      // Mevcut seçili zamanın uygun olup olmadığını kontrol et
      const [sh, sm] = form.time.split(':').map(Number);
      const slotStart = new Date(0, 0, 0, sh, sm);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      
      // Gün sonu kontrolü
      const endOfDay = new Date(0, 0, 0, 20, 0); // Kapanış saati 20:00
      if (slotEnd > endOfDay) {
        // Eğer yeni süre ile randevu kapanış saatini aşıyorsa, zamanı sıfırla
        setForm(prev => ({ ...prev, time: '' }));
      }
    }
  }, [form.selectedServices, form.employeeId, form.date, form.time]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Müşteri seçildiğinde paketlerini çek
  useEffect(() => {
    if (form.customerId) {
      console.log('🔄 Müşteri paketleri yükleniyor:', form.customerId);
      dispatch(fetchCustomerPackages(form.customerId));
    }
  }, [dispatch, form.customerId]);

  // form.customerPackage sadece ID olabilir, store'dan gerçek paketi bul
  const effectiveCustomerPackage = useMemo(() => {
    const maybe = form.customerPackage;
    // Zaten remainingQuantity varsa doğrudan kullan
    if (maybe && typeof maybe === 'object' && maybe.remainingQuantity != null) {
      return maybe;
    }
    // ID/string durumunda store'dan gerçek paketi bul
    const id = typeof maybe === 'string' ? maybe : maybe?._id;
    if (id) {
      return customerPackages.find(p => p._id === id) || null;
    }
    return null;
  }, [form.customerPackage, customerPackages]);

  const serviceOptions = useMemo(() => {
    return availableServices.map((s) => ({
      value: s._id,
      label: `${s.name} (${s.duration} dk - ${s.price} ₺)`,
      duration: s.duration,
      price: s.price
    }));
  }, [availableServices]);

  const filteredServiceOptions = useMemo(() => {
    if (!serviceSearch) return serviceOptions;
    return serviceOptions.filter(option => 
      option.label.toLowerCase().includes(serviceSearch.toLowerCase())
    );
  }, [serviceOptions, serviceSearch]);

  const customerOptions = customers.map((c) => ({
    value: c._id,
    label: `${c.name} - ${c.phone || ''}`,
  }));

  const filteredCustomerOptions = useMemo(() => {
    return customerOptions.filter((c) =>
      c.label.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customerSearch, customerOptions]);

  const employeeOptions = users
    .filter((user) => user.role === 'employee' || user.role === 'admin')
    .map((emp) => ({
      value: emp._id,
      label: `${emp.name} - ${emp.job}`,
    }));

  const timeOptions = useMemo(() => {
    if (!form.employeeId || !form.date || serviceDuration === 0) return [];
  
    const startHour = 9;
    const endHour = 20;
    const interval = 15;
  
    const times = [];
    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += interval) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }
  
    const employeeAppointments = appointments.filter(
      (app) =>
        app.employee?._id === form.employeeId &&
        app.date === form.date &&
        app._id !== initialData?._id && // düzenlenen randevuyu hariç tut
        app.status !== "cancelled"
    );
  
    const isTimeSlotAvailable = (timeSlot) => {
      const [sh, sm] = timeSlot.split(':').map(Number);
      const slotStart = new Date(0, 0, 0, sh, sm);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
  
      const endOfDay = new Date(0, 0, 0, 20, 0); // Kapanış saati 20:00
      if (slotEnd > endOfDay) return false;
  
      return !employeeAppointments.some((app) => {
        if (!app.time) return false;
  
        const [ah, am] = app.time.split(':').map(Number);
        const appStart = new Date(0, 0, 0, ah, am);
        const appEnd = new Date(appStart.getTime() + (app.duration || 30) * 60000);
  
        return (
          (slotStart >= appStart && slotStart < appEnd) ||
          (slotEnd > appStart && slotEnd <= appEnd) ||
          (slotStart <= appStart && slotEnd >= appEnd)
        );
      });
    };
  
    return times.map((time) => {
      const [hour, minute] = time.split(':').map(Number);
      const slotStart = new Date(0, 0, 0, hour, minute);
      const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);
      const endTimeStr = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`;
  
      const isAvailable = isTimeSlotAvailable(time);
      // isOptionDisabled artık Select bileşeninin kendi prop'u tarafından yönetilecek,
      // burada isDisabled her zaman false olacak ki Select'te seçilebilir olsun.
      // Ancak label'da dolu bilgisi verilecek.
      return {
        value: time,
        label: isAvailable
          ? `${time} - ${endTimeStr} (${serviceDuration} dk)`
          : `${time} - ${endTimeStr} (${serviceDuration} dk) - dolu`, // Dolu bilgisini label'a ekledik
        isDisabled: false, // Artık Select içinde disable edilmeyecek
      };
    });
  }, [
    form.employeeId,
    form.date,
    serviceDuration,
    appointments,
    initialData,
  ]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('🚀 FORM SUBMIT DEBUG:');
    console.log('📋 Form state:', form);
    console.log('📋 Selected services:', form.selectedServices);
    console.log('📋 Customer ID:', form.customerId);
    console.log('📋 Employee ID:', form.employeeId);
    console.log('📋 Date:', form.date);
    console.log('📋 Time:', form.time);
    
    // Validate form
    if (!form.customerId || !form.employeeId || !form.date || !form.time || form.selectedServices.length === 0) {
      console.log('❌ VALIDATION FAILED');
      alert('Lütfen tüm alanları doldurun');
      return;
    }
    
    // Paket seansı kontrolü (effectiveCustomerPackage üzerinden)
    if (effectiveCustomerPackage && form.packageSessionCount) {
      const remainingSessions = effectiveCustomerPackage.remainingQuantity || 0;
      if (form.packageSessionCount > remainingSessions) {
        alert(`Bu paketin yeterli seansı yok. Kalan seans: ${remainingSessions}, İstenen: ${form.packageSessionCount}`);
        return;
      }
    }
    
    // Check if the selected time slot is available
    const selectedTimeOption = timeOptions.find(opt => opt.value === form.time);
    const isTimeSlotBusy = selectedTimeOption?.label.includes('dolu');
    
    // services alanını backend'in beklediği şekilde ID'lere mapleyelim
    const serviceIds = (form.selectedServices || [])
      .map(s => {
        console.log('🔍 Processing service:', s);
        if (s && typeof s === 'object') {
          return s.value || s._id || s.serviceId;
        }
        return s;
      })
      .filter(Boolean);
  
    console.log('🔍 Final service IDs:', serviceIds);
  
    // Backend için doğru payload
    const appointmentData = {
      employee: form.employeeId,
      customer: form.customerId,
      date: form.date,
      time: form.time,
      notes: form.notes || '',
      duration: form.manualDuration ? parseInt(form.manualDuration, 10) : totalDuration,
      services: serviceIds,
    };
  
    // Paket bilgisi varsa ekleyelim
    if (effectiveCustomerPackage?._id && form.packageSessionCount && 
        form.packageSessionCount <= (effectiveCustomerPackage.remainingQuantity || 0)) {
      appointmentData.customerPackage = { _id: effectiveCustomerPackage._id };
      appointmentData.packageSessionCount = form.packageSessionCount;
    }
    
    console.log('🚀 Final payload:', appointmentData);
    
    if (isTimeSlotBusy) {
      setPendingSubmit(appointmentData);
      setShowConfirmModal(true);
    } else {
      onSubmit(appointmentData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Müşteri */}
      <div>
        <label className="block font-medium mb-1">Müşteri</label>
        <div className="flex space-x-2 items-center">
          <div className="flex-1">
            <Select
              options={filteredCustomerOptions}
              onInputChange={(val) => setCustomerSearch(val)}
              onChange={(opt) => setForm((prev) => ({ ...prev, customerId: opt?.value || '' }))}
              value={customerOptions.find((opt) => opt.value === form.customerId) || null}
              placeholder="Müşteri ara / seç..."
              isClearable
            />
          </div>
          <button type="button" onClick={onAddCustomer} className="text-sm text-blue-600 underline">
            + Yeni Ekle
          </button>
        </div>
      </div>

      {/* Çalışan */}
      <div>
        <label className="block font-medium mb-1">Çalışan</label>
        <Select
          name="employeeId"
          options={employeeOptions}
          onChange={(opt) => setForm((prev) => ({ ...prev, employeeId: opt?.value || '' }))}
          value={employeeOptions.find(opt => opt.value === form.employeeId) || null}
          placeholder="Çalışan seçin..."
          isClearable
        />
      </div>

      {/* Tarih & Saat */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Tarih</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value, time: '' }))}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Saat</label>
          <Select
            options={timeOptions}
            value={timeOptions.find(opt => String(opt.value) === String(form.time)) || null}
            onChange={(opt) => setForm((prev) => ({ ...prev, time: opt?.value || '' }))}
            isDisabled={!form.employeeId || !form.date || (serviceDuration === 0 && form.serviceId === '')}
            // isOptionDisabled artık kullanılmıyor, tüm seçenekler seçilebilir
            placeholder="Saat seçin..."
            isClearable
          />
        </div>
      </div>

      {/* Hizmetler */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block font-medium">Hizmetler</label>
          {form.selectedServices.length > 0 && (
            <div className="text-sm text-gray-600">
              Toplam: {totalDuration} dk • {totalPrice.toFixed(2)} TL
            </div>
          )}
        </div>
        <Select
          isMulti
          options={filteredServiceOptions}
          value={form.selectedServices}
          onChange={(selected) => {
            setForm(prev => ({
              ...prev,
              selectedServices: selected || []
              // Zaman sıfırlamayı kaldırdık, böylece hizmet değiştiğinde zaman korunacak
            }));
          }}
          onInputChange={(inputValue) => setServiceSearch(inputValue)}
          placeholder="Hizmet ara veya seç..."
          noOptionsMessage={() => 'Hizmet bulunamadı'}
          isClearable
          isSearchable
          className="basic-multi-select"
          classNamePrefix="select"
          closeMenuOnSelect={false}
        />
      </div>

      {/* Notlar */}
      <div>
        <label className="block font-medium mb-1">Notlar</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
      </div>

      {/* Paket Bilgisi - Mevcut paket kullanımı */}
      {effectiveCustomerPackage && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded">
          <h4 className="font-medium text-blue-900 mb-2">📦 Paket Kullanımı</h4>
          <p><strong>Paket:</strong> {effectiveCustomerPackage.package?.service?.name || 'Hizmet'}</p>
          <p>
            <strong>Paket Seansı:</strong> {effectiveCustomerPackage.totalQuantity} | 
            <span className="ml-2">Kalan: {effectiveCustomerPackage.remainingQuantity}</span>
          </p>
        </div>
      )}
      
      {/* Paket Ayarları */}
      {effectiveCustomerPackage && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kullanılacak Seans Sayısı
          </label>
          <select
            value={form.packageSessionCount}
            onChange={(e) => setForm({ ...form, packageSessionCount: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Array.from({ length: Math.min(
              Math.max(effectiveCustomerPackage?.remainingQuantity || 0, 1), 10) }, (_, i) => i + 1).map(num => (
              <option key={num} value={num} disabled={num > (effectiveCustomerPackage?.remainingQuantity || 0)}>
                {num} seans {num > (effectiveCustomerPackage?.remainingQuantity || 0) ? '(Yetersiz)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Kalan: {effectiveCustomerPackage?.remainingQuantity || 0} seans
          </p>
          {(effectiveCustomerPackage?.remainingQuantity || 0) === 0 && (
            <p className="text-xs text-red-500 mt-1">
              ⚠️ Bu paketin hiç seansı kalmamış. Lütfen başka bir paket seçin.
            </p>
          )}
        </div>
      )}

      {/* Butonlar */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
          Vazgeç
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Güncelle
        </button>
      </div>
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full space-y-4">
            <h2 className="text-lg font-semibold">Uyarı</h2>
            <p>Seçtiğiniz saat dolu görünüyor. Yine de bu saatte güncellemek istiyor musunuz?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  onSubmit({ ...pendingSubmit, force: true }); // force burada true oldu!
                  setShowConfirmModal(false);
                  setPendingSubmit(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Evet, eminim
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingSubmit(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default AppointmentEditForm;