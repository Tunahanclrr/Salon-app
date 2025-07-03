const { DateTime } = require('luxon');
// SADECE controller fonksiyonları burada olacak
const Appointment = require('../models/Appointmen');
const Employee = require('../models/Employee');

exports.createAppointment = async (req, res) => {
  try {
    const { employee, customer, date, time, service, duration = 30 } = req.body;

    if (!employee || !customer || !date || !time || !service) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }

    // Müşteri var mı kontrol et
    const Customer = require('../models/Customer');
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(400).json({ message: 'Müşteri kayıtlı değil.' });
    }

    // Randevu başlangıç ve bitiş saatini hesapla
    const start = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm');
    const end = start.plus({ minutes: duration });

    // Aynı çalışanın, aynı gün, çakışan randevusu var mı kontrol et
    const appointments = await Appointment.find({ employee, date });
    const isConflict = appointments.some(app => {
      const appStart = DateTime.fromFormat(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm');
      const appEnd = appStart.plus({ minutes: app.duration || 30 });
      return (start < appEnd) && (end > appStart);
    });
    if (isConflict) {
      return res.status(400).json({ message: 'Bu saat aralığında çalışan zaten dolu.' });
    }

    // Randevuyu kaydet
    const newAppointment = new Appointment({ employee, customer, date, time, service, duration });
    await newAppointment.save();
    // Çalışanın appointments dizisine ekle
    await Employee.findByIdAndUpdate(employee, { $push: { appointments: newAppointment._id } });

    res.status(201).json({ message: 'Randevu başarıyla oluşturuldu.', data: newAppointment });
  } catch (error) {
    console.error('createAppointment error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json({ data: appointments });
  } catch (error) {
    console.error('getAllAppointments error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
