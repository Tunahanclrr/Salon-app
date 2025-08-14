const { DateTime } = require('luxon');
const Appointment = require('../models/Appointmen');
const User = require('../models/User');
const Customer = require('../models/Customer');
const Service = require('../models/Services');
const CustomerPackage = require('../models/CustomerPackage');

// Randevu oluştur
exports.createAppointment = async (req, res) => {
  try {
    const { employee, customer, customerId, date, time, services = [], notes, duration, force = false, customerPackage } = req.body;
    const customerFinal = customer || customerId;

    // Admin değilse, her zaman giriş yapan kullanıcının id'sini kullan
    const isAdmin = req.user?.role === 'admin';
    const employeeFinal = isAdmin ? employee : req.user._id;

    // Gerekli alan kontrolü (admin değilse employee body’den zorunlu değil)
    if (!employeeFinal || !customerFinal || !date || !time || !services.length) {
      return res.status(400).json({
        message: 'Zorunlu alanlar: çalışan, müşteri, tarih, saat ve en az bir hizmet.'
      });
    }

    // Müşteri paketi kontrolü ve seans kullanma
    if (customerPackage) {
      const customerPackageDoc = await CustomerPackage.findById(customerPackage._id);
      if (!customerPackageDoc) {
        return res.status(400).json({ message: 'Müşteri paketi bulunamadı.' });
      }

      const sessionCount = customerPackage.sessionCount || 1;

      if (!customerPackageDoc.canUseSession(sessionCount)) {
        return res.status(400).json({ 
          message: `Bu paketin yeterli seansı yok. Kalan seans: ${customerPackageDoc.remainingQuantity}, İstenen: ${sessionCount}` 
        });
      }

      // Seans kullan
      await customerPackageDoc.useSession(sessionCount);
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

    const baseDuration = foundServices.reduce((sum, svc) => sum + (svc.duration || 30), 0);
    const sessionMultiplier = customerPackage?.sessionCount || 1;
    const totalDuration = duration || (baseDuration * sessionMultiplier);
    const finalServices = foundServices.map(svc => ({
      name: svc.name,
      duration: svc.duration,
      price: svc.price
    }));

    // Zaman hesaplama
    const start = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm');
    const end = start.plus({ minutes: totalDuration });

    // Çakışma kontrolü
    const existingAppointments = await Appointment.find({
      employee: employeeFinal,
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
      employee: employeeFinal,
      customer: customerFinal,
      date,
      time,
      services: finalServices,
      duration: totalDuration,
      notes,
      status: 'pending',
      customerPackage: customerPackage?._id || null,
      packageSessionCount: customerPackage?.sessionCount || 1
    });

    await newAppointment.save();

    // Kullanıcı ve müşteri güncellemesi
    await User.findByIdAndUpdate(employeeFinal, {
      $push: { appointments: newAppointment._id }
    });
    await Customer.findByIdAndUpdate(customerFinal, {
      $push: { appointments: newAppointment._id }
    });

    const populated = await Appointment.findById(newAppointment._id)
      .populate('customer', 'name email phone')
      .populate('employee', 'name job');

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
    console.log('🚀🚀🚀 getAllAppointments API ENDPOINT HIT! 🚀🚀🚀');
    console.log('📅 getAllAppointments called');
    console.log('👤 User:', req.user?.name, 'Role:', req.user?.role);
    console.log('🔍 Request headers:', req.headers);
    console.log('🔑 Authorization header:', req.headers.authorization);
    
    const isAdmin = req.user?.role === 'admin';
    let query = {};
    
    // Admin tüm randevuları görebilir, personel sadece kendi randevularını görebilir
    if (!isAdmin) {
      query = { employee: req.user._id };
      console.log('👤 Employee can only see their own appointments - User ID:', req.user._id);
    } else {
      console.log('👑 Admin can see all appointments - Role:', req.user?.role);
    }

    // Önce tüm randevuları kontrol et (debugging için)
    const allAppointments = await Appointment.find({})
      .populate('customer', 'name email phone')
      .populate('employee', 'name job')
      .sort({ date: -1, time: 1 });

    console.log('🔍 ALL APPOINTMENTS IN DB:', allAppointments.length);
    console.log('📋 All appointments:', allAppointments.map(app => ({
      id: app._id,
      date: app.date,
      time: app.time,
      employeeId: app.employee?._id || app.employee,
      employee: app.employee?.name || 'NO EMPLOYEE',
      customer: app.customer?.name || 'NO CUSTOMER',
      services: app.services?.length || 0
    })));

    const appointments = await Appointment.find(query)
      .populate('customer', 'name email phone')
      .populate('employee', 'name job')
      .sort({ date: -1, time: 1 });

    console.log('📊 Found appointments for query:', appointments.length);
    console.log('🔍 Query used:', query);
    console.log('📋 Filtered appointments data:', appointments.map(app => ({
      id: app._id,
      date: app.date,
      time: app.time,
      employeeId: app.employee?._id || app.employee,
      employee: app.employee?.name,
      customer: app.customer?.name,
      services: app.services?.length || 0
    })));

    // Employee populate edilemeyen appointment'ları kontrol et
    const appointmentsWithoutEmployee = appointments.filter(app => !app.employee);
    if (appointmentsWithoutEmployee.length > 0) {
      console.log('⚠️ Appointments without employee:', appointmentsWithoutEmployee.map(app => ({
        id: app._id,
        employeeField: app.employee,
        rawEmployeeField: app.toObject().employee
      })));
      
      // Null employee'li appointment'ları otomatik olarak düzelt
      for (const app of appointmentsWithoutEmployee) {
        console.log('🔧 Fixing appointment with null employee:', app._id);
        // İlk admin kullanıcıyı varsayılan employee olarak ata
        const adminUser = await User.findOne({ role: 'admin' });
        if (adminUser) {
          await Appointment.findByIdAndUpdate(app._id, { employee: adminUser._id });
          console.log('✅ Fixed appointment employee to:', adminUser.name);
        }
      }
      
      // Appointment'ları tekrar getir
      const fixedAppointments = await Appointment.find(query)
        .populate('customer', 'name email phone')
        .populate('employee', 'name job')
        .sort({ date: -1, time: 1 });
      
      console.log('🔄 Refetched appointments after fix:', fixedAppointments.length);
      
      res.status(200).json({ 
        success: true,
        data: { appointments: fixedAppointments } 
      });
      return;
    }

    res.status(200).json({ 
      success: true,
      data: { appointments } 
    });
  } catch (error) {
    console.error('getAllAppointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Randevular yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Tek randevu getir
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Getting appointment by ID:', id);
    
    const appointment = await Appointment.findById(id)
      .populate('customer', 'name email phone')
      .populate('employee', 'name job');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Randevu bulunamadı.'
      });
    }

    console.log('📋 Found appointment:', {
      id: appointment._id,
      date: appointment.date,
      time: appointment.time,
      services: appointment.services,
      employee: appointment.employee?.name,
      customer: appointment.customer?.name
    });

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('getAppointmentById error:', error);
    res.status(500).json({
      success: false,
      message: 'Randevu yüklenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Test randevuları oluştur (sadece development için)
exports.createTestAppointments = async (req, res) => {
  try {
    console.log('🧪 Creating test appointments for gizem user...');
    
    // Gizem kullanıcısını bul
    const gizemUser = await User.findOne({ name: 'gizem' });
    if (!gizemUser) {
      return res.status(404).json({ message: 'Gizem kullanıcısı bulunamadı' });
    }
    
    console.log('👤 Found gizem user:', gizemUser._id);
    
    // Test müşterileri bul veya oluştur
    let testCustomers = await Customer.find({}).limit(3);
    if (testCustomers.length === 0) {
      const customerData = [
        { name: 'Test Müşteri 1', phone: '555-0001', email: 'test1@example.com' },
        { name: 'Test Müşteri 2', phone: '555-0002', email: 'test2@example.com' },
        { name: 'Test Müşteri 3', phone: '555-0003', email: 'test3@example.com' }
      ];
      
      testCustomers = await Customer.insertMany(customerData);
      console.log('👥 Created test customers:', testCustomers.length);
    }
    
    // Test hizmetleri bul veya oluştur
    let testServices = await Service.find({}).limit(2);
    if (testServices.length === 0) {
      // Test hizmetleri oluştur
      const serviceData = [
        { name: 'Saç Kesimi', duration: 30, price: 100 },
        { name: 'Saç Boyama', duration: 60, price: 200 }
      ];
      
      testServices = await Service.insertMany(serviceData);
      console.log('💇 Created test services:', testServices.length);
    }
    
    // Bugünün tarihi
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    
    // Test randevuları oluştur
    const testAppointments = [
      {
        employee: gizemUser._id,
        customer: testCustomers[0]._id,
        date: todayStr,
        time: '10:00',
        services: [{
          _id: testServices[0]._id,
          name: testServices[0].name,
          duration: testServices[0].duration,
          price: testServices[0].price
        }],
        duration: 30,
        notes: 'Test randevusu 1',
        status: 'pending'
      },
      {
        employee: gizemUser._id,
        customer: testCustomers[1]._id,
        date: todayStr,
        time: '11:00',
        services: [{
          _id: testServices[1]._id,
          name: testServices[1].name,
          duration: testServices[1].duration,
          price: testServices[1].price
        }],
        duration: 60,
        notes: 'Test randevusu 2',
        status: 'pending'
      },
      {
        employee: gizemUser._id,
        customer: testCustomers[2]._id,
        date: todayStr,
        time: '14:30',
        services: [{
          _id: testServices[0]._id,
          name: testServices[0].name,
          duration: testServices[0].duration,
          price: testServices[0].price
        }],
        duration: 30,
        notes: 'Test randevusu 3',
        status: 'pending'
      }
    ];
    
    // Mevcut test randevularını sil
    await Appointment.deleteMany({ employee: gizemUser._id });
    console.log('🗑️ Deleted existing appointments for gizem');
    
    // Yeni test randevularını oluştur
    const createdAppointments = await Appointment.insertMany(testAppointments);
    console.log('✅ Created test appointments:', createdAppointments.length);
    
    // Kullanıcı ve müşteri ilişkilerini güncelle
    await User.findByIdAndUpdate(gizemUser._id, {
      $push: { appointments: { $each: createdAppointments.map(app => app._id) } }
    });
    
    for (let i = 0; i < testCustomers.length; i++) {
      await Customer.findByIdAndUpdate(testCustomers[i]._id, {
        $push: { appointments: createdAppointments[i]._id }
      });
    }
    
    console.log('🔗 Updated user and customer relationships');
    
    res.status(201).json({
      message: 'Test randevuları başarıyla oluşturuldu',
      data: {
        appointmentsCreated: createdAppointments.length,
        gizemUserId: gizemUser._id,
        appointments: createdAppointments
      }
    });
    
  } catch (error) {
    console.error('createTestAppointments error:', error);
    res.status(500).json({
      message: 'Test randevuları oluşturulurken hata oluştu',
      error: error.message
    });
  }
};
exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { employee, customer, date, time, services = [], notes, duration, force = false, customerPackage, packageSessionCount } = req.body;

    console.log('🔄 UPDATE APPOINTMENT REQUEST:');
    console.log('📋 ID:', id);
    console.log('📋 Request body:', req.body);
    console.log('📋 Employee:', employee);
    console.log('📋 Customer:', customer);
    console.log('📋 Date:', date);
    console.log('📋 Time:', time);
    console.log('📋 Services:', services);
    console.log('📋 Duration:', duration);
    console.log('📋 Force:', force);
    console.log('📋 Customer Package:', customerPackage);
    console.log('📋 Package Session Count:', packageSessionCount);

    // ESKİ: if (!employee || !customer || !date || !time || !services.length) {
    // YENİ: services boş olabilir; mevcut hizmetler kullanılacak branch var
    if (!employee || !customer || !date || !time) {
      console.log('❌ Missing required fields (services boş olabilir)');
      return res.status(400).json({
        message: 'Zorunlu alanlar: çalışan, müşteri, tarih ve saat.'
      });
    }

    const appointment = await Appointment.findById(id);
    
    if (!appointment) {
      console.log('❌ Appointment not found');
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }

    // Müşteri paketi kontrolü ve seans güncelleme
    if (customerPackage && packageSessionCount) {
      console.log('🔄 Package session update started');
      console.log('📦 Current appointment package:', appointment.customerPackage);
      console.log('📦 New package ID:', customerPackage._id);
      console.log('📦 Current session count:', appointment.packageSessionCount);
      console.log('📦 New session count:', packageSessionCount);

      // Eğer paket değişmediyse ve sadece seans sayısı değiştiyse
      if (appointment.customerPackage && 
          appointment.customerPackage.toString() === customerPackage._id.toString() && 
          appointment.packageSessionCount !== packageSessionCount) {
        
        console.log('📦 Same package, updating session count only');
        const customerPackageDoc = await CustomerPackage.findById(customerPackage._id);
        if (!customerPackageDoc) {
          console.log('❌ Customer package not found');
          return res.status(400).json({ message: 'Müşteri paketi bulunamadı.' });
        }

        console.log('📦 Package before update:', {
          totalQuantity: customerPackageDoc.totalQuantity,
          usedQuantity: customerPackageDoc.usedQuantity,
          remainingQuantity: customerPackageDoc.remainingQuantity,
          status: customerPackageDoc.status
        });

        // Eski seans sayısını geri ekle
        await customerPackageDoc.addSession(appointment.packageSessionCount);
        console.log('📦 After adding back old sessions:', {
          usedQuantity: customerPackageDoc.usedQuantity,
          remainingQuantity: customerPackageDoc.remainingQuantity
        });
        
        // Yeni seans sayısını kullanabilir mi kontrol et
        if (!customerPackageDoc.canUseSession(packageSessionCount)) {
          console.log('❌ Cannot use requested sessions');
          return res.status(400).json({ 
            message: `Bu paketin yeterli seansı yok. Kalan seans: ${customerPackageDoc.remainingQuantity}, İstenen: ${packageSessionCount}` 
          });
        }
        
        // Yeni seans sayısını kullan
        await customerPackageDoc.useSession(packageSessionCount);
        console.log('📦 After using new sessions:', {
          usedQuantity: customerPackageDoc.usedQuantity,
          remainingQuantity: customerPackageDoc.remainingQuantity
        });
        
        // Randevu paket bilgilerini güncelle
        appointment.packageSessionCount = packageSessionCount;
        console.log('✅ Package session count updated successfully');
      }
      // Eğer yeni bir paket seçildiyse
      else if (!appointment.customerPackage || 
               appointment.customerPackage.toString() !== customerPackage._id.toString()) {
        
        console.log('📦 Different package selected, switching packages');
        
        // Eski paketi kontrol et ve seansları geri ekle
        if (appointment.customerPackage) {
          const oldPackage = await CustomerPackage.findById(appointment.customerPackage);
          if (oldPackage) {
            await oldPackage.addSession(appointment.packageSessionCount || 1);
            console.log('📦 Returned sessions to old package');
          }
        }
        
        // Yeni paketi kontrol et
        const newPackage = await CustomerPackage.findById(customerPackage._id);
        if (!newPackage) {
          console.log('❌ New package not found');
          return res.status(400).json({ message: 'Müşteri paketi bulunamadı.' });
        }
        
        console.log('📦 New package before use:', {
          totalQuantity: newPackage.totalQuantity,
          usedQuantity: newPackage.usedQuantity,
          remainingQuantity: newPackage.remainingQuantity,
          status: newPackage.status
        });
        
        // Yeni paketten seans kullanabilir mi kontrol et
        if (!newPackage.canUseSession(packageSessionCount)) {
          console.log('❌ Cannot use sessions from new package');
          return res.status(400).json({ 
            message: `Bu paketin yeterli seansı yok. Kalan seans: ${newPackage.remainingQuantity}, İstenen: ${packageSessionCount}` 
          });
        }
        
        // Yeni paketten seans kullan
        await newPackage.useSession(packageSessionCount);
        console.log('📦 Used sessions from new package');
        
        // Randevu paket bilgilerini güncelle
        appointment.customerPackage = customerPackage._id;
        appointment.packageSessionCount = packageSessionCount;
        console.log('✅ Package switched successfully');
      }
    }
    console.log('📋 Found appointment:', {
      id: appointment._id,
      currentEmployee: appointment.employee,
      currentDate: appointment.date,
      currentTime: appointment.time,
      currentServices: appointment.services
    });

    // Hizmetleri doğrula ve süre hesapla
    let serviceIds = [];
    
    services.forEach(service => {
      if (typeof service === 'string') {
        serviceIds.push(service);
      } else if (service && (service._id || service.serviceId)) {
        serviceIds.push(service._id || service.serviceId);
      }
    });

    console.log('📋 Extracted service IDs:', serviceIds);

    if (serviceIds.length === 0) {
      const oldEmployeeId = appointment.employee?.toString();
    
      let computedDuration = duration;
      if (!computedDuration && Array.isArray(appointment.services) && appointment.services.length > 0) {
        computedDuration = appointment.services.reduce((sum, svc) => sum + (svc.duration || 30), 0);
      }
    
      // Eğer mevcut randevuda da hizmet yoksa, hizmet güncellemesine dokunmadan diğer alanları kaydedelim
      appointment.employee = employee;
      appointment.customer = customer;
      appointment.date = date;
      appointment.time = time;
      appointment.notes = notes;
      if (computedDuration) {
        appointment.duration = computedDuration;
      } else if (duration) {
        appointment.duration = duration;
      }
    
      await appointment.save();
    
      if (oldEmployeeId && oldEmployeeId !== String(employee)) {
        await User.findByIdAndUpdate(oldEmployeeId, { $pull: { appointments: appointment._id } });
        await User.findByIdAndUpdate(employee, { $addToSet: { appointments: appointment._id } });
      }
    
      await Customer.findByIdAndUpdate(customer, { $addToSet: { appointments: appointment._id } });
    
      const populated = await Appointment.findById(appointment._id)
        .populate('customer', 'name email phone')
        .populate('employee', 'name job');
    
      return res.status(200).json({
        message: 'Randevu başarıyla güncellendi.',
        data: populated
      });
    }

    // Mevcut kod devam ediyor...
    const foundServices = await Service.find({ _id: { $in: serviceIds } });
    console.log('📋 Found services from DB:', foundServices.map(s => ({ id: s._id, name: s.name, duration: s.duration })));

    if (foundServices.length !== serviceIds.length) {
      // Bazı hizmetler bulunamadı -> mevcut randevudaki hizmetleri koru
      if (appointment.services && appointment.services.length > 0) {
        // 1) Eski çalışan ID'sini set etmeden önce al
        const oldEmployeeId = appointment.employee?.toString();
    
        // 2) Duration sağlanmadıysa mevcut servislerden hesapla
        let computedDuration = duration;
        if (!computedDuration && Array.isArray(appointment.services) && appointment.services.length > 0) {
          const baseDuration = appointment.services.reduce((sum, svc) => sum + (svc.duration || 30), 0);
          const sessionMultiplier = packageSessionCount || appointment.packageSessionCount || 1;
          computedDuration = baseDuration * sessionMultiplier;
        }
    
        appointment.employee = employee;
        appointment.customer = customer;
        appointment.date = date;
        appointment.time = time;
        appointment.notes = notes;
        appointment.duration = computedDuration || appointment.duration;

        await appointment.save();

        // 3) Çalışan ilişkilerini güncelle
        if (oldEmployeeId && oldEmployeeId !== String(employee)) {
          await User.findByIdAndUpdate(oldEmployeeId, { $pull: { appointments: appointment._id } });
          await User.findByIdAndUpdate(employee, { $addToSet: { appointments: appointment._id } });
        }

        // 4) Müşteri ilişkisini güncelle
        await Customer.findByIdAndUpdate(customer, { $addToSet: { appointments: appointment._id } });

        const populated = await Appointment.findById(appointment._id)
          .populate('customer', 'name email phone')
          .populate('employee', 'name job');

        return res.status(200).json({
          message: 'Randevu başarıyla güncellendi (mevcut hizmetler kullanıldı).',
          data: populated
        });
      } else {
        console.log('❌ Some services not found in DB and no existing services');
        return res.status(400).json({ message: 'Bazı hizmetler bulunamadı.' });
      }
    }

    // Mevcut kod devam ediyor...
    const totalDuration = duration || foundServices.reduce((sum, svc) => sum + (svc.duration || 30), 0);
    const finalServices = foundServices.map(svc => ({
      name: svc.name,
      duration: svc.duration,
      price: svc.price
    }));

    console.log('📋 Final services to save:', finalServices);
    console.log('📋 Total duration:', totalDuration);

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

    if (isConflict && !force) {
      console.log('⚠️ Conflict detected');
      return res.status(400).json({
        message: 'Bu saat aralığında çalışanın başka bir randevusu var.',
        conflict: true
      });
    }

    // Eski çalışanın ID'sini, güncellemeden ÖNCE al
    const oldEmployeeId = appointment.employee?.toString();

    // Randevuyu güncelle
    appointment.employee = employee;
    appointment.customer = customer;
    appointment.date = date;
    appointment.time = time;
    appointment.services = finalServices;
    appointment.notes = notes;
    appointment.duration = totalDuration;

    await appointment.save();

    // Çalışan ilişkilerini güncelle
    if (oldEmployeeId && oldEmployeeId !== String(employee)) {
      await User.findByIdAndUpdate(oldEmployeeId, { $pull: { appointments: appointment._id } });
      await User.findByIdAndUpdate(employee, { $addToSet: { appointments: appointment._id } });
    }

    // Müşteri ilişkisini güncelle
    await Customer.findByIdAndUpdate(customer, { $addToSet: { appointments: appointment._id } });

    const populated = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('employee', 'name job');

    return res.status(200).json({
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

    // Kullanıcı ve müşteri ilişkilerini de güncelle
    await User.findByIdAndUpdate(appointment.employee, {
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

// Müşteri gelmedi durumunu güncelle
exports.updateCustomerNotArrived = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerNotArrived } = req.body;
    
    if (customerNotArrived === undefined) {
      return res.status(400).json({ message: 'customerNotArrived alanı gereklidir.' });
    }
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: 'Randevu bulunamadı.' });
    }
    
    appointment.customerNotArrived = customerNotArrived;
    await appointment.save();
    
    const populated = await Appointment.findById(appointment._id)
      .populate('customer', 'name email phone')
      .populate('employee', 'name job');
    
    res.status(200).json({
      message: 'Müşteri gelmedi durumu güncellendi.',
      data: populated
    });
  } catch (error) {
    console.error('updateCustomerNotArrived error:', error);
    res.status(500).json({
      message: 'Müşteri gelmedi durumu güncellenirken bir hata oluştu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};