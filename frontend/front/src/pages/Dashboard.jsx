import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaUserFriends, FaUsers, FaCalendarDay, FaListOl } from 'react-icons/fa';
import { fetchUsers } from '../redux/usersSlice';
import { fetchCustomers } from '../redux/customersSlice';

export default function Dashboard() {
  const dispatch = useDispatch();
  
  // Redux store'dan verileri çek
  const users = useSelector(state => state.users.items);
  const customers = useSelector(state => state.customers.items);
  
  // Yükleme durumları
  const usersStatus = useSelector(state => state.users.status);
  const customersStatus = useSelector(state => state.customers.status);
  
  useEffect(() => {
    // Veriler henüz yüklenmediyse veya hata olduysa yeniden çek
    if (usersStatus === 'idle') {
      dispatch(fetchUsers());
    }
    if (customersStatus === 'idle') {
      dispatch(fetchCustomers());
    }
  }, [dispatch, usersStatus, customersStatus]);
  
  // Tüm randevuları users'dan topla
  const allAppointments = useMemo(() => {
    return users.flatMap(user => user.appointments || []);
  }, [users]);
  
  // Bugünün tarih aralığı
  const todayStr = new Date().toISOString().slice(0, 10);
  
  // Bugünkü randevular
  const todaysAppointments = allAppointments.filter(a => {
    const appointmentDate = new Date(a.date).toISOString().slice(0, 10);
    return appointmentDate === todayStr;
  });
  
  // Aktif çalışan sayısı (employee rolündeki kullanıcılar)
  const activeEmployees = users.filter(user => user.role === 'employee').length;
  
  // Toplam müşteri sayısı
  const totalCustomers = customers.length;
  
  // Toplam randevu sayısı
  const totalAppointments = allAppointments.length;
  
  const stats = [
    { label: 'AKTİF ÇALIŞAN', value: activeEmployees, icon: <FaUserFriends className="text-blue-400 text-3xl" />, color: 'from-blue-100 to-blue-50' },
    { label: 'TOPLAM MÜŞTERİ', value: totalCustomers, icon: <FaUsers className="text-green-400 text-3xl" />, color: 'from-green-100 to-green-50' },
    { label: 'TOPLAM RANDEVU', value: totalAppointments, icon: <FaListOl className="text-orange-400 text-3xl" />, color: 'from-orange-100 to-orange-50' },
    { label: 'BUGÜNKÜ RANDEVULAR', value: todaysAppointments.length, icon: <FaCalendarDay className="text-purple-400 text-3xl" />, color: 'from-purple-100 to-purple-50' },
  ];

  // Yükleniyor durumu
  const isLoading = usersStatus === 'loading' || customersStatus === 'loading';

  return (
    <div className="min-h-screen bg-gradient-to-br flex items-center  from-pink-50 to-purple-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-fuchsia-600 mb-2 drop-shadow">Salon Yönetim Paneli</h1>
          <p className="text-gray-600 text-lg">Güzellik salonunuzun genel durumunu takip edin</p>
        </div>
        
        {/* Yükleniyor göstergesi */}
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          /* Kartlar */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col items-center p-6`} style={{minWidth:'170px'}}>
                <div className="mb-2">{stat.icon}</div>
                <div className="text-gray-500 text-xs font-semibold tracking-widest">{stat.label}</div>
                <div className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
