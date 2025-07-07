const Customer = require('../models/Customer');
const Appointment = require('../models/Appointmen');

// ✅ Yeni müşteri ekleme
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, isRegular, notes } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'İsim ve telefon zorunludur.' });
    }

    // Aynı telefonla müşteri var mı?
    const existing = await Customer.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: 'Bu telefon numarası zaten kayıtlı.' });
    }

    const newCustomer = new Customer({ name, phone, email, isRegular, notes });
    await newCustomer.save();

    res.status(201).json({ message: 'Müşteri başarıyla eklendi.', data: newCustomer });
  } catch (error) {
    console.error('createCustomer error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ✅ Tüm müşterileri listeleme + arama
exports.getAllCustomers = async (req, res) => {
  try {
    const { q } = req.query;

    let query = {};
    if (q) {
      query.name = { $regex: q, $options: 'i' }; // isme göre filtreleme
    }

    const customers = await Customer.find(query);
    res.status(200).json(customers);
  } catch (error) {
    console.error('getAllCustomers error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};


// ✅ Müşteri silme (ID ile)
exports.deleteCustomer = async (req, res) => {
    try {
      const { id } = req.params;
  
      const deleted = await Customer.findByIdAndDelete(id);
  
      if (!deleted) {
        return res.status(404).json({ message: 'Müşteri bulunamadı.' });
      }
  
      res.status(200).json({ message: 'Müşteri başarıyla silindi.' });
    } catch (error) {
      console.error('deleteCustomer error:', error);
      res.status(500).json({ message: 'Sunucu hatası.' });
    }
  };

// Bir müşterinin randevularını döner
exports.getCustomerAppointments = async (req, res) => {
  try {
    const { id } = req.params;
    // Müşteri var mı kontrol et
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ message: 'Müşteri bulunamadı.' });
    }
    // Randevuları bul
    const appointments = await Appointment.find({ customer: id }).populate('employee', 'name');
    res.status(200).json({ customer, appointments });
  } catch (error) {
    console.error('getCustomerAppointments error:', error);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
  