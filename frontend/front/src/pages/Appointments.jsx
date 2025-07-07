import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiCalendar, FiClock, FiUser, FiPlus } from 'react-icons/fi'
import { fetchEmployees } from '../redux/employeesSlice'
import { addAppointment } from '../redux/appointmentsSlice'
import { addCustomer } from '../redux/customersSlice'
import Modal from '../components/Modal'
import { toast } from 'react-toastify';
import AppointmentForm from '../components/AppointmentForm'
import CustomerForm from '../components/CustomerForm'
import { fetchCustomers } from '../redux/customersSlice';
const Appointments = () => {
  const dispatch = useDispatch()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const customers = useSelector(state => state.customers.items);
  // Çalışanlar. Her çalışanın içinde populate edilmiş appointments dizisi olduğunu varsayıyoruz.
  const employees = useSelector(state => state.employees.items)

  useEffect(() => {
    dispatch(fetchEmployees())
    dispatch(fetchCustomers())
  }, [dispatch])
console.log(employees)
  // Seçili güne ait randevuları döndür
  const getAppointmentsForEmployee = (employee) =>
    (employee.appointments || []).filter(app => app.date === selectedDate)
  // Randevu ekle
  const handleAddAppointment = async (form) => {
    const res = await dispatch(addAppointment(form));
    if (addAppointment.fulfilled.match(res)) {
      toast.success(res.payload.message || 'Randevu oluşturuldu');
      setAddModalOpen(false);
      dispatch(fetchEmployees());
    } else {
      toast.error(res.payload || 'Randevu oluşturulamadı');
    }
  };

  // Yeni müşteri ekleme
  const handleAddCustomer = async (form) => {
    const res = await dispatch(addCustomer(form));
    if (addCustomer.fulfilled.match(res)) {
      toast.success('Müşteri eklendi');
      setCustomerModalOpen(false);
      dispatch(fetchCustomers());
    } else {
      toast.error(res.payload || 'Müşteri eklenemedi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Randevu Takvimi</h1>
          <p className="text-gray-600 mt-1">Günlük randevu programınızı yönetin</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white p-3 rounded-xl shadow-sm border">
            <FiCalendar className="w-5 h-5 text-gray-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent focus:outline-none text-gray-700 font-medium"
            />
          </div>
          <button
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-3 rounded-xl font-medium hover:shadow-lg transition-shadow flex items-center space-x-2"
            onClick={() => setAddModalOpen(true)}
          >
            <FiPlus className="w-5 h-5" />
            <span className="hidden sm:inline">Randevu Ekle</span>
          </button>
        </div>
      </div>

      {/* Takvim Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {employees.map((emp) => {
          const todays = getAppointmentsForEmployee(emp)
          return (
            <div key={emp._id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {/* Çalışan Bilgisi */}
              <div className="bg-blue-500 p-4 text-white">
                <h3 className="font-semibold text-lg">{emp.name}</h3>
                <p className="text-white/80 text-sm">{emp.role || 'Uzman'}</p>
              </div>

              <div className="p-4 space-y-3">
                {todays.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-sm text-gray-400 font-medium">
                    Randevu bulunamadı
                  </div>
                ) : (
                  todays.map((app) => (
                    <div key={app._id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                      <div className="flex items-start space-x-2 mb-2">
                        <FiUser className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">{app.customer?.name || 'Müşteri'}</span>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">{app.service}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <FiClock className="w-4 h-4" />
                        <span>{app.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Randevu Ekle Modalı */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Randevu Ekle">
      <AppointmentForm
  customers={customers}
  employees={employees}
  onSubmit={handleAddAppointment}
  onCancel={() => setAddModalOpen(false)}
  onAddCustomer={() => setCustomerModalOpen(true)}
/>
      </Modal>

      {/* Müşteri ekle modalı */}
      <Modal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Müşteri Ekle">
        <CustomerForm
          onSubmit={handleAddCustomer}
          onCancel={() => setCustomerModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

export default Appointments
