// src/components/ServiceForm.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function ServiceForm({ onSubmit = () => {}, onCancel, initialData = {} }) {
  const [name, setName] = useState(initialData.name || '');
  const [duration, setDuration] = useState(initialData.duration || '');
  const [price, setPrice] = useState(initialData.price || '');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Hizmet adı boş bırakılamaz.';
    }
    // Süre kontrolü: boş olmamalı, sayı olmalı ve 0'dan büyük olmalı
    if (!duration || isNaN(duration) || Number(duration) <= 0) {
      newErrors.duration = 'Geçerli bir süre (dakika) girilmelidir.';
    }
    // Fiyat kontrolü: boş olmamalı, sayı olmalı ve 0 veya daha büyük olmalı
    if (!price || isNaN(price) || Number(price) < 0) {
      newErrors.price = 'Geçerli bir fiyat girilmelidir.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Form submitted with data:', { name, duration: Number(duration), price: Number(price) });
      // onSubmit prop'u Services.jsx'ten gelen handleAddService fonksiyonudur
      onSubmit({ name, duration: Number(duration), price: Number(price) });
    } else {
      toast.error('Lütfen tüm alanları doğru doldurunuz.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Hizmet Adı
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Örn: Saç Kesimi"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
          Süre (Dakika)
        </label>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Örn: 30"
        />
        {errors.duration && <p className="mt-1 text-xs text-red-600">{errors.duration}</p>}
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
          Fiyat (₺)
        </label>
        <input
          type="number"
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Örn: 150"
          min="0"
          step="0.01"
        />
        {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {initialData.name ? 'Hizmeti Güncelle' : 'Hizmeti Ekle'}
        </button>
      </div>
    </form>
  );
}