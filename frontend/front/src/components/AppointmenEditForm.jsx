import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';

export default function AppointmentEditForm({
  initialData,
  employees,
  customers,
  appointments,
  services,
  onSubmit,
  onCancel,
  onAddCustomer,
}) {
  const [form, setForm] = useState({
    customerId: '',
    employeeId: '',
    date: '',
    time: '',
    serviceId: '', // Tek bir hizmet için _id tutuyoruz
    notes: '',
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [serviceDuration, setServiceDuration] = useState(0);

  // initialData değiştiğinde formu ve serviceDuration'ı ayarla
  useEffect(() => {
    if (initialData) {
      const initialServiceId = initialData.services?.[0]?._id || '';
      setForm({
        customerId: initialData.customer?._id || '',
        employeeId: initialData.employee?._id || '',
        date: initialData.date || '',
        time: initialData.time || '',
        serviceId: initialServiceId,
        notes: initialData.notes || '',
      });

      // Hizmet ID'si set edildiğinde süreyi de hemen bul ve ayarla
      const selectedService = services.find(s => s._id === initialServiceId);
      setServiceDuration(selectedService?.duration || 0);

      console.log('Edit açıldı - initialData:', initialData);
      console.log('Edit açıldı - form state:', {
        customerId: initialData.customer?._id || '',
        employeeId: initialData.employee?._id || '',
        date: initialData.date || '',
        time: initialData.time || '',
        serviceId: initialServiceId,
        notes: initialData.notes || '',
      });
      console.log('Edit açıldı - selectedService:', selectedService);
    }
  }, [initialData, services]);

  // Sadece form.serviceId değiştiğinde süreyi güncelle (kullanıcı select'ten seçtiğinde)
  useEffect(() => {
    const selectedService = services.find(s => s._id === form.serviceId);
    setServiceDuration(selectedService?.duration || 0);
  }, [form.serviceId, services]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const requiredFields = ['customerId', 'employeeId', 'date', 'time', 'serviceId'];
    const hasEmpty = requiredFields.some((field) => !form[field]); // .trim() kaldırdık, çünkü boş string zaten false döner
    if (hasEmpty) {
      alert('Tüm alanları doldurunuz.');
      return;
    }

    // Seçilen hizmet nesnesini bul
    const selectedService = services.find((s) => s._id === form.serviceId);

    if (!selectedService) {
        alert('Lütfen bir hizmet seçin.');
        return;
    }

    onSubmit({
      employee: form.employeeId,
      customer: form.customerId,
      date: form.date,
      time: form.time,
      services: [{ // Tek bir hizmet ID'si ile gönderiyoruz
        _id: selectedService._id,
        name: selectedService.name,
        duration: selectedService.duration,
        price: selectedService.price,
      }],
      duration: serviceDuration, // Buraya serviceDuration'ı gönderiyoruz
      notes: form.notes,
    });
  };

  const customerOptions = customers.map((c) => ({
    value: c._id,
    label: `${c.name} - ${c.phone || ''}`,
  }));

  const filteredCustomerOptions = useMemo(() => {
    return customerOptions.filter((c) =>
      c.label.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customerSearch, customerOptions]);

  const employeeOptions = employees.map(emp => ({
    value: emp._id,
    label: `${emp.name} - ${emp.role}`
  }));


  const timeOptions = useMemo(() => {
    // serviceDuration 0 ise ve bu 0, bir hizmetin gerçek süresi değilse, saat seçeneklerini gösterme.
    // Eğer serviceDuration 0 ve form.serviceId boşsa, henüz hizmet seçilmemiştir.
    if (!form.employeeId || !form.date || (serviceDuration === 0 && form.serviceId === '')) return [];

    const startHour = 9;
    const endHour = 20;
    const interval = 15;

    const employeeAppointments = appointments.filter(
      (a) =>
        a.employee?._id === form.employeeId &&
        a.date === form.date &&
        a._id !== initialData?._id // güncellenen randevuyu hariç tut
    );

    const times = [];

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += interval) {
        const hourStr = h.toString().padStart(2, '0');
        const minStr = m.toString().padStart(2, '0');
        const time = `${hourStr}:${minStr}`;

        const start = new Date(0, 0, 0, h, m);
        const end = new Date(start.getTime() + serviceDuration * 60000);

        const endHourLimit = new Date(0, 0, 0, 20, 0); // 20:00'dan sonra randevu olmasın
        if (end > endHourLimit) continue;

        const isConflict = employeeAppointments.some((a) => {
          if (!a.time || !a.duration) return false;

          const [ah, am] = a.time.split(':').map(Number);
          const aStart = new Date(0, 0, 0, ah, am);
          const aEnd = new Date(aStart.getTime() + a.duration * 60000);

          return (
            (start >= aStart && start < aEnd) ||
            (end > aStart && end <= aEnd) ||
            (start <= aStart && end >= aEnd)
          );
        });

        times.push({
          value: time,
          label: isConflict
            ? `${time} - Dolu`
            : `${time} - ${new Date(0, 0, 0, end.getHours(), end.getMinutes()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${serviceDuration} dk)`,
          isDisabled: isConflict,
        });
      }
    }

    return times;
  }, [form.employeeId, form.date, serviceDuration, appointments, initialData]);

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
            isOptionDisabled={(option) => option.isDisabled}
            placeholder="Saat seçin..."
            isClearable
          />
        </div>
      </div>

      {/* Hizmet */}
      <div>
        <label className="block font-medium mb-1">Hizmet</label>
        <select
          name="serviceId"
          value={form.serviceId} // String'e çevirme kaldırıldı, doğrudan kullanabiliriz.
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Seçiniz</option>
          {(services || []).map((s) => (
            <option key={s._id} value={s._id}> {/* Value'yu doğrudan kullanıyoruz */}
              {s.name} ({s.duration} dk)
            </option>
          ))}
        </select>
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

      {/* Butonlar */}
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded">
          Vazgeç
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Güncelle
        </button>
      </div>
    </form>
  );
}