import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FiUser, FiPhone, FiMail, FiClock, FiCalendar, FiCheckCircle, FiXCircle, FiArrowLeft, FiPackage, FiGrid, FiList } from 'react-icons/fi';
import { fetchUsers } from '../redux/usersSlice';
import { fetchAppointments, updateCustomerNotArrived } from '../redux/appointmentsSlice';
import { fetchPackageSales } from '../redux/packageSalesSlice';
import { fetchPackages } from '../redux/packagesSlice';
import { selectCurrentUser, selectIsAdmin } from '../redux/authSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function EmployeeAppointments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const users = useSelector(state => state.users.items);
  const usersStatus = useSelector(state => state.users.status);
  const appointments = useSelector(state => state.appointments.items);
  const packageSales = useSelector(state => state.packageSales.items);
  const packages = useSelector(state => state.packages.items);
  const currentUser = useSelector(selectCurrentUser);
  const isAdmin = useSelector(selectIsAdmin);
  const [filter, setFilter] = useState('all'); // all, completed, not-arrived
  const [packageFilter, setPackageFilter] = useState('all'); // all, active, completed
  const [viewMode, setViewMode] = useState('list'); // list, calendar
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (usersStatus === 'idle') {
      dispatch(fetchUsers());
    }
    dispatch(fetchAppointments());
    dispatch(fetchPackageSales());
    dispatch(fetchPackages());
  }, [dispatch, usersStatus]);

  // Kullanıcı yetkisi kontrolü - sadece admin veya kendi randevularını görebilir
  const canViewEmployee = isAdmin || (currentUser && currentUser._id === id);
  
  if (!canViewEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <FiXCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Yetkisiz Erişim</h2>
          <p className="text-gray-600 mb-6">Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  const employee = users.find(user => user._id === id);
  
  // Bu çalışanın randevularını filtrele
  const employeeAppointments = appointments.filter(app => {
    if (!app.employee) return false;
    
    // Employee ID'sini doğru şekilde al
    const employeeId = typeof app.employee === 'object' && app.employee !== null 
      ? app.employee._id 
      : app.employee;
    
    // Hem string hem obje formatını kontrol et
    return employeeId === id || app.employee === id || 
           (app.employee && app.employee._id === id);
  });

  const getPackageName = (packageId) => {
    // Eğer packageId bir obje ise (populate edilmiş)
    if (typeof packageId === 'object' && packageId !== null) {
      return packageId.name || 'Bilinmeyen Paket';
    }
    // Eğer packageId bir string ise (id referansı)
    const packageItem = packages.find(p => p._id === packageId);
    return packageItem ? packageItem.name : 'Bilinmeyen Paket';
  };

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

  if (usersStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <FiXCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Çalışan Bulunamadı</h2>
          <p className="text-gray-600 mb-6">Aradığınız çalışan bulunamadı veya randevu yok</p>
          <button
            onClick={() => navigate('/personeller')}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Çalışanlara Dön
          </button>
        </div>
      </div>
    );
  }

  // Personelin sattığı paketleri filtrele
  const employeePackageSales = packageSales.filter(pkg => 
    pkg.seller === id || (pkg.seller && pkg.seller._id === id)
  );

  // Paket satışlarını filtreleme
  const filteredPackageSales = employeePackageSales.filter(pkg => {
    if (packageFilter === 'active') return pkg.status === 'active';
    if (packageFilter === 'completed') return pkg.status === 'completed';
    return true;
  });
  
  // Filtreleme
  const filteredAppointments = employeeAppointments.filter(app => {
    if (filter === 'completed') return !app.customerNotArrived;
    if (filter === 'not-arrived') return app.customerNotArrived;
    return true;
  });

  // İstatistikler
  const totalAppointments = employeeAppointments.length;
  const completedAppointments = employeeAppointments.filter(app => !app.customerNotArrived).length;
  const notArrivedAppointments = employeeAppointments.filter(app => app.customerNotArrived).length;

  // Paket satış istatistikleri
  const totalPackageSales = employeePackageSales.length;
  const activePackageSales = employeePackageSales.filter(pkg => pkg.status === 'active').length;
  const completedPackageSales = employeePackageSales.filter(pkg => pkg.status === 'completed').length;

  // Tarih formatı
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Para formatı
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
      .format(amount)
      .replace('₺', '') + ' ₺';
  };

  // Takvim için sabitler
  const PX_PER_15_MINUTES = 60;
  const CALENDAR_START_HOUR = 9;
  const CALENDAR_START_HOUR_IN_MINUTES = CALENDAR_START_HOUR * 60;

  // Zaman slotları
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = CALENDAR_START_HOUR; h < 23; h++) {
      for (let m = 0; m < 60; m += 15) {
        if (h === 22 && m > 30) continue;
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  // Seçili tarih için randevuları filtrele
  const calendarAppointments = employeeAppointments.filter(app => app.date === selectedDate);

  // Takvim görünümü için randevu bileşeni
  const CalendarAppointment = ({ appointment }) => {
    const customerName = appointment.customer?.name || 'Müşteri';
    const serviceNames = appointment.services?.map(s => s.name).join(', ') || 'Hizmet';

    const [startHour, startMinute] = appointment.time.split(':').map((val) => parseInt(val, 10));
    const startTimeInMinutes = startHour * 60 + startMinute;
    const durationInMinutes = appointment.duration || 30;

    const top = Math.round(
      (startTimeInMinutes - CALENDAR_START_HOUR_IN_MINUTES) * (PX_PER_15_MINUTES / 15)
    );
    const height = Math.round(durationInMinutes * (PX_PER_15_MINUTES / 15));

    return (
      <div
        className={`absolute rounded-md font-medium shadow-sm cursor-pointer transition-all leading-tight ${
          appointment.customerNotArrived 
            ? 'bg-red-200 border-red-400 text-red-800 opacity-75' 
            : 'bg-blue-200 border-blue-400 text-blue-800'
        }`}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          width: 'calc(100% - 8px)',
          left: '4px',
          fontSize: '12px',
          padding: '4px 8px',
          lineHeight: '1.3',
          overflow: 'hidden',
          wordWrap: 'break-word',
          boxSizing: 'border-box',
          border: '1px solid',
          zIndex: 20,
        }}
      >
        {appointment.customerNotArrived && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-bold"
               style={{ width: '12px', height: '12px', fontSize: '6px' }}>
            ✕
          </div>
        )}
        
        <div className="font-semibold" style={{ fontSize: '14px', marginBottom: '2px' }}>
          {customerName}
        </div>
        
        {appointment.customerNotArrived && (
          <div className="text-red-700 font-bold leading-tight" style={{ fontSize: '10px' }}>
            MÜŞTERİ GELMEDİ
          </div>
        )}
        
        <div className="text-gray-700 leading-tight" style={{ fontSize: '11px', marginBottom: '2px' }}>
          {serviceNames}
        </div>
        
        <div className="text-gray-600" style={{ fontSize: '10px' }}>
          {appointment.time} ({durationInMinutes} dk)
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <button
                onClick={() => navigate('/personeller')}
                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <FiArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                  <FiUser className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600 mr-2 sm:mr-3" />
                  {employee.name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">{employee.role} - Randevuları</p>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
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

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-3 sm:p-4 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs sm:text-sm">Toplam Paket Satışı</p>
                  <p className="text-xl sm:text-2xl font-bold">{totalPackageSales}</p>
                </div>
                <FiPackage className="h-6 w-6 sm:h-8 sm:w-8 text-purple-200" />
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-6 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü ({totalAppointments})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tamamlanan ({completedAppointments})
              </button>
              <button
                onClick={() => setFilter('not-arrived')}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                  filter === 'not-arrived'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Gelmedi ({notArrivedAppointments})
              </button>
            </div>

            {/* Görünüm Değiştirme Butonları */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiList className="h-4 w-4" />
                Liste
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors flex items-center gap-2 ${
                  viewMode === 'calendar'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiGrid className="h-4 w-4" />
                Takvim
              </button>
            </div>
          </div>

          {/* Takvim görünümü için tarih seçici */}
          {viewMode === 'calendar' && (
            <div className="flex items-center gap-2 mt-4 bg-gray-50 p-3 rounded-lg">
              <FiCalendar className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Tarih:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Randevular */}
        {viewMode === 'list' ? (
          // Liste Görünümü
          filteredAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12 text-center mb-6 sm:mb-8">
              <FiCalendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Randevu Bulunamadı</h3>
              <p className="text-sm sm:text-base text-gray-600">
                {filter === 'all' 
                  ? 'Bu çalışan için henüz randevu bulunmuyor.'
                  : filter === 'completed'
                  ? 'Tamamlanan randevu bulunmuyor.'
                  : 'Gelmedi olarak işaretlenen randevu bulunmuyor.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {filteredAppointments.map(app => (
                <div
                  key={app._id}
                  className={`bg-white rounded-xl shadow-lg border-l-4 hover:shadow-xl transition-all duration-300 ${
                    app.customerNotArrived 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-green-500 hover:border-indigo-500'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${app.customerNotArrived ? 'bg-red-100' : 'bg-green-100'}`}>
                          <FiUser className={`h-4 w-4 sm:h-5 sm:w-5 ${app.customerNotArrived ? 'text-red-600' : 'text-green-600'}`} />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800">{app.customer?.name}</h3>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            app.customerNotArrived 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {app.customerNotArrived ? (
                              <>
                                <FiXCircle className="h-3 w-3 mr-1" />
                                Gelmedi
                              </>
                            ) : (
                              <>
                                <FiCheckCircle className="h-3 w-3 mr-1" />
                                Tamamlandı
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Müşteri Bilgileri */}
                    <div className="space-y-2 sm:space-y-3 mb-4">
                      <div className="flex items-center text-gray-600">
                        <FiPhone className="h-4 w-4 mr-2 sm:mr-3 text-gray-400" />
                        <span className="text-xs sm:text-sm">{app.customer?.phone || 'Telefon bilgisi yok'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiMail className="h-4 w-4 mr-2 sm:mr-3 text-gray-400" />
                        <span className="text-xs sm:text-sm">{app.customer?.email || 'E-posta bilgisi yok'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiCalendar className="h-4 w-4 mr-2 sm:mr-3 text-gray-400" />
                        <span className="text-xs sm:text-sm">{new Date(app.date).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <FiClock className="h-4 w-4 mr-2 sm:mr-3 text-gray-400" />
                        <span className="text-xs sm:text-sm">{app.time}</span>
                      </div>
                    </div>

                    {/* Hizmetler */}
                    {app.services && app.services.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Hizmetler:</h4>
                        <div className="space-y-2">
                          {app.services.map((service, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                              <span className="text-xs sm:text-sm text-gray-700">{service.name}</span>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{service.duration} dk</span>
                                <span className="text-green-600 font-medium">{service.price} ₺</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">Toplam:</span>
                            <span className="text-base sm:text-lg font-bold text-green-600">
                              {app.services.reduce((sum, service) => sum + (service.price || 0), 0)} ₺
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notlar */}
                    {app.notes && (
                      <div className="mb-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Notlar:</h4>
                        <p className="text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">{app.notes}</p>
                      </div>
                    )}

                    {/* Durum Değiştirme Butonu */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCustomerNotArrived(app._id, !app.customerNotArrived)}
                        className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                          app.customerNotArrived
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {app.customerNotArrived ? 'Müşteri Geldi' : 'Müşteri Gelmedi'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Takvim Görünümü
          <div className="bg-white rounded-xl shadow-lg mb-6 sm:mb-8 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <FiCalendar className="text-indigo-600" />
                {employee.name} - {new Date(selectedDate).toLocaleDateString('tr-TR')} Randevuları
              </h3>
            </div>
            
            {calendarAppointments.length === 0 ? (
              <div className="p-12 text-center">
                <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Bu Tarihte Randevu Yok</h3>
                <p className="text-gray-600">
                  {new Date(selectedDate).toLocaleDateString('tr-TR')} tarihinde {employee.name} için randevu bulunmuyor.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Takvim Grid */}
                <div className="grid grid-cols-2 border-b border-gray-200">
                  <div className="py-3 px-4 border-r border-gray-200 font-semibold text-sm text-gray-700 bg-gray-50">
                    Saat
                  </div>
                  <div className="py-3 px-4 text-sm text-center font-semibold text-gray-800 bg-blue-50">
                    {employee.name}
                  </div>
                </div>

                <div className="grid grid-cols-2 relative">
                  {/* Zaman Sütunu */}
                  <div className="border-r border-gray-200">
                    {timeSlots.map((slot) => (
                      <div 
                        key={slot} 
                        className="text-xs text-gray-500 border-t border-gray-100 flex items-center justify-center bg-white"
                        style={{ height: '60px' }}
                      >
                        {(slot.endsWith(':00') || slot.endsWith(':30')) ? (
                          <span className="text-right w-full pr-2">{slot}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Randevu Sütunu */}
                  <div className="relative bg-white">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="border-t border-gray-100"
                        style={{ height: '60px' }}
                      />
                    ))}
                    
                    {/* Randevular */}
                    {calendarAppointments.map(app => (
                      <CalendarAppointment key={app._id} appointment={app} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paket Satışları Başlık */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-indigo-700">
              <FiPackage className="text-indigo-500" />
              Paket Satışları
            </div>
          </div>

          {/* Paket Satışları Filtreleri */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPackageFilter('all')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                packageFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü ({totalPackageSales})
            </button>
            <button
              onClick={() => setPackageFilter('active')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                packageFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Aktif ({activePackageSales})
            </button>
            <button
              onClick={() => setPackageFilter('completed')}
              className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                packageFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tamamlanan ({completedPackageSales})
            </button>
          </div>
        </div>

        {/* Paket Satışları Listesi */}
        {filteredPackageSales.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-12 text-center">
            <FiPackage className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Paket Satışı Bulunamadı</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {packageFilter === 'all' 
                ? 'Bu çalışan için henüz paket satışı bulunmuyor.'
                : packageFilter === 'active'
                ? 'Aktif paket satışı bulunmuyor.'
                : 'Tamamlanan paket satışı bulunmuyor.'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satış Tarihi</th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paket Tipi</th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Toplam Tutar</th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödenen</th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kalan</th>
                    <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPackageSales.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-0 sm:ml-4">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {pkg.customer?.name || 'Bilinmeyen Müşteri'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{formatDate(pkg.createdAt)}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{getPackageName(pkg.packageType)}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(pkg.totalAmount)}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{formatCurrency(pkg.paidAmount)}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm text-gray-900">{formatCurrency(pkg.remainingAmount)}</div>
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${pkg.status === 'active' ? 'bg-green-100 text-green-800' : pkg.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pkg.status === 'active' ? 'Aktif' : pkg.status === 'completed' ? 'Tamamlandı' : pkg.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
