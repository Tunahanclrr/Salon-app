import React from 'react';
import { FaUserFriends, FaUsers, FaCalendarDay, FaListOl } from 'react-icons/fa';

// appointments datası (örnek veri)
const appointments = [
  { id: 1, name: 'Canan Müşteri', date: '2024-06-10', time: '14:00', service: 'Saç Kesimi' },
  { id: 2, name: 'Ahmet Yılmaz', date: '2024-06-13', time: '11:00', service: 'Cilt Bakımı' },
  { id: 3, name: 'Zeynep Kaya', date: '2024-06-20', time: '16:00', service: 'Manikür' },
  { id: 4, name: 'Mehmet Demir', date: '2024-06-09', time: '10:00', service: 'Saç Boyama' },
  { id: 5, name: 'Ayşe Korkmaz', date: '2024-06-08', time: '13:00', service: 'Fön' },
  { id: 6, name: 'Ali Vural', date: '2024-06-10', time: '15:30', service: 'Sakal Tıraşı' },
  { id: 7, name: 'deniz Vural', date: '2024-07-10', time: '15:30', service: 'Sakal Tıraşı' },

];

// Bugünün tarih aralığı
const todayStr = new Date().toISOString().slice(0, 10);

// Bugünkü randevular
const todaysAppointments = appointments.filter(a => a.date === todayStr);

// Toplam randevu
const totalAppointments = appointments.length;

// (Örnek) Aktif çalışan ve müşteri sayısı
const activeEmployees = 3;
const totalCustomers = 5;

const stats = [
  { label: 'AKTİF ÇALIŞAN', value: activeEmployees, icon: <FaUserFriends className="text-blue-400 text-3xl" />, color: 'from-blue-100 to-blue-50' },
  { label: 'TOPLAM MÜŞTERİ', value: totalCustomers, icon: <FaUsers className="text-green-400 text-3xl" />, color: 'from-green-100 to-green-50' },
  { label: 'TOPLAM RANDEVU', value: totalAppointments, icon: <FaListOl className="text-orange-400 text-3xl" />, color: 'from-orange-100 to-orange-50' },
  { label: 'BUGÜNKÜ RANDEVULAR', value: todaysAppointments.length, icon: <FaCalendarDay className="text-purple-400 text-3xl" />, color: 'from-purple-100 to-purple-50' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-fuchsia-600 mb-2 drop-shadow">Salon Yönetim Paneli</h1>
          <p className="text-gray-600 text-lg">Güzellik salonunuzun genel durumunu takip edin</p>
        </div>
        {/* Kartlar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow flex flex-col items-center p-6`} style={{minWidth:'170px'}}>
              <div className="mb-2">{stat.icon}</div>
              <div className="text-gray-500 text-xs font-semibold tracking-widest">{stat.label}</div>
              <div className="text-3xl font-bold text-gray-800 mt-1">{stat.value}</div>
            </div>
          ))}
        </div>
        {/* Bugünkü Randevular */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xl font-bold text-purple-700">
              <FaCalendarDay className="text-purple-500" />
              Bugünkü Randevular
            </div>
            <div className="text-gray-400 text-sm">{todayStr.split('-').reverse().join('.')}</div>
          </div>
          {todaysAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <FaCalendarDay className="text-5xl text-gray-300 mb-2" />
              <div className="text-lg font-semibold text-gray-500">Bugün randevu yok</div>
              <div className="text-gray-400 text-sm">Bugün için henüz randevu bulunmuyor.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="py-2 px-4 text-left">Müşteri</th>
                    <th className="py-2 px-4 text-left">Saat</th>
                    <th className="py-2 px-4 text-left">Hizmet</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysAppointments.map(a => (
                    <tr key={a.id} className="border-b">
                      <td className="py-2 px-4">{a.name}</td>
                      <td className="py-2 px-4">{a.time}</td>
                      <td className="py-2 px-4">{a.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
