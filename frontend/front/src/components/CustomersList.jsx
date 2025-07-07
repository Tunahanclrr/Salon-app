import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, deleteCustomer, addCustomer } from '../redux/customersSlice';
import Modal from './Modal';
import CustomerForm from './CustomerForm';

export default function CustomersList() {
  const dispatch = useDispatch();
  const { items: customers, status } = useSelector((state) => state.customers);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filtered = (customers || []).filter(
    c =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  );
  

  // Müşteri ekleme işlemi
  const handleAddCustomer = async (form) => {
    try {
      await dispatch(addCustomer(form));
      setAddModalOpen(false);
      dispatch(fetchCustomers()); // ekleyebilirsin, listeyi güncellemek için
    } catch (error) {
      console.error("Müşteri eklenemedi:", error);
    }
  };
  
  // Müşteri silme işlemi
  const handleDeleteCustomer = (id) => {
    setCustomerToDelete(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      dispatch(deleteCustomer(customerToDelete));
    }
    setConfirmModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmModalOpen(false);
    setCustomerToDelete(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      <div className="flex flex-col items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-blue-900 text-center">Müşteriler</h2>
        <div className="flex w-full max-w-md gap-2">
          <input
            type="text"
            placeholder="İsim, telefon veya e-posta ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-4 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200 transition"
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded shadow"
            onClick={() => setAddModalOpen(true)}
          >
             Müşteri Ekle
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        {status === 'loading' ? (
          <div className="text-center py-8 text-blue-600">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-lg">Müşteri bulunamadı.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th className="py-3 px-4 text-left">Ad Soyad</th>
                <th className="py-3 px-4 text-left">Telefon</th>
                <th className="py-3 px-4 text-left">E-posta</th>
                <th className="py-3 px-4 text-left">Not</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer._id} className="border-b hover:bg-blue-50 transition">
                  <td className="py-2 px-4">{customer.name}</td>
                  <td className="py-2 px-4">{customer.phone}</td>
                  <td className="py-2 px-4">{customer.email}</td>
                  <td className="py-2 px-4">{customer.notes || '-'}</td>
                  <td className="py-2 px-4 text-center">
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm shadow"
                      onClick={() => handleDeleteCustomer(customer._id)}
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Müşteri ekleme modalı */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Müşteri Ekle">
        <CustomerForm
          onSubmit={handleAddCustomer}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>
      {/* Müşteri silme onay modalı */}
      <Modal
        open={confirmModalOpen}
        onClose={handleCancelDelete}
        title="Müşteriyi Sil"
      >
        <div className="mb-4">Silmek istediğinizden emin misiniz?</div>
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={handleCancelDelete}
          >
            İptal
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleConfirmDelete}
          >
            Evet, Sil
          </button>
        </div>
      </Modal>
    </div>
  );
}