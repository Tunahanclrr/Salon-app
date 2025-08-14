import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { fetchPackages, addPackage, updatePackage, deletePackage } from '../redux/packagesSlice';
import { fetchServices } from '../redux/servicesSlice';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import Select from 'react-select';

export default function Packages() {
  const dispatch = useDispatch();
  const { items: packages } = useSelector(state => state.packages);
  const { items: services } = useSelector(state => state.services);
  
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    quantity: '',
    type: 'seans',
    service: '',
    price: ''
  });

  useEffect(() => {
    dispatch(fetchPackages());
    dispatch(fetchServices());
  }, [dispatch]);

  const serviceOptions = services.map(service => ({
    value: service._id,
    label: service.name
  }));

  const filteredPackages = packages.filter(pkg => {
    const searchTerm = search.toLowerCase();
    return (
      pkg.service?.name?.toLowerCase().includes(searchTerm) ||
      pkg.type.toLowerCase().includes(searchTerm) ||
      pkg.quantity.toString().includes(searchTerm) ||
      pkg.price.toString().includes(searchTerm)
    );
  });

  const handleAddPackage = async (e) => {
    e.preventDefault();
    
    try {
      const packageData = {
        quantity: parseInt(formData.quantity),
        type: formData.type,
        service: formData.service,
        price: parseFloat(formData.price)
      };

      await dispatch(addPackage(packageData)).unwrap();
      
      setFormData({
        quantity: '',
        type: 'seans',
        service: '',
        price: ''
      });
      
      setAddModalOpen(false);
      toast.success('Paket başarıyla oluşturuldu!');
    } catch (error) {
      toast.error(error || 'Paket oluşturulurken bir hata oluştu');
    }
  };

  const handleEditPackage = async (e) => {
    e.preventDefault();
    
    try {
      const packageData = {
        quantity: parseInt(formData.quantity),
        type: formData.type,
        service: formData.service,
        price: parseFloat(formData.price)
      };

      await dispatch(updatePackage({ id: selectedPackage._id, updates: packageData })).unwrap();
      
      setEditModalOpen(false);
      setSelectedPackage(null);
      setFormData({
        quantity: '',
        type: 'seans',
        service: '',
        price: ''
      });
      toast.success('Paket başarıyla güncellendi!');
    } catch (error) {
      toast.error(error || 'Paket güncellenirken bir hata oluştu');
    }
  };

  const handleDeletePackage = async (id) => {
    if (window.confirm('Bu paketi silmek istediğinizden emin misiniz?')) {
      try {
        await dispatch(deletePackage(id)).unwrap();
        toast.success('Paket başarıyla silindi!');
      } catch (error) {
        toast.error(error || 'Paket silinirken bir hata oluştu');
      }
    }
  };

  const openEditModal = (pkg) => {
    setSelectedPackage(pkg);
    setFormData({
      quantity: pkg.quantity.toString(),
      type: pkg.type,
      service: pkg.service._id,
      price: pkg.price.toString()
    });
    setEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      quantity: '',
      type: 'seans',
      service: '',
      price: ''
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paketler</h1>
        <button
          onClick={() => {
            resetForm();
            setAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <FiPlus className="w-4 h-4" />
          Yeni Paket
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Miktar
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hizmet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiyat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPackages.map((pkg) => (
              <tr key={pkg._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pkg.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pkg.type === 'seans' ? 'Seans' : 'Dakika'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pkg.service?.name || 'Hizmet'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pkg.price} TL
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(pkg)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Package Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Yeni paket">
        <form onSubmit={handleAddPackage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Miktar girin"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="seans">Seans</option>
                <option value="dakika">Dakika</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet</label>
            <Select
              value={serviceOptions.find(option => option.value === formData.service)}
              onChange={(option) => setFormData({ ...formData, service: option.value })}
              options={serviceOptions}
              placeholder="Hizmet seçin..."
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable={false}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat</label>
            <div className="relative">
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fiyat girin"
                required
                min="0"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-sm">TL</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Kaydet
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Package Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Paket Düzenle">
        <form onSubmit={handleEditPackage} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Miktar</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Miktar girin"
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tip</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="seans">Seans</option>
                <option value="dakika">Dakika</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet</label>
            <Select
              value={serviceOptions.find(option => option.value === formData.service)}
              onChange={(option) => setFormData({ ...formData, service: option.value })}
              options={serviceOptions}
              placeholder="Hizmet seçin..."
              className="react-select-container"
              classNamePrefix="react-select"
              isClearable={false}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat</label>
            <div className="relative">
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Fiyat girin"
                required
                min="0"
                step="0.01"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 text-sm">TL</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Güncelle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 