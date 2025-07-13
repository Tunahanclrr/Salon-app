import { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiPlus } from 'react-icons/fi';
import { fetchEmployees } from '../redux/employeesSlice';
import { fetchCustomers, addCustomer } from '../redux/customersSlice';
import { fetchServices } from '../redux/servicesSlice';
import { addAppointment, updateAppointment } from '../redux/appointmentsSlice';
import Modal from '../components/Modal';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentEditForm from '../components/AppointmenEditForm'; // Dikkat: Dosya adı AppointmenEditForm değil, AppointmentEditForm olmalı.
import CustomerForm from '../components/CustomerForm';
import { toast } from 'react-toastify';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  APPOINTMENT: 'appointment',
};

const PX_PER_15_MINUTES = 32; 

const DraggableAppointment = ({ appointment, onEdit, services }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.APPOINTMENT,
    item: () => {
      const rawService = appointment.services?.[0];
      const matchedService = services?.find(
        (s) => s.name === rawService?.name && s.duration === rawService?.duration
      );

      const serviceId = matchedService?._id || null;

      const payload = {
        id: appointment._id,
        employeeId: appointment.employee?._id,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        serviceId,
      };

      return payload;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const customerName = appointment.customer?.name || 'Müşteri';
  const serviceName = appointment.services?.[0]?.name || 'Hizmet';

  // Saat hesaplama
  const [startHour, startMinute] = appointment.time.split(':').map((val) => parseInt(val, 10));
  const startTimeInMinutes = startHour * 60 + startMinute;
  const durationInMinutes = appointment.duration || 30;
  const CALENDAR_START_HOUR_IN_MINUTES = 9 * 60;

  const top = Math.round(
    (startTimeInMinutes - CALENDAR_START_HOUR_IN_MINUTES) * (PX_PER_15_MINUTES / 15)
  );
  const height = durationInMinutes * (PX_PER_15_MINUTES / 15);

  // Her çalışana farklı renk (isteğe göre geliştirilebilir)
  const employeeIndex = appointment.employee?.index ?? 0;
  const colorPalette = [
    'bg-green-200 border-green-400 text-green-800',
    'bg-orange-200 border-orange-400 text-orange-800',
    'bg-blue-200 border-blue-400 text-blue-800',
    'bg-pink-200 border-pink-400 text-pink-800',
    'bg-purple-200 border-purple-400 text-purple-800',
    'bg-yellow-200 border-yellow-400 text-yellow-800',
  ];
  const appointmentColorClass = colorPalette[employeeIndex % colorPalette.length];

  return (
    <div
      ref={drag}
      onClick={() => onEdit(appointment)}
      className={`absolute ${appointmentColorClass} rounded-md px-1 py-[2px] text-[10px] font-medium shadow-sm hover:shadow-md cursor-pointer transition-all leading-tight`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: 'calc(100% - 4px)',
        left: '2px',
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <div className="font-semibold truncate">{customerName}</div>
      <div className="text-gray-700 truncate">{serviceName}</div>
      <div className="text-gray-600 mt-1">
        {appointment.time} -{' '}
        {new Date(
          new Date(0, 0, 0, startHour, startMinute).getTime() +
            durationInMinutes * 60000
        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};


const TimeSlot = ({ time, date, employee, onDropAppointment, onDoubleClick }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.APPOINTMENT,
    drop: (item) => {
      console.log("drop edilen item:", item); // Bunu ekle ve console'a bak
      if (employee && date && time) {
        onDropAppointment(item.id, employee._id, date, time, item.serviceId); // serviceId burada doğru geliyor mu?
      }
    },
    collect: () => ({}),
  }), [employee, date, time]);

  return (
    <div
      ref={drop}
      onDoubleClick={() => onDoubleClick(employee, date, time)}
      className="h-12 border border-gray-200 bg-white hover:bg-blue-50 relative transition-colors duration-100"
      style={{ boxSizing: 'border-box' }}
    />
  );
};

const Appointments = () => {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [newAppointmentDefaults, setNewAppointmentDefaults] = useState({ employeeId: '', date: '', time: '' });

  const services = useSelector((state) => state.services.items);
  const employees = useSelector((state) => state.employees.items);
  const customers = useSelector((state) => state.customers.items);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchCustomers());
    dispatch(fetchServices());
  }, [dispatch]);

  const allAppointments = useMemo(() => {
    return employees.flatMap(emp =>
      (emp.appointments || []).map(app => ({
        ...app,
        employee: { _id: emp._id, name: emp.name, role: emp.role },
      }))
    );
  }, [employees]);

  const handleAddAppointment = async (formData) => {
    const result = await dispatch(addAppointment(formData));
    if (addAppointment.fulfilled.match(result)) {
      toast.success('Randevu başarıyla oluşturuldu');
      setAddModalOpen(false);
      dispatch(fetchEmployees()); // Yeni randevu eklendikten sonra çalışanları tekrar çek
    } else {
      toast.error(result.payload || 'Randevu oluşturulamadı');
    }
  };

  const handleEditAppointment = async (formData) => {
    const result = await dispatch(updateAppointment({ id: editingAppointment._id, appointmentData: formData }));
    if (updateAppointment.fulfilled.match(result)) {
      toast.success('Randevu güncellendi');
      setEditModalOpen(false);
      setEditingAppointment(null);
      dispatch(fetchEmployees()); // Randevu güncellendikten sonra çalışanları tekrar çek
    } else {
      toast.error(result.payload || 'Güncelleme başarısız');
    }
  };
  const handleDropAppointment = async (
    appointmentId,
    newEmployeeId,
    newDate,
    newTime,
    droppedServiceId
  ) => {
    const appointmentToUpdate = allAppointments.find(app => app._id === appointmentId);

    if (!appointmentToUpdate) {
      toast.error('Randevu bulunamadı!');
      return;
    }

    const serviceIdToUse = droppedServiceId || appointmentToUpdate.services?.[0]?._id;

    if (!serviceIdToUse) {
      console.error("Hizmet ID'si bulunamadı!", {
        droppedServiceId,
        existingService: appointmentToUpdate.services?.[0]?._id
      });
      toast.error('Hizmet bilgisi eksik, güncellenemedi! Lütfen randevuyu düzenleme formundan güncelleyin.');
      return;
    }

    // Eğer services prop ile geliyorsa, dışarıdan al; değilse selector ile çek
    const selectedService =
      services?.find(s => s._id === serviceIdToUse || s.serviceId === serviceIdToUse);

    if (!selectedService) {
      toast.error("Hizmet bilgisi eksik, güncelleme başarısız!");
      return;
    }

    const updatedData = {
      employee: newEmployeeId,
      customer:
        typeof appointmentToUpdate.customer === 'object'
          ? appointmentToUpdate.customer._id
          : appointmentToUpdate.customer,
      date: newDate,
      time: newTime,
      notes: appointmentToUpdate.notes || '',
      duration: selectedService.duration || 30,
      services: [
        {
          _id: selectedService._id,
          name: selectedService.name,
          duration: selectedService.duration
        }
      ]
    };

    if (
      !updatedData.employee ||
      !updatedData.customer ||
      !updatedData.date ||
      !updatedData.time ||
      !updatedData.services[0]?._id
    ) {
      console.error("Eksik alanlar:", updatedData);
      toast.error('Eksik alan var, güncellenemedi! Detaylar konsolda.');
      return;
    }

    const result = await dispatch(
      updateAppointment({ id: appointmentId, appointmentData: updatedData })
    );

    if (updateAppointment.fulfilled.match(result)) {
      toast.success('Randevu başarıyla güncellendi');
      await dispatch(fetchEmployees());
    } else {
      toast.error(result.payload || 'Güncelleme başarısız');
    }
  };



  const handleAddCustomer = async (form) => {
    const result = await dispatch(addCustomer(form));
    if (addCustomer.fulfilled.match(result)) {
      toast.success('Müşteri eklendi');
      setCustomerModalOpen(false);
      dispatch(fetchCustomers()); // Yeni müşteri eklendikten sonra müşterileri tekrar çek
    } else {
      toast.error(result.payload || 'Müşteri eklenemedi');
    }
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 9; h < 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, []);

  const handleSlotDoubleClick = useCallback((employee, date, time) => {
    setNewAppointmentDefaults({ employeeId: employee._id, date, time });
    setAddModalOpen(true);
  }, []);

  const [currentTimePx, setCurrentTimePx] = useState(0);
  useEffect(() => {
    const updateCurrentLine = () => {
      const now = new Date();
      if (now.toISOString().slice(0, 10) === selectedDate) {
        const mins = (now.getHours() * 60 + now.getMinutes()) - (9 * 60);
        setCurrentTimePx(mins * (PX_PER_15_MINUTES / 15));
      } else {
        setCurrentTimePx(-9999); // Geçerli gün değilse çizgiyi gizle
      }
    };
    updateCurrentLine();
    const interval = setInterval(updateCurrentLine, 60 * 1000); // Her dakika güncelle
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="sm:text-3xl font-bold">Randevu Takvimi</h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded shadow-sm border">
              <FiCalendar className="text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none font-medium text-gray-700"
              />
            </div>
            <button
              className="bg-gradient-to-r from-pink-500  to-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:shadow-lg"
              onClick={() => {
                setNewAppointmentDefaults({ employeeId: '', date: selectedDate, time: '' });
                setAddModalOpen(true);
              }}
            >
              <FiPlus />
              <span className="hidden sm:inline">Yeni Randevu</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
        <div className="grid border-b" style={{ gridTemplateColumns: `60px repeat(${employees.length}, 1fr)` }}>
            <div className="py-3 px-2 border-r font-semibold text-sm sticky left-0 bg-gray-50 z-20">Saat</div>
            {employees.map((emp, index) => {
  const colors = ['bg-green-200', 'bg-orange-200', 'bg-blue-200', 'bg-pink-200', 'bg-purple-200', 'bg-yellow-200'];
  const colorClass = colors[index % colors.length];
  return (
    <div
      key={emp._id}
      className={`py-3 px-4 text-sm text-center font-semibold ${colorClass} border-r border-gray-300`}
    >
      {emp.name}
    </div>
  );
})}


          </div>

          <div className="relative grid" style={{ gridTemplateColumns: `60px repeat(${employees.length}, 1fr)` }}>
            {/* Saatler sol taraf */}
            <div className="sticky left-0 z-10 bg-white border-r">
              {timeSlots.map((slot) => (
                <div key={slot} className="h-8 text-xs text-gray-700 border-t border-gray-200 flex items-start justify-end pr-2 bg-white">
                  {(slot.endsWith(':00') || slot.endsWith(':30')) ? slot : ''}
                </div>
              ))}
            </div>

            {/* Randevular ve slotlar */}
            {employees.map(emp => (
              <div key={emp._id} className="relative border-r">
                {timeSlots.map((time) => (
                  <TimeSlot
                    key={`${emp._id}-${selectedDate}-${time}`}
                    time={time}
                    date={selectedDate}
                    employee={emp}
                    onDropAppointment={handleDropAppointment}
                    onDoubleClick={handleSlotDoubleClick}
                  />
                ))}
                {allAppointments
                  .filter(app => app.employee?._id === emp._id && app.date === selectedDate)
                  .map(app => (
                    <DraggableAppointment
                      key={app._id}
                      services={services} // 👈 burası önemli
                      appointment={app}
                      onEdit={appointment => {
                        setEditingAppointment(appointment);
                        setEditModalOpen(true);
                      }}
                    />
                  ))}
              </div>
            ))}

            {/* Kırmızı saat çizgisi */}
            {currentTimePx !== -9999 && (
              <div className="absolute left-0 right-0 h-0.5 bg-red-600 z-30 animate-pulse" style={{ top: `${currentTimePx}px` }} />
            )}
          </div>
        </div>

        {/* Modallar */}
        <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Randevu Ekle">
          <AppointmentForm
            employees={employees}
            customers={customers}
            services={services}
            appointments={allAppointments}
            onCancel={() => setAddModalOpen(false)}
            onSubmit={handleAddAppointment}
            onAddCustomer={() => setCustomerModalOpen(true)}
            initialData={newAppointmentDefaults}
          />
        </Modal>

        <Modal open={editModalOpen} onClose={() => {
          setEditModalOpen(false);
          setEditingAppointment(null);
        }} title="Randevu Düzenle">
          <AppointmentEditForm
            initialData={editingAppointment}
            employees={employees}
            customers={customers}
            services={services}
            appointments={allAppointments}
            onCancel={() => {
              setEditModalOpen(false);
              setEditingAppointment(null);
            }}
            onSubmit={handleEditAppointment}
            onAddCustomer={() => setCustomerModalOpen(true)}
          />
        </Modal>

        <Modal open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} title="Müşteri Ekle">
          <CustomerForm onSubmit={handleAddCustomer} onCancel={() => setCustomerModalOpen(false)} />
        </Modal>
      </div>
    </DndProvider>
  );
};

export default Appointments;