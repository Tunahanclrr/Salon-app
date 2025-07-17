import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchEmployees } from '../redux/employeesSlice';

export default function EmployeeAppointments() {
  const dispatch = useDispatch();
  const { id } = useParams();
  const employees = useSelector(state => state.employees.items);
  const status = useSelector(state => state.employees.status);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEmployees());
    }
  }, [dispatch, status]);

  const employee = employees.find(emp => emp._id === id);

  if (status === 'loading') return <div>Yükleniyor...</div>;
  if (!employee) return <div>Çalışan bulunamadı veya randevu yok</div>;



  if (!employee) return <div className="text-center mt-20 text-red-500 font-semibold">Çalışan bulunamadı</div>;

  const appointments = Array.isArray(employee.appointments) ? employee.appointments : [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 border-b pb-2">
        {employee.name} - Randevuları
      </h1>

      {appointments.length === 0 ? (
        <p className="text-center text-gray-500">Randevu bulunamadı</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {appointments.map(app => (
            <div
              key={app._id}
              className="bg-white shadow-md rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-indigo-600">Müşteri: {app.customer?.name}</h2>
                <span className="text-sm text-gray-400">{new Date(app.date).toLocaleDateString()}</span>
              </div>

              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Telefon:</span> {app.customer?.phone || '-'}
              </p>

              <p className="text-gray-700 mb-1">
                <span className="font-semibold">E-posta:</span> {app.customer?.email || '-'}
              </p>

              <p className="text-gray-700 mb-1">
                <span className="font-semibold">Randevu Saati:</span>{' '}
                {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
