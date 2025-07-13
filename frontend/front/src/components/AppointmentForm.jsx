import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { fetchServices } from '../redux/servicesSlice';

export default function AppointmentForm({ employees, customers, appointments, onCancel, onSubmit, onAddCustomer, initialData = null }) {
  const dispatch = useDispatch();
  const { items: services, loading } = useSelector(state => state.services);

  const [form, setForm] = useState({
    employeeId: '',
    customerId: '',
    date: '',
    time: '',
    selectedServices: [],
    notes: '',
  });

  const [totalDuration, setTotalDuration] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // initialData değiştiğinde formu güncelle
  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        employeeId: initialData.employeeId || prev.employeeId,
        date: initialData.date || prev.date,
        time: initialData.time || prev.time,
        // Eğer initialData'da serviceId varsa seçili hizmetlere ekle
        selectedServices: initialData.serviceId ? [services.find(s => s._id === initialData.serviceId)].filter(Boolean).map(svc => ({
          value: svc._id,
          label: `${svc.name} (${svc.duration} dk)`,
          duration: svc.duration
        })) : prev.selectedServices,
      }));
    }
  }, [initialData, services]);


  // Hizmet seçimi değiştiğinde toplam süreyi güncelle
  useEffect(() => {
    const duration = form.selectedServices.reduce(
      (sum, svc) => sum + (svc.duration || 0), 0
    );
    setTotalDuration(duration);
  }, [form.selectedServices]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.selectedServices.length === 0) {
      alert('Lütfen en az bir hizmet seçin');
      return;
    }

    if (!form.customerId || !form.employeeId || !form.date || !form.time) {
      alert('Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    const selectedServicesForPayload = form.selectedServices.map(svc => ({
      _id: svc.value,
      name: svc.label.split(' (')[0],
      duration: svc.duration,
      // price alanını backend'e göndermek isteyebilirsin
      // price: services.find(s => s._id === svc.value)?.price || 0
    }));

    const calculatedDuration = selectedServicesForPayload.reduce((total, svc) => total + (svc.duration || 30), 0);

    const payload = {
      customerId: form.customerId,
      employee: form.employeeId, // Backend'e sadece ID gönderiyoruz
      date: form.date,
      time: form.time,
      services: selectedServicesForPayload.map(svc => svc._id), // Sadece hizmet ID'lerini gönder
      duration: calculatedDuration,
      notes: form.notes || undefined
    };

    console.log('Gönderilen veri:', payload);
    onSubmit(payload);
  };

  const serviceOptions = services.map(svc => ({
    value: svc._id,
    label: `${svc.name} (${svc.duration} dk)`,
    duration: svc.duration,
    price: svc.price
  }));

  const employeeOptions = employees.map(emp => ({
    value: emp._id,
    label: `${emp.name} - ${emp.role}`
  }));

  const customerOptions = customers.map(cust => ({
    value: cust._id,
    label: `${cust.name} - ${cust.phone}`
  }));

  const filteredCustomerOptions = useMemo(() => {
    return customerOptions.filter((c) =>
      c.label.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customerSearch, customerOptions]);

  const timeOptions = useMemo(() => {
    if (!form.employeeId || !form.date || totalDuration === 0) return [];

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
      app => app.employee?._id === form.employeeId &&
        app.date === form.date &&
        app.status !== 'cancelled'
    );

    const isTimeSlotAvailable = (timeSlot) => {
      const [startHourSlot, startMinuteSlot] = timeSlot.split(':').map(Number);
      const slotStart = new Date(0, 0, 0, startHourSlot, startMinuteSlot);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);

      const endOfDay = new Date(0, 0, 0, 20, 0, 0);
      if (slotEnd > endOfDay) return false;

      return !employeeAppointments.some(app => {
        if (!app.time) return false;

        const [appHour, appMinute] = app.time.split(':').map(Number);
        const appStart = new Date(0, 0, 0, appHour, appMinute);
        const appEnd = new Date(appStart.getTime() + (app.duration || 30) * 60000);

        return (
          (slotStart >= appStart && slotStart < appEnd) ||
          (slotEnd > appStart && slotEnd <= appEnd) ||
          (slotStart <= appStart && slotEnd >= appEnd)
        );
      });
    };

    const availableSlots = [];
    for (let i = 0; i < times.length; i++) {
      const time = times[i];
      const [hour, minute] = time.split(':').map(Number);
      const slotStart = new Date(0, 0, 0, hour, minute);
      const slotEnd = new Date(slotStart.getTime() + totalDuration * 60000);
      const endTimeStr = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd.getMinutes().toString().padStart(2, '0')}`;

      const isAvailable = isTimeSlotAvailable(time);

      availableSlots.push({
        value: time,
        label: isAvailable
          ? `${time} - ${endTimeStr} (${totalDuration} dk)`
          : `${time} - Dolu`,
        isDisabled: !isAvailable,
        endTime: endTimeStr
      });
    }

    return availableSlots;
  }, [form.employeeId, form.date, form.selectedServices, appointments, totalDuration]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Müşteri</label>
        <Select
          options={filteredCustomerOptions}
          onInputChange={(value) => setCustomerSearch(value)}
          onChange={(opt) => setForm({ ...form, customerId: opt?.value || '' })}
          placeholder="Müşteri ara / seç..."
          isClearable
          value={customerOptions.find(opt => opt.value === form.customerId) || null}
        />
        <button
          type="button"
          className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
          onClick={onAddCustomer}
        >
          + Yeni Müşteri
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Çalışan</label>
        <Select
          options={employeeOptions}
          onChange={(opt) => setForm({ ...form, employeeId: opt?.value || '' })}
          placeholder="Çalışan seçin..."
          isClearable
          required
          value={employeeOptions.find(opt => opt.value === form.employeeId) || null}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tarih</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => {
              setForm(prev => ({ ...prev, date: e.target.value, time: '' }));
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Saat</label>
          <Select
            options={timeOptions}
            value={timeOptions.find(opt => opt.value === form.time) || null}
            onChange={(opt) => setForm(prev => ({ ...prev, time: opt?.value || '' }))}
            placeholder="Saat seçin..."
            isClearable
            required
            isDisabled={!form.employeeId || !form.date || form.selectedServices.length === 0}
            noOptionsMessage={() => "Uygun zaman aralığı bulunamadı"}
            className="react-select-container"
            classNamePrefix="react-select"
            isOptionDisabled={(option) => option.isDisabled}
            styles={{
              option: (provided, state) => ({
                ...provided,
                backgroundColor: state.isDisabled ? '#f3f4f6' : state.isSelected ? '#3b82f6' : 'white',
                color: state.isDisabled ? '#9ca3af' : state.isSelected ? 'white' : '#1f2937',
                cursor: state.isDisabled ? 'not-allowed' : 'default',
                '&:hover': {
                  backgroundColor: state.isDisabled ? '#f3f4f6' : state.isSelected ? '#2563eb' : '#f3f4f6',
                },
              }),
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">Hizmetler</label>
          <span className="text-sm text-gray-500">Toplam: {totalDuration} dakika</span>
        </div>
        <Select
          isMulti
          options={serviceOptions}
          value={form.selectedServices}
          onChange={(selected) => setForm({ ...form, selectedServices: selected || [] })}
          placeholder="Hizmet seçin..."
          className="react-select-container"
          classNamePrefix="react-select"
          isLoading={loading}
          closeMenuOnSelect={false}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Notlar</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

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
  );
}