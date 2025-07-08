const { DateTime } = require('luxon');
const Appointment = require('../models/Appointmen');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');
const Service = require('../models/Services');

// Randevu oluştur
exports.createAppointment = async (req, res) => {
  try {
    const { employee, customer, customerId, date, time, services = [], notes, duration } = req.body;
    const customerFinal = customer || customerId;

    // Gerekli alanlar
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

    if (isConflict) {
      return res.status(400).json({
        message: 'Bu saat aralığında çalışanın başka bir randevusu var.'
      });
    }

    // Yeni randevuyu oluştur
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

    // Çalışan ve müşteri randevu güncellemesi
    await Employee.findByIdAndUpdate(employee, {
      $push: { appointments: newAppointment._id }
    });
    await Customer.findByIdAndUpdate(customerFinal, {
      $push: { appointments: newAppointment._id }
    });

    // Populate ile geri döndür
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
