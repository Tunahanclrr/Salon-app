// src/pages/Services.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServices, addService, deleteService } from '../redux/servicesSlice'; // addService ve deleteService import edildi
import Modal from '../components/Modal'; // Modal bileşeni import edildi
import ServiceForm from '../components/ServiceForm'; // ServiceForm bileşeni import edildi
import { FiPlus } from 'react-icons/fi'; // Ekle butonu için ikon
import { toast } from 'react-toastify'; // Bildirimler için

export default function Services() {
  const dispatch = useDispatch();
  const services = useSelector((state) => state.services.items);
  const loading = useSelector((state) => state.services.loading);
  const error = useSelector((state) => state.services.error);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingService, setDeletingService] = useState(null);

  useEffect(() => {
    console.log('Fetching services...');
    dispatch(fetchServices())
      .unwrap()
      .then(() => {
        console.log('Services fetched successfully');
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
      });
  }, [dispatch]);

  const handleAddService = async (serviceData) => {
    try {
      console.log('Submitting service:', serviceData);
      const resultAction = await dispatch(addService(serviceData));
      if (addService.fulfilled.match(resultAction)) {
        toast.success('Hizmet başarıyla eklendi!');
        setIsAddModalOpen(false);
        await dispatch(fetchServices());
      } else {
        throw new Error(resultAction.payload || 'Hizmet eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error(error.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsEditModalOpen(true);
  };

  const handleEditService = async (id, data) => {
    const resultAction = await dispatch(editService({ id, data }));
    if (editService.fulfilled.match(resultAction)) {
      toast.success('Hizmet başarıyla düzenlendi!');
      setIsEditModalOpen(false);
      dispatch(fetchServices());
    } else {
      toast.error(resultAction.payload || 'Hizmet düzenlenirken bir hata oluştu.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const resultAction = await dispatch(deleteService(id));
      if (deleteService.fulfilled.match(resultAction)) {
        toast.success('Hizmet başarıyla silindi!');
        dispatch(fetchServices());
      } else {
        throw new Error(resultAction.payload || 'Hizmet silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <h2 className="text-xl sm:text-3xl font-bold text-gray-800 whitespace-nowrap">Hizmetler</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base w-full sm:w-auto"
        >
          <FiPlus className="text-base sm:text-lg" />
          <span className="whitespace-nowrap">Yeni Hizmet Ekle</span>
        </button>
      </div>

      {loading && <p className="text-center text-gray-600">Hizmetler yükleniyor...</p>}
      {error && <p className="text-center text-red-500">Hata: {error}</p>}

      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {services.length > 0 ? (
            services.map((service) => (
              <li key={service._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-base sm:text-lg font-medium text-gray-900 truncate flex-1">
                    {service.name}
                  </p>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                    {service.duration} dakika
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        setDeletingService(service);
                        setConfirmDelete(true);
                      }}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            !loading && !error && (
              <p className="px-4 py-4 text-gray-500 text-center">Henüz hiç hizmet eklenmemiş.</p>
            )
          )}
        </ul>
      </div>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yeni Hizmet Ekle"
      >
        <ServiceForm
          onSubmit={handleAddService}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Hizmeti Düzenle"
      >
        <ServiceForm
          onSubmit={(data) => handleEditService(editingService._id, data)}
          onCancel={() => setIsEditModalOpen(false)}
          initialData={editingService}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeletingService(null);
        }}
        title="Hizmet Silme Onayı"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            {deletingService ? 
              `"${deletingService.name}" hizmetini silmek istediğinize emin misiniz?` :
              'Bu hizmeti silmek istediğinize emin misiniz?'
            }
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setConfirmDelete(false);
                setDeletingService(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              İptal
            </button>
            <button
              onClick={() => handleDelete(deletingService._id)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sil
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}