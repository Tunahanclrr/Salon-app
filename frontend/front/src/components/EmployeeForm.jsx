import React, { useState } from 'react';

const ROLES = [
  { value: '', label: 'Rol Seçiniz' },
  { value: 'manikür', label: 'Manikür' },
  { value: 'cilt bakım uzmanı', label: 'Cilt Bakım Uzmanı' },
  { value: 'epilasyon uzmanı', label: 'Epilasyon Uzmanı' }
];

const GENDERS = [
  { value: '', label: 'Cinsiyet Seçiniz' },
  { value: 'Erkek', label: 'Erkek' },
  { value: 'Kadın', label: 'Kadın' }
];

export default function EmployeeForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    role: '',
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
        name="email"
        placeholder="E-posta"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        type="email"
      />
      <input
        name="phone"
        placeholder="Telefon"
        value={form.phone}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      />
      <select
        name="gender"
        value={form.gender}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      >
        {GENDERS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <select
        name="role"
        value={form.role}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        required
      >
        {ROLES.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">İptal</button>
        <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" disabled={loading}>
          {loading ? "Ekleniyor..." : "Kaydet"}
        </button>
      </div>
    </form>
  );
}