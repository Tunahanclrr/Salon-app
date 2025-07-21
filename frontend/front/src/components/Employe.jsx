import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, deleteEmployee, addEmployee } from '../redux/employeesSlice';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import EmployeeForm from './EmployeeForm';
import { Link } from 'react-router-dom'; 

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
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-blue-900">Çalışanlar</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
          onClick={() => setAddModalOpen(true)}
        >
          Çalışan Ekle
        </button>
      </div>
      
      {/* Responsive table container with horizontal scroll */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="bg-blue-100 text-blue-900">
              <th className="py-3 px-4 text-left whitespace-nowrap">Ad Soyad</th>
              <th className="py-3 px-4 text-left whitespace-nowrap">Rol</th>
              <th className="py-3 px-4 text-left whitespace-nowrap">E-posta</th>
              <th className="py-3 px-4 text-left whitespace-nowrap">Telefon</th>
              <th className="py-3 px-4 text-left whitespace-nowrap">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id} className="border-b hover:bg-blue-50 transition">
                <td className="py-3 px-4 text-sm whitespace-nowrap">{emp.name}</td>
                <td className="py-3 px-4 text-sm whitespace-nowrap">{emp.role}</td>
                <td className="py-3 px-4 text-sm whitespace-nowrap">{emp.email}</td>
                <td className="py-3 px-4 text-sm whitespace-nowrap">{emp.phone}</td>
                <td className="py-3 px-4 text-sm whitespace-nowrap">
                  <div className="flex gap-2">

<Link to={`/personeller/${emp._id}/randevular`}>
  <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm">
    Randevuları Gör
  </button>
</Link>

                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                      onClick={() => handleDeleteClick(emp._id)}
                    >
                      Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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