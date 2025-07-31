import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser, selectUserPermissions } from '../redux/authSlice';
import { fetchAppointments } from '../redux/appointmentsSlice';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Users,
  Scissors,
  Star
} from 'lucide-react';

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const permissions = useSelector(selectUserPermissions);
  const { items: appointments, status } = useSelector((state) => state.appointments);
  
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    weeklyTotal: 0,
    monthlyTotal: 0
  });

  useEffect(() => {
    if (permissions.canViewAppointments) {
      dispatch(fetchAppointments());
    }
  }, [dispatch, permissions.canViewAppointments]);

  useEffect(() => {
    if (appointments && appointments.length > 0) {
      const today = new Date().toDateString();
      const todayAppts = appointments.filter(apt => 
        new Date(apt.date).toDateString() === today &&
        (currentUser.role === 'admin' || apt.employee === currentUser._id)
      );
      
      setTodayAppointments(todayAppts);
      
      // İstatistikleri hesapla
      const completed = todayAppts.filter(apt => apt.status === 'completed').length;
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const monthStart = new Date();
      monthStart.setDate(1);
      
      const weeklyAppts = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= weekStart && 
               (currentUser.role === 'admin' || apt.employee === currentUser._id);
      });
      
      const monthlyAppts = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= monthStart && 
               (currentUser.role === 'admin' || apt.employee === currentUser._id);
      });
      
      setStats({
        todayTotal: todayAppts.length,
        todayCompleted: completed,
        weeklyTotal: weeklyAppts.length,
        monthlyTotal: monthlyAppts.length
      });
    }
  }, [appointments, currentUser]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'confirmed': return 'Onaylandı';
      case 'pending': return 'Bekliyor';
      case 'cancelled': return 'İptal';
      default: return status;
    }
  };

  return (
    <div className="p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Hoş geldin, {currentUser?.username}! 👋
        </h1>
        <p className="text-gray-600">
          {currentUser?.role === 'admin' ? 'Admin Dashboard' : 'Personel Dashboard'} - 
          Bugünün özeti ve görevlerin
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bugünkü Randevular</p>
              <p className="text-3xl font-bold text-gray-900">{stats.todayTotal}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
              <p className="text-3xl font-bold text-green-600">{stats.todayCompleted}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bu Hafta</p>
              <p className="text-3xl font-bold text-purple-600">{stats.weeklyTotal}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bu Ay</p>
              <p className="text-3xl font-bold text-orange-600">{stats.monthlyTotal}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Star className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      {permissions.canViewAppointments && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-blue-600" />
              Bugünkü Randevularım ({todayAppointments.length})
            </h2>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Bugün randevun yok</h3>
              <p className="text-gray-500">Dinlenme günün! 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {todayAppointments.map((appointment) => (
                <div key={appointment._id} className="p-6 hover:bg-gray-50 transition duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.customer?.name || 'Müşteri Bilgisi Yok'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.service?.name || 'Hizmet Bilgisi Yok'}
                        </p>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {new Date(appointment.date).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                      {appointment.service?.price && (
                        <p className="text-sm text-gray-600 mt-1">
                          ₺{appointment.service.price}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Not:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Permissions Info */}
      {currentUser?.role !== 'admin' && (
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Yetkilerin
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries({
              canViewAppointments: 'Randevuları Görüntüle',
              canEditAppointments: 'Randevuları Düzenle',
              canViewCustomers: 'Müşterileri Görüntüle',
              canEditCustomers: 'Müşterileri Düzenle',
              canViewServices: 'Hizmetleri Görüntüle',
              canEditServices: 'Hizmetleri Düzenle'
            }).map(([permission, label]) => (
              <div key={permission} className="flex items-center">
                {permissions[permission] ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                )}
                <span className={`text-sm ${permissions[permission] ? 'text-green-700' : 'text-red-700'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;