import React, { useEffect, useState } from 'react'

export default function AppointmentEditForm({
  initialData,
  employees,
  customers,
  appointments,
  onSubmit,
  onCancel,
  onAddCustomer,
}) {
  const [form, setForm] = useState({
    customerId: '',
    employeeId: '',
    date: '',
    time: '',
    service: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        customerId: initialData.customer?._id || '',
        employeeId: initialData.employee?._id || '',
        date: initialData.date || '',
        time: initialData.time || '',
        service: initialData.services?.[0]?._id || '',
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basit doğrulama
    if (!form.customerId || !form.employeeId || !form.date || !form.time || !form.service) {
      alert("Tüm alanları doldurunuz.");
      return;
    }

    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Müşteri Seçimi */}
      <div>
        <label className="block font-medium mb-1">Müşteri</label>
        <div className="flex space-x-2">
          <select
            name="customerId"
            value={form.customerId}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          >
            <option value="">Seçiniz</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="text-sm text-blue-600 underline"
            onClick={onAddCustomer}
          >
            Yeni Ekle
          </button>
        </div>
      </div>

      {/* Çalışan Seçimi */}
      <div>
        <label className="block font-medium mb-1">Çalışan</label>
        <select
          name="employeeId"
          value={form.employeeId}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Seçiniz</option>
          {employees.map(e => (
            <option key={e._id} value={e._id}>{e.name}</option>
          ))}
        </select>
      </div>

      {/* Tarih ve Saat */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Tarih</label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Saat</label>
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Hizmet */}
      <div>
        <label className="block font-medium mb-1">Hizmet</label>
        <select
          name="service"
          value={form.service}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">Seçiniz</option>
          {initialData?.services?.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
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
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
        >
          Vazgeç
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Güncelle
        </button>
      </div>
    </form>
  );
}
