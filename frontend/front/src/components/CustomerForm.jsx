import React, { useState } from 'react';

export default function CustomerForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <input
        name="name"
        placeholder="Ad Soyad"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="phone"
        placeholder="Telefon"
        value={form.phone}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <input
        name="email"
        placeholder="E-posta"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        type="email"
      />
      <textarea
        name="notes"
        placeholder="Not (isteğe bağlı)"
        value={form.notes}
        onChange={handleChange}
        className="w-full border p-2 rounded min-h-[80px] resize-y"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">İptal</button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Kaydet</button>
      </div>
    </form>
  );
}