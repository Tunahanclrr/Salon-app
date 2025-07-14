const { DateTime } = require('luxon');
const Appointment = require('../models/Appointmen');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');
const Service = require('../models/Services');

// Randevu oluştur
exports.createAppointment = async (req, res) => {
  try {
    const { employee, customer, customerId, date, time, services = [], notes, duration, force = false } = req.body;
    const customerFinal = customer || customerId;

    // Gerekli alan kontrolü
    if (!employee || !customerFinal || !date || !time || !services.length) {
      return res.status(400).json({
        message: 'Zorunlu alanlar: çalışan, müşteri, tarih, saat ve en az bir hizmet.'
      });
    }

    // Müşteri kontrolü
    const customerExists = await Customer.findById(customerFinal);
    if (!customerExists) {
      return res.status(400).json({ message: 'Müşteri bulunamadı.' });
    }

    // Hizmet kontrolü ve süre hesaplama
    const serviceIds = services.map(s => typeof s === 'string' ? s : s._id || s.serviceId).filter(Boolean);
    const foundServices = await Service.find({ _id: { $in: serviceIds } });

    if (foundServices.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Bazı hizmetler bulunamadı.' });
    }

    const totalDuration = foundServices.reduce((sum, svc) => sum + (svc.duration || 30), 0);
    const finalServices = foundServices.map(svc => ({
      _id: svc._id,
      name: svc.name,
      duration: svc.duration
    }));

    // Zaman hesaplama
    const start = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm');
    const end = start.plus({ minutes: totalDuration });

    // Çakışma kontrolü
    const existingAppointments = await Appointment.find({
      employee,
      date,
      status: { $ne: 'cancelled' }
    });

    const isConflict = existingAppointments.some(app => {
      const appStart = DateTime.fromFormat(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm');
      const appEnd = appStart.plus({ minutes: app.duration || 30 });
      return (start < appEnd) && (end > appStart);
    });

    // Burada çakışma var ve force yoksa hata dön
    if (isConflict && !force) {
      return res.status(400).json({
        message: 'Bu saat aralığında çalışanın başka bir randevusu var.',
        conflict: true
      });
    }

    // Çakışma olsa bile force varsa devam et
    const newAppointment = new Appointment({
      employee,
      customer: customerFinal,
      date,
      time,
      services: finalServices,
      duration: totalDuration,
      notes,
      status: 'pending'
    });

    await newAppointment.save();

    // Çalışan ve müşteri güncellemesi
    await Employee.findByIdAndUpdate(employee, {
      $push: { appointments: newAppointment._id }
    });
    await Customer.findByIdAndUpdate(customerFinal, {
      $push: { appointments: newAppointment._id }
    });

    const populated = await Appointment.findById(newAppointment._id)
      .populate('customer', 'name email phone')
      .populate('employee', 'name role');

    res.status(201).json({
      message: 'Randevu başarıyla oluşturuldu.',
      data: populated
    });

  } catch (error) {
    console.error('createAppointment error:', error);
    res.status(500).json({
      message: 'Randevu oluşturulurken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// Tüm randevuları getir
exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customer', 'name email phone')
      .populate('employee', 'name role')
      .sort({ date: -1, time: 1 });

    res.status(200).json({ appointments });
  } catch (error) {
    console.error('getAllAppointments error:', error);
    res.status(500).json({
      message: 'Randevular yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Randevu güncelle
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee, customer, date, time, services = [], notes, duration, force = false } = req.body;

    if (!employee || !customer || !date || !time || !services.length) {
      return res.status(400).json({
        message: 'Zorunlu alanlar: çalışan, müşteri, tarih, saat ve en az bir hizmet.'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }

    // Hizmetleri doğrula ve süre hesapla
    const serviceIds = services.map(s => s._id || s.serviceId).filter(Boolean);
    const foundServices = await Service.find({ _id: { $in: serviceIds } });

    if (foundServices.length !== serviceIds.length) {
      return res.status(400).json({ message: 'Bazı hizmetler bulunamadı.' });
    }

    const totalDuration = duration || foundServices.reduce((sum, svc) => sum + (svc.duration || 30), 0);
    const finalServices = foundServices.map(svc => ({
      _id: svc._id,
      name: svc.name,
      duration: svc.duration
    }));

    const start = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm');
    const end = start.plus({ minutes: totalDuration });

    // Çakışma kontrolü (güncellenen randevuyu hariç tut)
    const existingAppointments = await Appointment.find({
      employee,
      date,
      _id: { $ne: id },
      status: { $ne: 'cancelled' }
    });

    const isConflict = existingAppointments.some(app => {
      const appStart = DateTime.fromFormat(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm');
      const appEnd = appStart.plus({ minutes: app.duration || 30 });
      return (start < appEnd) && (end > appStart);
    });

    // ❗ force kontrolü burada yapılır
    if (isConflict && !force) {
      return res.status(400).json({
        message: 'Bu saat aralığında çalışanın başka bir randevusu var.',
        conflict: true
      });
    }

    const oldEmployeeId = appointment.employee.toString();

    // Randevuyu güncelle
    appointment.employee = employee;
    appointment.customer = customer;
    appointment.date = date;
    appointment.time = time;
    appointment.services = finalServices;
    appointment.notes = notes;
    appointment.duration = totalDuration;

    await appointment.save();

    // Eğer çalışan değiştiyse eski çalışandan çıkar, yeni çalışana ekle
    if (oldEmployeeId !== employee) {
      await Employee.findByIdAndUpdate(oldEmployeeId, {
        $pull: { appointments: appointment._id }
      });
      await Employee.findByIdAndUpdate(employee, {
        $addToSet: { appointments: appointment._id }
      });
    }

    // Müşteri ilişkisini de güncelle
    await Customer.findByIdAndUpdate(customer, {
      $addToSet: { appointments: appointment._id }
    });

    const populated = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('employee', 'name role');

    res.status(200).json({
      message: 'Randevu başarıyla güncellendi.',
      data: populated
    });

  } catch (error) {
    console.error('updateAppointment error:', error);
    res.status(500).json({
      message: 'Randevu güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Randevuyu sil
exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }

    await appointment.remove();

    // Çalışan ve müşteri ilişkilerini de güncelle
    await Employee.findByIdAndUpdate(appointment.employee, {
      $pull: { appointments: appointment._id }
    });
    await Customer.findByIdAndUpdate(appointment.customer, {
      $pull: { appointments: appointment._id }
    });

    res.status(200).json({ message: 'Randevu başarıyla silindi.' });
  } catch (error) {
    console.error('deleteAppointment error:', error);
    res.status(500).json({
      message: 'Randevu silinirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
