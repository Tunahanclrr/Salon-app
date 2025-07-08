import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiCalendar, FiClock, FiUser, FiPlus, FiEdit3 } from 'react-icons/fi'
import { fetchEmployees } from '../redux/employeesSlice'
import { fetchCustomers, addCustomer } from '../redux/customersSlice'
import { fetchServices } from '../redux/servicesSlice'
import { addAppointment, updateAppointment } from '../redux/appointmentsSlice'
import Modal from '../components/Modal'
import AppointmentForm from '../components/AppointmentForm'
import AppointmentEditForm from '../components/AppointmentEditForm'
import CustomerForm from '../components/CustomerForm'
import { toast } from 'react-toastify'

const Appointments = () => {
  const dispatch = useDispatch()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState(null)

  const employees = useSelector(state => state.employees.items)
  const customers = useSelector(state => state.customers.items)

  useEffect(() => {
    dispatch(fetchEmployees())
    dispatch(fetchCustomers())
    dispatch(fetchServices())
  }, [dispatch])

  const getAppointmentsForEmployee = (employee) =>
    (employee.appointments || []).filter(app => app.date === selectedDate)

  // Yeni Randevu Ekleme
  const handleAddAppointment = async (formData) => {
    try {
      const result = await dispatch(addAppointment(formData))
      if (addAppointment.fulfilled.match(result)) {
        toast.success('Randevu başarıyla oluşturuldu')
        setAddModalOpen(false)
        await Promise.all([dispatch(fetchEmployees()), dispatch(fetchCustomers())])
      } else {
        toast.error(result.payload || 'Randevu oluşturulamadı')
      }
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu')
    }
  }

  // Randevu Düzenleme
  const handleEditAppointment = async (formData) => {
    try {
      const result = await dispatch(updateAppointment({ id: editingAppointment._id, appointmentData: formData }))
      if (updateAppointment.fulfilled.match(result)) {
        toast.success('Randevu başarıyla güncellendi')
        setEditModalOpen(false)
        setEditingAppointment(null)
        await dispatch(fetchEmployees())
      } else {
        toast.error(result.payload || 'Güncelleme başarısız')
      }
    } catch (err) {
      toast.error('Beklenmeyen hata oluştu')
    }
  }

  // Müşteri Ekleme
  const handleAddCustomer = async (form) => {
    const result = await dispatch(addCustomer(form))
    if (addCustomer.fulfilled.match(result)) {
      toast.success('Müşteri başarıyla eklendi')
      setCustomerModalOpen(false)
      dispatch(fetchCustomers())
    } else {
      toast.error(result.payload || 'Müşteri eklenemedi')
    }
  }

  const formatAppointmentTime = (appointment) => {
    const startTime = appointment.time
    const duration = appointment.duration || 30
    const [hours, minutes] = startTime.split(':').map(Number)
    const startDate = new Date(0, 0, 0, hours, minutes)
    const endDate = new Date(startDate.getTime() + duration * 60000)

    const formatTime = (date) => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`

    return `${formatTime(startDate)} - ${formatTime(endDate)} (${duration} dk)`
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
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
                    <div
                      key={app._id}
                      className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow relative"
                    >
                      <div className="flex items-start space-x-2 mb-2">
                        <FiUser className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-gray-800">{app.customer?.name || 'Müşteri'}</span>
                      </div>
                      <div className="text-sm text-gray-600 font-medium">{app.services?.[0]?.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                        <FiClock className="w-4 h-4" />
                        <span>{formatAppointmentTime(app)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingAppointment(app)
                          setEditModalOpen(true)
                        }}
                        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 transition"
                      >
                        <FiEdit3 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Randevu Ekle Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Randevu Ekle">
        <AppointmentForm
          employees={employees}
          customers={customers}
          appointments={employees.flatMap((e) => e.appointments || [])}
          onCancel={() => setAddModalOpen(false)}
          onSubmit={handleAddAppointment}
          onAddCustomer={() => setCustomerModalOpen(true)}
        />
      </Modal>

      {/* Randevu Düzenle Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingAppointment(null)
        }}
        title="Randevu Düzenle"
      >
        <AppointmentEditForm
          initialData={editingAppointment}
          employees={employees}
          customers={customers}
          appointments={employees.flatMap((e) => e.appointments || [])}
          onCancel={() => {
            setEditModalOpen(false)
            setEditingAppointment(null)
          }}
          onSubmit={handleEditAppointment}
          onAddCustomer={() => setCustomerModalOpen(true)}
        />
      </Modal>

      {/* Müşteri Ekle Modal */}
      <Modal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Müşteri Ekle">
        <CustomerForm onSubmit={handleAddCustomer} onCancel={() => setCustomerModalOpen(false)} />
      </Modal>
    </div>
  )
}

export default Appointments
