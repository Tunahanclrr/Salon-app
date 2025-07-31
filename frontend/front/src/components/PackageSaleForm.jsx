import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { FiUser, FiPackage, FiPlus, FiMinus, FiCalendar, FiDollarSign, FiFileText, FiUsers } from 'react-icons/fi';
import { addCustomer } from '../redux/customersSlice';
import { addPackage } from '../redux/packagesSlice';
import Modal from './Modal';
import CustomerForm from './CustomerForm';

export default function PackageSaleForm({ onSubmit, onCancel, loading }) {
  const dispatch = useDispatch();
  const { items: customers } = useSelector(state => state.customers);
  const { items: packages } = useSelector(state => state.packages);
  const { items: services } = useSelector(state => state.services);
  const { items: users } = useSelector(state => state.users);

  const [formData, setFormData] = useState({
    customerId: '',
    packageId: '',
    sellerId: '', // Çalışan ID'si
    services: [{ service: '', quantity: 1, unitPrice: 0 }],
    totalAmount: 0,
    discount: 0,
    finalAmount: 0,
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash', // nakit, kart, havale
    isInstallment: false,
    installmentCount: 2,
    notes: ''
  });

  const [installmentDates, setInstallmentDates] = useState([]);
  const [showNewPackage, setShowNewPackage] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newPackageData, setNewPackageData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    services: []
  });

  // Options for selects
  const customerOptions = customers.map(customer => ({
    value: customer._id,
    label: `${customer.name} - ${customer.phone}`
  }));

  const packageOptions = packages.map(pkg => ({
    value: pkg._id,
    label: `${pkg.name} - ${pkg.price}₺`
  }));

  const serviceOptions = services.map(service => ({
    value: service._id,
    label: `${service.name} - ${service.price}₺`
  }));

  const employeeOptions = users.filter(user => user.role === 'employee' || user.role === 'admin').map(employee => ({
    value: employee._id,
    label: `${employee.name} - ${employee.job || employee.role}`
  }));

  // Calculate total amount
  useEffect(() => {
    const selectedPackage = packages.find(pkg => pkg._id === formData.packageId);
    
    if (selectedPackage) {
      // Paket seçilmişse: Paket fiyatı + sadece ek hizmetler
      const packagePrice = selectedPackage.price;
      
      // Sadece ek hizmetleri hesapla (paket hizmetleri değil)
      const additionalServicesTotal = formData.services.reduce((total, service) => {
        if (service.service && service.service !== '' && !service.isPackageService) {
          return total + (service.quantity * service.unitPrice);
        }
        return total;
      }, 0);
      
      const totalAmount = packagePrice + additionalServicesTotal;
      const finalAmount = totalAmount - formData.discount;
      
      setFormData(prev => ({
        ...prev,
        totalAmount,
        finalAmount: Math.max(0, finalAmount)
      }));
    } else {
      // Paket seçilmemişse: Sadece hizmet fiyatları
      const servicesTotal = formData.services.reduce((total, service) => {
        if (service.service && service.service !== '') {
          return total + (service.quantity * service.unitPrice);
        }
        return total;
      }, 0);
      
      const finalAmount = servicesTotal - formData.discount;
      
      setFormData(prev => ({
        ...prev,
        totalAmount: servicesTotal,
        finalAmount: Math.max(0, finalAmount)
      }));
    }
  }, [formData.services, formData.packageId, formData.discount, packages]);

  // Update installment dates when installment settings change
  useEffect(() => {
    if (formData.isInstallment) {
      const dates = [];
      const startDate = new Date(formData.saleDate);
      
      for (let i = 0; i < formData.installmentCount; i++) {
        const installmentDate = new Date(startDate);
        installmentDate.setMonth(startDate.getMonth() + i);
        dates.push(installmentDate.toISOString().split('T')[0]);
      }
      
      setInstallmentDates(dates);
    }
  }, [formData.isInstallment, formData.installmentCount, formData.saleDate]);

  // Load services when package is selected
  useEffect(() => {
    // Paket seçildiğinde sadece boş hizmet alanı göster
    setFormData(prev => ({
      ...prev,
      services: [{ service: '', quantity: 1, unitPrice: 0, isPackageService: false }]
    }));
  }, [formData.packageId]);

  const handleCustomerChange = (option) => {
    setFormData({ ...formData, customerId: option ? option.value : '' });
  };

  const handlePackageChange = (option) => {
    setFormData({ ...formData, packageId: option ? option.value : '' });
  };

  const handleEmployeeChange = (option) => {
    setFormData({ ...formData, sellerId: option ? option.value : '' });
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...formData.services];
    
    if (field === 'service') {
      const selectedService = services.find(s => s._id === value);
      updatedServices[index] = {
        ...updatedServices[index],
        service: value || '',
        unitPrice: selectedService ? selectedService.price : 0
      };
    } else if (field === 'quantity') {
      updatedServices[index][field] = value || 1;
    } else {
      updatedServices[index][field] = value;
    }
    setFormData({ ...formData, services: updatedServices });
  };

  const addService = () => {
    setFormData({
      ...formData,
      services: [...formData.services, { service: '', quantity: 1, unitPrice: 0, isPackageService: false }]
    });
  };

  const removeService = (index) => {
    // En az bir hizmet kalmalı
    if (formData.services.length <= 1) {
      return;
    }
    
    const updatedServices = formData.services.filter((_, i) => i !== index);
    setFormData({ ...formData, services: updatedServices });
  };

  const handleInstallmentToggle = (e) => {
    setFormData({ ...formData, isInstallment: e.target.checked });
  };

  const handleInstallmentCountChange = (e) => {
    setFormData({ ...formData, installmentCount: parseInt(e.target.value) });
  };

  const handleInstallmentDateChange = (index, date) => {
    const updatedDates = [...installmentDates];
    updatedDates[index] = date;
    setInstallmentDates(updatedDates);
  };

  const handleNewCustomerSubmit = async (customerData) => {
    try {
      const resultAction = await dispatch(addCustomer(customerData));
      if (addCustomer.fulfilled.match(resultAction)) {
        const newCustomer = resultAction.payload;
        setFormData({ ...formData, customerId: newCustomer._id });
        setShowNewCustomer(false);
      }
    } catch (error) {
      console.error('Müşteri eklenirken hata:', error);
    }
  };

  const handleNewPackageSubmit = async (e) => {
    e.preventDefault();
    try {
      // Backend'in beklediği format: services array'i { service: id, quantity: 1 } formatında olmalı
      const packageData = {
        ...newPackageData,
        services: newPackageData.services.map(serviceId => ({
          service: serviceId,
          quantity: 1
        }))
      };
      
      const resultAction = await dispatch(addPackage(packageData));
      if (addPackage.fulfilled.match(resultAction)) {
        const newPackage = resultAction.payload.data;
        setFormData({ ...formData, packageId: newPackage._id });
        setShowNewPackage(false);
        setNewPackageData({ name: '', description: '', price: '', duration: '', services: [] });
      }
    } catch (error) {
      console.error('Paket eklenirken hata:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Backend'in beklediği formatta veri hazırla
    const packageSaleData = {
      customer: formData.customerId, // customerId -> customer
      seller: formData.sellerId, // sellerId -> seller
      services: formData.services.filter(service => service.service && service.service !== ''),
      packageType: formData.packageId, // Paket ID'si
      paymentMethod: formData.paymentMethod,
      isInstallment: formData.isInstallment,
      installmentCount: formData.installmentCount,
      installmentDates: formData.isInstallment ? installmentDates : [],
      notes: formData.notes,
      paidAmount: 0, // İlk ödeme tutarı
      totalAmount: formData.finalAmount
    };

    console.log('Gönderilen veri:', packageSaleData); // Debug için
    onSubmit(packageSaleData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiUser className="inline mr-1" />
            Müşteri Seçimi
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={customerOptions.find(option => option.value === formData.customerId)}
                onChange={handleCustomerChange}
                options={customerOptions}
                placeholder="Müşteri seçin..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowNewCustomer(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Yeni Müşteri
            </button>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiUsers className="inline mr-1" />
            Çalışan Seçimi
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={employeeOptions.find(option => option.value === formData.sellerId)}
                onChange={handleEmployeeChange}
                options={employeeOptions}
                placeholder="Çalışan seçin..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
          </div>
        </div>

        {/* Package Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiPackage className="inline mr-1" />
            Paket Seçimi
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Select
                value={packageOptions.find(option => option.value === formData.packageId)}
                onChange={handlePackageChange}
                options={packageOptions}
                placeholder="Paket seçin..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowNewPackage(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Paket
            </button>
          </div>
        </div>

        {/* Services */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <label className="text-sm font-medium text-gray-700">
              Ek Hizmetler (Opsiyonel)
            </label>
            <button
              type="button"
              onClick={addService}
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FiPlus size={16} />
              Hizmet Ekle
            </button>
          </div>
          
          {formData.services.map((service, index) => (
            <div key={index} className="mb-3">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Hizmet</label>
                  <Select
                    value={serviceOptions.find(option => option.value === service.service)}
                    onChange={(option) => handleServiceChange(index, 'service', option ? option.value : '')}
                    options={serviceOptions}
                    placeholder="Hizmet seçin..."
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-gray-600 mb-1">Adet</label>
                  <input
                    type="number"
                    min="1"
                    value={service.quantity}
                    onChange={(e) => handleServiceChange(index, 'quantity', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs text-gray-600 mb-1">Birim Fiyat</label>
                  <input
                    type="text"
                    value={`${service.unitPrice || 0} ₺`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    readOnly
                  />
                </div>
                {formData.services.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiMinus size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            <FiDollarSign className="inline mr-1" />
            Fiyatlandırma
          </h3>
          
          {/* Price Breakdown */}
          {formData.packageId && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Fiyat Detayı</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Paket Fiyatı:</span>
                  <span className="font-medium text-blue-800">
                    {packages.find(pkg => pkg._id === formData.packageId)?.price || 0} ₺
                  </span>
                </div>
                {formData.services.some(s => s.service && s.service !== '') && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Ek Hizmetler:</span>
                    <span className="font-medium text-blue-800">
                      {formData.services.reduce((total, service) => {
                        if (service.service && service.service !== '') {
                          return total + (service.quantity * service.unitPrice);
                        }
                        return total;
                      }, 0)} ₺
                    </span>
                  </div>
                )}
                <div className="border-t border-blue-300 pt-1 flex justify-between font-medium">
                  <span className="text-blue-700">Ara Toplam:</span>
                  <span className="text-blue-800">{formData.totalAmount} ₺</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Satış Tarihi</label>
              <input
                type="date"
                value={formData.saleDate}
                onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ödeme Yöntemi</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Nakit</option>
                <option value="card">Kart</option>
                <option value="transfer">Havale/EFT</option>
                <option value="check">Çek</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">İndirim (₺)</label>
              <input
                type="number"
                min="0"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Toplam Tutar</label>
              <input
                type="text"
                value={`${formData.finalAmount.toFixed(2)} ₺`}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Installment Plan */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="installment"
              checked={formData.isInstallment}
              onChange={handleInstallmentToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="installment" className="text-sm font-medium text-gray-700">
              Taksitli Ödeme
            </label>
          </div>

          {formData.isInstallment && (
            <div className="space-y-4">
              <div className="w-32">
                <label className="block text-xs text-gray-600 mb-1">Taksit Sayısı</label>
                <select
                  value={formData.installmentCount}
                  onChange={handleInstallmentCountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(count => (
                    <option key={count} value={count}>{count} Taksit</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {installmentDates.map((date, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-600 mb-1">
                      {index + 1}. Taksit Tarihi
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => handleInstallmentDateChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiFileText className="inline mr-1" />
            Notlar
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ek notlar..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Paket Satışını Kaydet'}
          </button>
        </div>
      </form>

      {/* New Customer Modal */}
      <Modal open={showNewCustomer} onClose={() => setShowNewCustomer(false)} title="Yeni Müşteri Ekle">
        <CustomerForm
          onSubmit={handleNewCustomerSubmit}
          onCancel={() => setShowNewCustomer(false)}
        />
      </Modal>

      {/* New Package Modal */}
      <Modal open={showNewPackage} onClose={() => setShowNewPackage(false)} title="Yeni Paket Ekle">
        <form onSubmit={handleNewPackageSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paket Adı</label>
            <input
              type="text"
              value={newPackageData.name}
              onChange={(e) => setNewPackageData({ ...newPackageData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={newPackageData.description}
              onChange={(e) => setNewPackageData({ ...newPackageData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺)</label>
              <input
                type="number"
                value={newPackageData.price}
                onChange={(e) => setNewPackageData({ ...newPackageData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Süre (gün)</label>
              <input
                type="number"
                value={newPackageData.duration}
                onChange={(e) => setNewPackageData({ ...newPackageData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          {/* Package Services Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paket Hizmetleri</label>
            <Select
              isMulti
              value={serviceOptions.filter(option => newPackageData.services.includes(option.value))}
              onChange={(selectedOptions) => {
                const selectedServices = selectedOptions ? selectedOptions.map(option => option.value) : [];
                setNewPackageData({ ...newPackageData, services: selectedServices });
              }}
              options={serviceOptions}
              placeholder="Hizmetleri seçin..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
            <p className="text-xs text-gray-500 mt-1">Bu pakete dahil edilecek hizmetleri seçin</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowNewPackage(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Paket Ekle
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}