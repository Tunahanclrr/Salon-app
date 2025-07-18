import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FiUser, FiPhone, FiMail, FiClock, FiCalendar, FiCheckCircle, FiXCircle, FiArrowLeft, FiPackage } from 'react-icons/fi';
import { fetchEmployees } from '../redux/employeesSlice';
import { updateCustomerNotArrived } from '../redux/appointmentsSlice';
import { fetchPackageSales } from '../redux/packageSalesSlice';
import { fetchPackages } from '../redux/packagesSlice';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function EmployeeAppointments() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const employees = useSelector(state => state.employees.items);
  const status = useSelector(state => state.employees.status);
  const packageSales = useSelector(state => state.packageSales.items);
  const packages = useSelector(state => state.packages.items);
  const [filter, setFilter] = useState('all'); // all, completed, not-arrived
  const [packageFilter, setPackageFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEmployees());
    }
    dispatch(fetchPackageSales());
    dispatch(fetchPackages());
  }, [dispatch, status]);

  const employee = employees.find(emp => emp._id === id);

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
      // Çalışan verilerini yeniden çek
      dispatch(fetchEmployees());
    } catch (error) {
      toast.error('Durum güncellenirken hata oluştu');
    }
  };

  if (status === 'loading') {
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

  const appointments = Array.isArray(employee.appointments) ? employee.appointments : [];
  
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
  const filteredAppointments = appointments.filter(app => {
    if (filter === 'completed') return !app.customerNotArrived;
    if (filter === 'not-arrived') return app.customerNotArrived;
    return true;
  });

  // İstatistikler
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(app => !app.customerNotArrived).length;
  const notArrivedAppointments = appointments.filter(app => app.customerNotArrived).length;

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
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-6">
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
        </div>

        {/* Randevular */}
        {filteredAppointments.length === 0 ? (
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
