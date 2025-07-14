import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiPlus } from 'react-icons/fi';
import { fetchEmployees } from '../redux/employeesSlice';
import { fetchCustomers, addCustomer } from '../redux/customersSlice';
import { fetchServices } from '../redux/servicesSlice';
import { addAppointment, updateAppointment } from '../redux/appointmentsSlice';
import Modal from '../components/Modal';
import AppointmentForm from '../components/AppointmentForm';
import AppointmentEditForm from '../components/AppointmenEditForm';
import CustomerForm from '../components/CustomerForm';
import { toast } from 'react-toastify';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  APPOINTMENT: 'appointment',
};

const PX_PER_15_MINUTES = 48;

const CALENDAR_START_HOUR = 9;
const CALENDAR_START_HOUR_IN_MINUTES = CALENDAR_START_HOUR * 60;

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

  const [startHour, startMinute] = appointment.time.split(':').map((val) => parseInt(val, 10));
  const startTimeInMinutes = startHour * 60 + startMinute;
  const durationInMinutes = appointment.duration || 30;

  const top = Math.round(
    (startTimeInMinutes - CALENDAR_START_HOUR_IN_MINUTES) * (PX_PER_15_MINUTES / 15)
  );
  const height = durationInMinutes * (PX_PER_15_MINUTES / 15);

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

  const appointmentZIndex = appointment.zIndex || 20;

  return (
    <div
      ref={drag}
      onClick={() => onEdit(appointment)}
      className={`absolute ${appointmentColorClass} rounded-md px-1 py-0.5 text-[8px] sm:px-2 sm:py-1 sm:text-[10px] font-medium shadow-sm hover:shadow-md cursor-pointer transition-all leading-tight`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: `${appointment.dynamicWidth}%`, // Dynamic width for side-by-side
        left: `${appointment.dynamicLeft}%`,   // Dynamic left for side-by-side
        opacity: isDragging ? 0.6 : 1,
        zIndex: appointmentZIndex,
      }}
    >
      <div className="font-semibold truncate">{customerName}</div>
      <div className="text-gray-700 truncate">{serviceName}</div>
      <div className="text-gray-600 mt-0 sm:mt-1">
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
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.APPOINTMENT,
    drop: (item) => {
      if (employee && date && time) {
        onDropAppointment(item.id, employee._id, date, time, item.serviceId);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [employee, date, time]);

  const isActive = isOver && canDrop;
  let backgroundColor = 'bg-white';
  let borderColor = 'border-gray-200';

  if (isActive) {
    backgroundColor = 'bg-blue-100';
    borderColor = 'border-blue-400';
  } else if (canDrop) {
    backgroundColor = 'bg-blue-50';
  }

  return (
    <div
      ref={drop}
      onDoubleClick={() => onDoubleClick(employee, date, time)}
      className={`h-12 border ${borderColor} ${backgroundColor} relative transition-colors duration-100`}
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

  const [showConfirmDropModal, setShowConfirmDropModal] = useState(false);
  const [pendingDropData, setPendingDropData] = useState(null);

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
        employee: { _id: emp._id, name: emp.name, role: emp.role, index: employees.findIndex(e => e._id === emp._id) },
      }))
    );
  }, [employees]);

  const appointmentsWithOverlapInfo = useMemo(() => {
    const processedAppointments = [];
    const appointmentsByEmployeeAndDate = new Map();

    allAppointments.forEach(app => {
      if (app.date === selectedDate && app.employee?._id) {
        const employeeDateKey = `${app.employee._id}-${app.date}`;
        if (!appointmentsByEmployeeAndDate.has(employeeDateKey)) {
          appointmentsByEmployeeAndDate.set(employeeDateKey, []);
        }
        appointmentsByEmployeeAndDate.get(employeeDateKey).push(app);
      } else {
        processedAppointments.push(app);
      }
    });

    appointmentsByEmployeeAndDate.forEach((appsOnDay) => {
      const sortedApps = appsOnDay.sort((a, b) => {
        const [hA, mA] = a.time.split(':').map(Number);
        const [hB, mB] = b.time.split(':').map(Number);
        if (hA !== hB) return hA - hB;
        return mA - mB;
      });

      // Gelişmiş çakışma algoritması: Her randevu için bir "çizgi" veya "kolon" belirler
      const columns = [];

      sortedApps.forEach(currentApp => {
        const [currentStartHour, currentStartMinute] = currentApp.time.split(':').map(Number);
        const currentStartTime = new Date(0, 0, 0, currentStartHour, currentStartMinute).getTime();
        const currentEndTime = currentStartTime + (currentApp.duration || 30) * 60000;

        let placedInColumn = false;
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          // Bu kolondaki hiçbir randevu ile çakışmıyor mu?
          const canPlaceInColumn = !column.some(colApp => {
            const [colStartHour, colStartMinute] = colApp.time.split(':').map(Number);
            const colStartTime = new Date(0, 0, 0, colStartHour, colStartMinute).getTime();
            const colEndTime = colStartTime + (colApp.duration || 30) * 60000;
            return (currentStartTime < colEndTime && currentEndTime > colStartTime);
          });

          if (canPlaceInColumn) {
            column.push(currentApp);
            currentApp.columnIndex = i; // Kolon indeksini kaydet
            placedInColumn = true;
            break;
          }
        }

        if (!placedInColumn) {
          // Yeni bir kolon oluştur
          currentApp.columnIndex = columns.length;
          columns.push([currentApp]);
        }
      });

      // Randevuları işledikten sonra, her randevu için dynamicWidth ve dynamicLeft değerlerini hesapla
      columns.forEach((column, columnIndex) => {
        const maxColumns = columns.length; // Toplam kolon sayısı
        const widthPerColumn = 100 / maxColumns;

        column.forEach(appInColumn => {
          processedAppointments.push({
            ...appInColumn,
            dynamicWidth: widthPerColumn,
            dynamicLeft: widthPerColumn * appInColumn.columnIndex,
            zIndex: 20 + appInColumn.columnIndex,
          });
        });
      });
    });
    return processedAppointments;
  }, [allAppointments, selectedDate]);


  const handleAddAppointment = async (formData) => {
    const result = await dispatch(addAppointment(formData));
    if (addAppointment.fulfilled.match(result)) {
      toast.success('Randevu başarıyla oluşturuldu');
      setAddModalOpen(false);
      dispatch(fetchEmployees());
      dispatch(fetchCustomers());
    } else {
      toast.error(result.payload?.message || 'Randevu oluşturulamadı');
    }
  };

  const handleEditAppointment = async (formData) => {
    const result = await dispatch(updateAppointment({ id: editingAppointment._id, appointmentData: formData }));
    if (updateAppointment.fulfilled.match(result)) {
      toast.success('Randevu güncellendi');
      setEditModalOpen(false);
      setEditingAppointment(null);
      dispatch(fetchEmployees());
      dispatch(fetchCustomers());
    } else {
      toast.error(result.payload?.message || 'Güncelleme başarısız');
    }
  };

  const executeDropUpdate = async (appointmentId, updatedData, force = false) => {
    const payload = { ...updatedData, force };
    const result = await dispatch(updateAppointment({ id: appointmentId, appointmentData: payload }));

    if (updateAppointment.fulfilled.match(result)) {
      toast.success('Randevu başarıyla güncellendi');
      await dispatch(fetchEmployees());
    } else {
      if (result.payload?.conflict && !force) {
        toast.error('Bu saat aralığında çalışanın başka bir randevusu var. Lütfen manuel deneyin.');
      } else {
        toast.error(result.payload?.message || 'Güncelleme başarısız');
      }
    }
    setPendingDropData(null);
    setShowConfirmDropModal(false);
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
      console.error("Hizmet ID'si bulunamadı!", { droppedServiceId, existingService: appointmentToUpdate.services?.[0]?._id });
      toast.error('Hizmet bilgisi eksik, güncellenemedi! Lütfen randevuyu düzenleme formundan güncelleyin.');
      return;
    }

    const selectedService = services?.find(s => s._id === serviceIdToUse);
    if (!selectedService) {
      toast.error("Hizmet bilgisi eksik, güncelleme başarısız!");
      return;
    }

    const updatedData = {
      employee: newEmployeeId,
      customer: typeof appointmentToUpdate.customer === 'object' ? appointmentToUpdate.customer._id : appointmentToUpdate.customer,
      date: newDate,
      time: newTime,
      notes: appointmentToUpdate.notes || '',
      duration: selectedService.duration || 30,
      services: [{
        _id: selectedService._id,
        name: selectedService.name,
        duration: selectedService.duration,
        price: selectedService.price, 
      }],
    };

    const [sh, sm] = newTime.split(':').map(Number);
    const proposedSlotStart = new Date(0, 0, 0, sh, sm);
    const proposedSlotEnd = new Date(proposedSlotStart.getTime() + updatedData.duration * 60000);

    const employeeAppointmentsOnDate = allAppointments.filter(
      (app) =>
        app.employee?._id === newEmployeeId &&
        app.date === newDate &&
        app._id !== appointmentId && 
        app.status !== "cancelled"
    );

    const isConflicting = employeeAppointmentsOnDate.some((app) => {
      if (!app.time) return false;

      const [ah, am] = app.time.split(':').map(Number);
      const appStart = new Date(0, 0, 0, ah, am);
      const appEnd = new Date(appStart.getTime() + (app.duration || 30) * 60000);

      return (
        (proposedSlotStart < appEnd && proposedSlotEnd > appStart)
      );
    });

    if (isConflicting) {
      setPendingDropData({ appointmentId, updatedData });
      setShowConfirmDropModal(true);
    } else {
      executeDropUpdate(appointmentId, updatedData, false); 
    }
  };


  const handleAddCustomer = async (form) => {
    const result = await dispatch(addCustomer(form));
    if (addCustomer.fulfilled.match(result)) {
      toast.success('Müşteri eklendi');
      setCustomerModalOpen(false);
      dispatch(fetchCustomers());
    } else {
      toast.error(result.payload?.message || 'Müşteri eklenemedi');
    }
  };

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

  const handleSlotDoubleClick = useCallback((employee, date, time) => {
    setNewAppointmentDefaults({ employeeId: employee._id, date, time });
    setAddModalOpen(true);
  }, []);

  const [currentTimePx, setCurrentTimePx] = useState(0);
  useEffect(() => {
    const updateCurrentLine = () => {
      const now = new Date();
      if (now.toISOString().slice(0, 10) === selectedDate) {
        const mins = (now.getHours() * 60 + now.getMinutes()) - CALENDAR_START_HOUR_IN_MINUTES;
        setCurrentTimePx(mins * (PX_PER_15_MINUTES / 15));
      } else {
        setCurrentTimePx(-9999);
      }
    };
    updateCurrentLine();
    const interval = setInterval(updateCurrentLine, 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-2 sm:p-6 bg-gray-100 min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 whitespace-nowrap">Randevu Takvimi</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center w-full sm:w-auto">
            <div className="flex items-center gap-1 sm:gap-2 bg-white px-2 py-1 sm:px-3 sm:py-2 rounded-lg shadow-sm border border-gray-200 w-full sm:w-auto">
              <FiCalendar className="text-gray-500 text-base sm:text-lg" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent outline-none font-medium text-gray-700 text-xs sm:text-base cursor-pointer"
              />
            </div>
            <button
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base w-full sm:w-auto"
              onClick={() => {
                setNewAppointmentDefaults({ employeeId: '', date: selectedDate, time: '' });
                setAddModalOpen(true);
              }}
            >
              <FiPlus className="text-base sm:text-lg" />
              <span className="whitespace-nowrap">Yeni Randevu</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden relative calendar-grid-container">
          <div className="grid border-b border-gray-200 relative z-20 bg-gray-50 sticky top-0 calendar-header-grid"
            style={{
              '--employee-count': employees.length
            }}>
            <div className="py-2 px-1 sm:py-3 sm:px-2 border-r border-gray-200 font-semibold text-xs sm:text-sm text-gray-700 text-center time-column-sticky">Saat</div>
            {employees.map((emp, index) => {
              const colors = ['bg-green-100', 'bg-orange-100', 'bg-blue-100', 'bg-pink-100', 'bg-purple-100', 'bg-yellow-100'];
              const borderColors = ['border-green-300', 'border-orange-300', 'border-blue-300', 'border-pink-300', 'border-purple-300', 'border-yellow-300'];
              const colorClass = colors[index % colors.length];
              const borderColorClass = borderColors[index % borderColors.length];
              return (
                <div
                  key={emp._id}
                  className={`py-2 px-1 sm:py-3 sm:px-2 text-xs sm:text-sm text-center font-semibold text-gray-800 ${colorClass} ${borderColorClass} border-r`}
                >
                  <span className="truncate">{emp.name}</span>
                </div>
              );
            })}
          </div>

          <div className="relative grid calendar-body-grid"
            style={{
              '--employee-count': employees.length
            }}>
            <div className="time-column-sticky">
              {timeSlots.map((slot) => (
                <div key={slot} className="h-12 text-[10px] sm:text-xs text-gray-500 border-t border-gray-100 flex items-start justify-end pr-1 sm:pr-2 pt-1 bg-white">
                  {(slot.endsWith(':00') || slot.endsWith(':30')) ? slot : ''}
                </div>
              ))}
            </div>

            {employees.map(emp => (
              <div key={emp._id} className="relative border-r border-gray-100">
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
                {appointmentsWithOverlapInfo
                  .filter(app => app.employee?._id === emp._id && app.date === selectedDate)
                  .map(app => (
                    <DraggableAppointment
                      key={app._id}
                      services={services}
                      appointment={app} 
                      onEdit={appointment => {
                        setEditingAppointment(appointment);
                        setEditModalOpen(true);
                      }}
                    />
                  ))}
              </div>
            ))}

            {currentTimePx !== -9999 && (
              <div className="absolute left-0 right-0 h-0.5 bg-red-600 z-30 animate-pulse" style={{ top: `${currentTimePx}px` }} />
            )}
          </div>
        </div>

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

        {showConfirmDropModal && pendingDropData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full space-y-4">
              <h2 className="text-lg font-semibold">Uyarı: Randevu Çakışması</h2>
              <p>
                Bu saate başka bir randevu zaten mevcut. Yine de bu randevuyu bu saate taşımak
                istediğinize emin misiniz?
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => executeDropUpdate(
                    pendingDropData.appointmentId,
                    pendingDropData.updatedData,
                    true 
                  )}
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Evet, Eminim (Zorla)
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDropModal(false);
                    setPendingDropData(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
                >
                  Vazgeç
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default Appointments;