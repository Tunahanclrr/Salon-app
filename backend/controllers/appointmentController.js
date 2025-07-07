const { DateTime } = require('luxon');
// SADECE controller fonksiyonları burada olacak
const Appointment = require('../models/Appointmen');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');


exports.createAppointment = async (req, res) => {
  try {
    const { employee, customer, customerId, date, time, service, duration = 30 } = req.body;
    const customerFinal = customer || customerId;

    if (!employee || !customerFinal || !date || !time || !service) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
    }

    const customerExists = await Customer.findById(customerFinal);
    if (!customerExists) {
      return res.status(400).json({ message: 'Müşteri kayıtlı değil.' });
    }

    const start = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm');
    const end = start.plus({ minutes: duration });

    const appointments = await Appointment.find({ employee, date });
    const isConflict = appointments.some(app => {
      const appStart = DateTime.fromFormat(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm');
      const appEnd = appStart.plus({ minutes: app.duration || 30 });
      return (start < appEnd) && (end > appStart);
    });

    if (isConflict) {
      return res.status(400).json({ message: 'Bu saat aralığında çalışan zaten dolu.' });
    }

    const newAppointment = new Appointment({ employee, customer: customerFinal, date, time, service, duration });
    await newAppointment.save();

    await Employee.findByIdAndUpdate(employee, { $push: { appointments: newAppointment._id } });

    res.status(201).json({ message: 'Randevu başarıyla oluşturuldu.', data: newAppointment });
  } catch (error) {
    console.error('createAppointment error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('customer', 'name email phone')
      .populate('employee', 'name role');

    res.status(200).json({ appointments }); // dikkat: frontend buna göre bekliyor
  } catch (error) {
    console.error('getAllAppointments error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};