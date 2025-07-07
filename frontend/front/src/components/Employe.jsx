import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, deleteEmployee, addEmployee } from '../redux/employeesSlice';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import EmployeeForm from './EmployeeForm';

export default function Employe() {
  const dispatch = useDispatch();
  const { items: employees, status } = useSelector((state) => state.employees);

  // Silme modalı için
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Ekleme modalı için
  const [addModalOpen, setAddModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Silme işlemleri
  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    dispatch(deleteEmployee(selectedId));
    setDeleteModalOpen(false);
    setSelectedId(null);
  };

  // Ekleme işlemleri
  const handleAddEmployee = async (formData) => {
    await dispatch(addEmployee(formData));
    setAddModalOpen(false);
  };

  if (status === 'loading') return <div>Yükleniyor...</div>;

  return (
    <div className="overflow-x-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Çalışanlar</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => setAddModalOpen(true)}
        >
          Çalışan Ekle
        </button>
      </div>
      <table className="min-w-full bg-white rounded-lg shadow">
        <thead>
          <tr className="bg-blue-100 text-blue-900">
            <th className="py-2 px-4 text-left">Ad Soyad</th>
            <th className="py-2 px-4 text-left">Rol</th>
            <th className="py-2 px-4 text-left">E-posta</th>
            <th className="py-2 px-4 text-left">Telefon</th>
            <th className="py-2 px-4 text-left">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp._id} className="border-b overflow-auto hover:bg-blue-50 transition">
              <td className="py-2 text-sm  px-4">{emp.name}</td>
              <td className="py-2 text-sm  px-4">{emp.role}</td>
              <td className="py-2 text-sm  px-4">{emp.email}</td>
              <td className="py-2 text-sm  px-4">{emp.phone}</td>
              <td className="py-2 text-sm  px-4 flex gap-2">
                <button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm"
                  // ... randevuları gör butonu ...
                >
                  Randevuları Gör
                </button>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  onClick={() => handleDeleteClick(emp._id)}
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Silme için modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        message="Personeli silmek istediğinizden emin misiniz?"
      />
      {/* Ekleme için modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Çalışan Ekle">
        <EmployeeForm
          onSubmit={handleAddEmployee}
          onCancel={() => setAddModalOpen(false)}
          loading={status === 'loading'}
        />
      </Modal>
    </div>
  );
}