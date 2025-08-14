import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiUser, FiClock, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { fetchAppointments, updateCustomerNotArrived } from '../redux/appointmentsSlice';
import { fetchPackages } from '../redux/packagesSlice';
import { selectCurrentUser, selectIsAdmin } from '../redux/authSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function MyAppointments() {
  console.log('📋 MyAppointments component loaded!');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appointments = useSelector(state => state.appointments.items);
  const packages = useSelector(state => state.packages.items);
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);
  const [filter, setFilter] = useState('all'); // all, completed, not-arrived

  useEffect(() => {
    console.log('🔄 MyAppointments useEffect - Fetching data...');
    console.log('🎫 Token in localStorage:', localStorage.getItem('token') ? 'EXISTS' : 'NOT FOUND');
    console.log('👤 User in localStorage:', localStorage.getItem('user') ? 'EXISTS' : 'NOT FOUND');
    console.log('🔑 Current user:', currentUser);
    
    dispatch(fetchAppointments()).then(result => {
      console.log('📅 MyAppointments - Appointments fetch result:', result);
      if (result.type.includes('fulfilled')) {
        console.log('✅ MyAppointments - Appointments loaded successfully:', result.payload?.data?.appointments?.length || 0);
        console.log('📋 MyAppointments - Raw appointments data:', result.payload?.data?.appointments);
      } else {
        console.log('❌ MyAppointments - Appointments fetch failed:', result.payload);
      }
    });
    
    dispatch(fetchPackages());
  }, [dispatch]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <FiXCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Giriş Gerekli</h2>
          <p className="text-gray-600 mb-6">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  // Kullanıcının randevularını filtrele
  const userAppointments = appointments.filter(app => {
    if (isAdmin) {
      // Admin tüm randevuları görebilir
      return true;
    } else {
      // Normal kullanıcı sadece kendi randevularını görebilir
      if (!app.employee) return false;
      
      // Employee ID'sini doğru şekilde al
      const employeeId = typeof app.employee === 'object' && app.employee !== null 
        ? app.employee._id 
        : app.employee;
      
      // Hem string hem obje formatını kontrol et
      return employeeId === currentUser._id || app.employee === currentUser._id || 
             (app.employee && app.employee._id === currentUser._id);
    }
  });

  const handleCustomerNotArrived = async (appointmentId, customerNotArrived) => {
    try {
      await dispatch(updateCustomerNotArrived({ appointmentId, customerNotArrived })).unwrap();
      toast.success(customerNotArrived ? 'Müşteri gelmedi olarak işaretlendi' : 'Müşteri geldi olarak işaretlendi');
      // Randevuları yeniden çek
      dispatch(fetchAppointments());
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };
  
  // Filtreleme
  const filteredAppointments = userAppointments.filter(app => {
    if (filter === 'completed') return !app.customerNotArrived;
    if (filter === 'not-arrived') return app.customerNotArrived;
    return true;
  });

  // İstatistikler
  const totalAppointments = userAppointments.length;
  const completedAppointments = userAppointments.filter(app => !app.customerNotArrived).length;
  const notArrivedAppointments = userAppointments.filter(app => app.customerNotArrived).length;

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                  <FiUser className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mr-2 sm:mr-3" />
                  {isAdmin ? 'Tüm Randevular' : 'Randevularım'}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  {isAdmin ? 'Sistem genelindeki tüm randevular' : `${currentUser.name} - Randevularınız`}
                </p>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm">Toplam Randevu</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalAppointments}</p>
                </div>
                <FiCalendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 sm:p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm">Tamamlanan</p>
                  <p className="text-xl sm:text-2xl font-bold">{completedAppointments}</p>
                </div>
                <FiCheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 sm:p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-xs sm:text-sm">Gelmedi</p>
                  <p className="text-xl sm:text-2xl font-bold">{notArrivedAppointments}</p>
                </div>
                <FiXCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-200" />
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tüm Randevular ({totalAppointments})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Tamamlanan ({completedAppointments})
            </button>
            <button
              onClick={() => setFilter('not-arrived')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === 'not-arrived'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Gelmedi ({notArrivedAppointments})
            </button>
          </div>
        </div>

        {/* Randevular Listesi */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Randevular</h2>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12 text-center mb-6 sm:mb-8">
              <FiCalendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Randevu Bulunamadı</h3>
              <p className="text-sm sm:text-base text-gray-600">
                {filter === 'all' 
                  ? (isAdmin ? 'Sistemde henüz randevu bulunmuyor.' : 'Henüz randevunuz bulunmuyor.')
                  : filter === 'completed'
                  ? 'Tamamlanan randevu bulunmuyor.'
                  : 'Gelmedi olarak işaretlenen randevu bulunmuyor.'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div key={appointment._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-2 sm:mb-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-0">
                          {appointment.customer?.name || 'Müşteri Bilgisi Yok'}
                        </h3>
                        {appointment.customerNotArrived && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                            <FiXCircle className="h-3 w-3 mr-1" />
                            Müşteri Gelmedi
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-2">
                        <div className="flex items-center">
                          <FiCalendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center">
                          <FiClock className="h-4 w-4 mr-2 text-gray-400" />
                          {appointment.time}
                        </div>
                        {isAdmin && appointment.employee && (
                          <div className="flex items-center">
                            <FiUser className="h-4 w-4 mr-2 text-gray-400" />
                            {appointment.employee.name || 'Personel Bilgisi Yok'}
                          </div>
                        )}
                      </div>

                      {appointment.services && appointment.services.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs sm:text-sm text-gray-600">
                            <strong>Hizmetler:</strong> {appointment.services.map(s => s.name).join(', ')}
                          </p>
                        </div>
                      )}

                      {appointment.notes && (
                        <div className="mt-2">
                          <p className="text-xs sm:text-sm text-gray-600">
                            <strong>Notlar:</strong> {appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                      <button
                        onClick={() => handleCustomerNotArrived(appointment._id, !appointment.customerNotArrived)}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          appointment.customerNotArrived
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {appointment.customerNotArrived ? 'Müşteri Geldi' : 'Müşteri Gelmedi'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}