import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiCalendar, FiPlus } from 'react-icons/fi';
import { fetchEmployees } from '../redux/employeesSlice';
import { fetchCustomers, addCustomer } from '../redux/customersSlice';
import { fetchServices } from '../redux/servicesSlice';
import { addAppointment, updateAppointment, updateCustomerNotArrived } from '../redux/appointmentsSlice';
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

const PX_PER_15_MINUTES = 60; // Randevu kutularının yüksekliği için arttırıldı

const CALENDAR_START_HOUR = 9;
const CALENDAR_START_HOUR_IN_MINUTES = CALENDAR_START_HOUR * 60;

const DraggableAppointment = ({ appointment, onEdit, services }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.APPOINTMENT,
    item: () => {
      const serviceIds = [];
      console.log('Dragging appointment with services:', appointment.services);
      
      if (appointment.services && appointment.services.length > 0) {
        appointment.services.forEach(service => {
          if (service._id) {
            // Doğrudan _id değeri varsa kullan
            serviceIds.push(service._id);
          } else if (service.name && services) {
            // _id yoksa, önce hizmet adı ve süresine göre eşleştirme yap
            let matchedService = services.find(s => 
              s.name === service.name && 
              (!service.duration || s.duration === service.duration)
            );
            
            // Eğer bulunamazsa, sadece hizmet adına göre eşleştirme yap (büyük/küçük harf duyarsız)
            if (!matchedService) {
              matchedService = services.find(s => 
                s.name.toLowerCase() === service.name.toLowerCase()
              );
            }
            
            // Hala bulunamazsa, hizmet adının bir kısmını içeren herhangi bir hizmeti bul
            if (!matchedService) {
              matchedService = services.find(s => 
                s.name.toLowerCase().includes(service.name.toLowerCase()) || 
                service.name.toLowerCase().includes(s.name.toLowerCase())
              );
            }
            if (matchedService && matchedService._id) {
              serviceIds.push(matchedService._id);
            }
          }
        });
      }
      
      console.log('Service IDs for drag:', serviceIds);

      const payload = {
        id: appointment._id,
        employeeId: appointment.employee?._id,
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        serviceIds: serviceIds, // Doğrudan _id değerlerini kullan
      };

      return payload;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const customerName = appointment.customer?.name || 'Müşteri';
  const serviceNames = appointment.services?.map(s => s.name).join(', ') || 'Hizmet';

  const [startHour, startMinute] = appointment.time.split(':').map((val) => parseInt(val, 10));
  const startTimeInMinutes = startHour * 60 + startMinute;
  const durationInMinutes = appointment.duration || 30;

  const top = Math.round(
    (startTimeInMinutes - CALENDAR_START_HOUR_IN_MINUTES) * (PX_PER_15_MINUTES / 15)
  );
  const height = Math.round(durationInMinutes * (PX_PER_15_MINUTES / 15));

  const employeeIndex = appointment.employee?.index ?? 0;
  const colorPalette = [
    'bg-green-200 border-green-400 text-green-800',
    'bg-orange-200 border-orange-400 text-orange-800',
    'bg-blue-200 border-blue-400 text-blue-800',
    'bg-pink-200 border-pink-400 text-pink-800',
    'bg-purple-200 border-purple-400 text-purple-800',
    'bg-yellow-200 border-yellow-400 text-yellow-800',
  ];
  
  // Müşteri gelmedi durumunda farklı stil uygula
  let appointmentColorClass;
  if (appointment.customerNotArrived) {
    appointmentColorClass = 'bg-red-200 border-red-400 text-red-800';
  } else {
    appointmentColorClass = colorPalette[employeeIndex % colorPalette.length];
  }

  const appointmentZIndex = appointment.zIndex || 20;

  return (
    <div
      ref={drag}
      onClick={() => onEdit(appointment)}
      className={`absolute ${appointmentColorClass} rounded-md font-medium shadow-sm hover:shadow-md cursor-pointer transition-all leading-tight ${
        appointment.customerNotArrived ? 'opacity-75' : ''
      } appointment-mobile md:appointment-tablet`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        width: window.innerWidth <= 767 
          ? `calc(${appointment.dynamicWidth}% - 1px)` 
          : `calc(${appointment.dynamicWidth}% - 4px)`,
        left: window.innerWidth <= 767 
          ? `${appointment.dynamicLeft}%` 
          : `calc(${appointment.dynamicLeft}% + 16px)`,
        opacity: isDragging ? 0.6 : 1,
        zIndex: appointment.zIndex || (20 + (appointment.columnIndex || 0)),
        fontSize: window.innerWidth <= 767 ? '6px' : '12px',
        
        padding: window.innerWidth <= 767 ? '1px 2px' : '4px 10px',
        lineHeight: window.innerWidth <= 767 ? '1.1' : '1.3',
        overflow: 'hidden',
        wordWrap: 'break-word',
        boxSizing: 'border-box',
        
        border: window.innerWidth <= 767 ? '0.5px solid' : '1px solid',
      }}
    >
      {/* Müşteri gelmedi durumu için çarpı işareti */}
      {appointment.customerNotArrived && (
        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full flex items-center justify-center font-bold close-icon"
             style={{
               width: window.innerWidth <= 767 ? '8px' : '12px',
               height: window.innerWidth <= 767 ? '8px' : '12px',
               fontSize: window.innerWidth <= 767 ? '4px' : '6px',
             }}>
          ✕
        </div>
      )}
      
      <div className="font-semibold truncate customer-name"
           style={{
             fontSize: window.innerWidth <= 767 ? '8px' : '14px',
             marginBottom: '0px',
             lineHeight: window.innerWidth <= 767 ? '1.1' : '1.2',
             whiteSpace: 'nowrap',
             overflow: 'hidden',
             textOverflow: 'ellipsis',
           }}>
        {customerName}
      </div>
      
      {appointment.customerNotArrived && (
        <div className="text-red-700 not-arrived-text font-bold leading-tight"
             style={{
               fontSize: window.innerWidth <= 767 ? '7px' : '12px',
               lineHeight: '1.1',
               whiteSpace: 'nowrap',
               overflow: 'hidden',
               textOverflow: 'ellipsis',
             }}>
          MÜŞTERİ GELMEDİ
        </div>
      )}
      
      {/* Hizmet adını hem mobilde hem masaüstünde göster */}
      <div className="text-gray-700 service-name leading-tight truncate"
           style={{
             fontSize: window.innerWidth <= 767 ? '6px' : '12px',
             lineHeight: '1.1',
             marginBottom: '0px',
           }}>
        {serviceNames}
      </div>
      
      <div className="text-gray-600 time-info"
           style={{
             fontSize: window.innerWidth <= 767 ? '7px' : '10px',
             lineHeight: '1.1',
             marginTop: '1px',
             whiteSpace: 'nowrap',
             overflow: 'hidden',
             textOverflow: 'ellipsis',
           }}>
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
        // Pass the array of service IDs to handleDropAppointment
        onDropAppointment(item.id, employee._id, date, time, item.serviceIds || []);
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
      className={`border ${borderColor} ${backgroundColor} relative transition-colors duration-100`}
      style={{ boxSizing: 'border-box', height: '60px' }}
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
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

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
        
        // Mobil cihazlar için farklı genişlik hesaplaması
        const isMobile = window.innerWidth <= 767;
        let widthPerColumn, leftOffset;
        
        if (isMobile) {
          // Mobilde daha dar kolonlar ve daha az boşluk
          widthPerColumn = Math.max(85 / maxColumns, 25); // Minimum %25 genişlik
          leftOffset = (100 / maxColumns) * columnIndex + 2; // 2px offset
        } else {
          // Desktop için mevcut hesaplama
          widthPerColumn = (100 / maxColumns) * 0.8; // %80 genişlik kullan
          leftOffset = (100 / maxColumns) * columnIndex + ((100 / maxColumns) * 0.1); // Ortalamak için biraz sağa kaydır
        }

        column.forEach(appInColumn => {
          processedAppointments.push({
            ...appInColumn,
            dynamicWidth: widthPerColumn,
            dynamicLeft: leftOffset,
            zIndex: 20 + columnIndex,
            columnIndex: columnIndex,
            totalColumns: maxColumns,
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
    droppedServiceIds
  ) => {
    const appointmentToUpdate = allAppointments.find(app => app._id === appointmentId);

    if (!appointmentToUpdate) {
      toast.error('Randevu bulunamadı!');
      return;
    }

    console.log('Drop appointment with ID:', appointmentId);
    console.log('Dropped service IDs:', droppedServiceIds);
    console.log('Original appointment services:', appointmentToUpdate.services);

    // Daima orijinal randevudaki hizmetleri kullan
    // Sürükle-bırak işleminde sadece tarih, saat ve çalışan değişmeli, hizmetler değişmemeli
    const serviceIdsToUse = [];
    
    // Hizmet nesnelerinin yapısını kontrol et ve _id değerlerini doğru şekilde al
    if (appointmentToUpdate.services && appointmentToUpdate.services.length > 0) {
      appointmentToUpdate.services.forEach(service => {
        if (service._id) {
          // Doğrudan _id değeri varsa kullan
          serviceIdsToUse.push(service._id);
        } else if (service.name && services) {
          // _id yoksa, önce hizmet adı ve süresine göre eşleştirme yap
          let matchedService = services.find(s => 
            s.name === service.name && 
            (!service.duration || s.duration === service.duration)
          );
          
          // Eğer bulunamazsa, sadece hizmet adına göre eşleştirme yap (büyük/küçük harf duyarsız)
          if (!matchedService) {
            matchedService = services.find(s => 
              s.name.toLowerCase() === service.name.toLowerCase()
            );
          }
          
          // Hala bulunamazsa, hizmet adının bir kısmını içeren herhangi bir hizmeti bul
          if (!matchedService) {
            matchedService = services.find(s => 
              s.name.toLowerCase().includes(service.name.toLowerCase()) || 
              service.name.toLowerCase().includes(s.name.toLowerCase())
            );
          }
          if (matchedService && matchedService._id) {
            serviceIdsToUse.push(matchedService._id);
          }
        }
      });
    }

    if (!serviceIdsToUse || serviceIdsToUse.length === 0) {
      console.error("Hizmet ID'leri bulunamadı!", { 
        existingServices: appointmentToUpdate.services 
      });
      
      // Hizmet ID'leri bulunamazsa, ilk hizmeti varsayılan olarak kullan
      if (services && services.length > 0) {
        console.log('Varsayılan hizmet kullanılıyor:', services[0]);
        serviceIdsToUse.push(services[0]._id);
      } else {
        toast.error('Hizmet bilgisi eksik, güncellenemedi! Lütfen randevuyu düzenleme formundan güncelleyin.');
        return;
      }
    }

    // Find all selected services
    const selectedServices = services?.filter(s => serviceIdsToUse.includes(s._id));
    if (!selectedServices || selectedServices.length === 0) {
      toast.error("Hizmet bilgisi eksik, güncelleme başarısız!");
      return;
    }

    // Calculate total duration
    const totalDuration = selectedServices.reduce((sum, svc) => sum + (svc.duration || 30), 0);

    const updatedData = {
      employee: newEmployeeId,
      customer: typeof appointmentToUpdate.customer === 'object' 
        ? appointmentToUpdate.customer._id 
        : appointmentToUpdate.customer,
      date: newDate,
      time: newTime,
      notes: appointmentToUpdate.notes || '',
      duration: totalDuration,
      services: selectedServices.map(svc => ({
        _id: svc._id,
        name: svc.name,
        duration: svc.duration,
        price: svc.price,
      })),
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

  const handleCustomerNotArrived = async (appointmentId, status) => {
    try {
      const result = await dispatch(updateCustomerNotArrived({ 
        appointmentId, 
        customerNotArrived: status 
      }));
      
      if (updateCustomerNotArrived.fulfilled.match(result)) {
        toast.success(status ? 'Müşteri gelmedi olarak işaretlendi' : 'Müşteri geldi olarak işaretlendi');
        dispatch(fetchEmployees());
        
        // Eğer modal açıksa, seçili randevuyu güncelle
        if (selectedAppointment && selectedAppointment._id === appointmentId) {
          setSelectedAppointment(prev => ({
            ...prev,
            customerNotArrived: status
          }));
        }
      } else {
        toast.error(result.payload?.message || 'Durum güncellenemedi');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
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
          <div 
            className="grid border-b border-gray-200 relative z-20 bg-gray-50 sticky top-0 left-0 calendar-header-grid"
            style={{
              '--employee-count': employees.length,
              'grid-template-columns': `60px repeat(${employees.length}, minmax(120px, 1fr))`
            }}
          >
            <div className="py-2 px-1 sm:py-3 sm:px-2 border-r border-gray-200 font-semibold text-xs sm:text-sm text-gray-700 text-center time-column-sticky flex items-center justify-center">
              <span>Saat</span>
            </div>
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

          <div 
            className="relative grid calendar-body-grid"
            style={{
              '--employee-count': employees.length,
              'grid-template-columns': `60px repeat(${employees.length}, minmax(120px, 1fr))`
            }}
          >
            <div className="time-column-sticky bg-white" style={{ width: '60px' }}>
              {timeSlots.map((slot) => (
                <div 
                  key={slot} 
                  className="text-[10px] sm:text-xs text-gray-500 border-t border-gray-100 flex items-center justify-center pr-1 sm:pr-2 bg-white"
                  style={{ 
                    height: '60px',
                    lineHeight: '1.2',
                    padding: '0.25rem 0.25rem 0.25rem 0'
                  }}
                >
                  {(slot.endsWith(':00') || slot.endsWith(':30')) ? (
                    <span className="text-right w-full">{slot}</span>
                  ) : null}
                </div>
              ))}
            </div>

            {employees.map(emp => (
              <div 
                key={emp._id} 
                className="relative border-r border-gray-100 bg-white"
                style={{ 
                  minWidth: '120px',
                  width: '100%',
                  position: 'relative'
                }}
              >
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
                        setSelectedAppointment(appointment);
                        setShowAppointmentDetail(true);
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

        {/* Randevu Detay Modalı */}
        <Modal 
          open={showAppointmentDetail} 
          onClose={() => setShowAppointmentDetail(false)} 
          title="Randevu Detayları"
          size="md"
        >
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Durum Göstergesi */}
              {selectedAppointment.customerNotArrived && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Müşteri Gelmedi
                      </h3>
                      <div className="mt-1 text-sm text-red-700">
                        Bu randevuya müşteri gelmemiştir.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Müşteri:</h3>
                  <p>{selectedAppointment.customer?.name || 'Bilinmiyor'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Personel:</h3>
                  <p>{selectedAppointment.employee?.name || 'Bilinmiyor'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Tarih:</h3>
                  <p>{new Date(selectedAppointment.date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Saat:</h3>
                  <p>{selectedAppointment.time}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="font-semibold text-gray-700">Hizmetler:</h3>
                  <ul className="list-disc pl-5 mt-1">
                    {selectedAppointment.services?.map((service, index) => (
                      <li key={index}>
                        {service.name} - {service.duration} dk - {service.price} ₺
                      </li>
                    ))}
                  </ul>
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <h3 className="font-semibold text-gray-700">Notlar:</h3>
                    <p className="mt-1 bg-gray-50 p-2 rounded">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <button
                  onClick={() => handleCustomerNotArrived(selectedAppointment._id, !selectedAppointment.customerNotArrived)}
                  className={`px-4 py-2 rounded font-medium transition-colors ${
                    selectedAppointment.customerNotArrived
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {selectedAppointment.customerNotArrived ? 'Müşteri Geldi' : 'Müşteri Gelmedi'}
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAppointmentDetail(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Kapat
                  </button>
                  <button
                    onClick={() => {
                      setEditingAppointment(selectedAppointment);
                      setEditModalOpen(true);
                      setShowAppointmentDetail(false);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Randevuyu Düzenle
                  </button>
                </div>
              </div>
            </div>
          )}
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