import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Select from 'react-select';
import { FiUser, FiPackage, FiPlus, FiMinus, FiCalendar, FiDollarSign, FiFileText, FiUsers } from 'react-icons/fi';
import { addCustomer } from '../redux/customersSlice';
import { addPackage } from '../redux/packagesSlice';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import { toast } from 'react-toastify';

export default function PackageSaleForm({ onSubmit, onCancel, loading }) {
  const dispatch = useDispatch();
  const { items: customers } = useSelector(state => state.customers);
  const { items: packages } = useSelector(state => state.packages);
  const { items: services } = useSelector(state => state.services);
  const { items: users } = useSelector(state => state.users);

  const [formData, setFormData] = useState({
    customerId: '',
    packageId: '',
    sellerId: '',
    totalAmount: 0,
    discount: 0,
    finalAmount: 0,
    saleDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    isInstallment: false,
    installmentCount: 2, 
    notes: ''
  });

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [showNewPackage, setShowNewPackage] = useState(false);
  const [newPackageData, setNewPackageData] = useState({
    quantity: '',
    type: 'seans',
    service: '',
    price: ''
  });

  // Options for selects
  const customerOptions = customers.map(customer => ({
    value: customer._id,
    label: `${customer.name} - ${customer.phone}`
  }));

  const packageOptions = packages.map(pkg => ({
    value: pkg._id,
    label: `${pkg.quantity} ${pkg.type} - ${pkg.service?.name || 'Hizmet'} - ${pkg.price}₺`
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
      const totalAmount = selectedPackage.price;
      const finalAmount = totalAmount - formData.discount;
      
      setFormData(prev => ({
        ...prev,
        totalAmount,
        finalAmount: Math.max(0, finalAmount)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        totalAmount: 0,
        finalAmount: 0
      }));
    }
  }, [formData.packageId, formData.discount, packages]);

// In the handleSubmit function, update the saleData object:
const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!formData.customerId || !formData.packageId || !formData.sellerId) {
    toast.error('Lütfen tüm zorunlu alanları doldurunuz.');
    return;
  }

  const saleData = {
    customer: formData.customerId,
    package: formData.packageId,
    packageType: formData.packageId, // Add packageType with packageId value
    seller: formData.sellerId,
    totalAmount: formData.totalAmount,
    discount: formData.discount,
    finalAmount: formData.finalAmount,
    saleDate: formData.saleDate,
    paymentMethod: formData.paymentMethod,
    isInstallment: formData.isInstallment,
    // Ensure installmentCount is at least 1
    installmentCount: formData.isInstallment ? Math.max(1, formData.installmentCount) : 1,
    notes: formData.notes
  };

  console.log('Sending package sale data:', saleData); // For debugging
  onSubmit(saleData);
};

  const handleAddNewPackage = async () => {
    try {
      const packageData = {
        quantity: parseInt(newPackageData.quantity),
        type: newPackageData.type,
        service: newPackageData.service,
        price: parseFloat(newPackageData.price)
      };

      await dispatch(addPackage(packageData)).unwrap();
      
      // Formu sıfırla
      setNewPackageData({
        quantity: '',
        type: 'seans',
        service: '',
        price: ''
      });
      
      setShowNewPackage(false);
      toast.success('Paket başarıyla oluşturuldu!');
    } catch (error) {
      toast.error(error || 'Paket oluşturulurken bir hata oluştu');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Müşteri Seçimi */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiUser className="inline mr-1" /> Müşteri <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <Select
              className="flex-1"
              options={customerOptions}
              value={customerOptions.find(option => option.value === formData.customerId) || null}
              onChange={(selected) => setFormData({...formData, customerId: selected?.value || ''})}
              placeholder="Müşteri seçiniz..."
              isClearable
              isSearchable
            />
            <button
              type="button"
              onClick={() => setShowNewCustomer(true)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Paket Seçimi */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiPackage className="inline mr-1" /> Paket <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-2">
            <Select
              className="flex-1"
              options={packageOptions}
              value={packageOptions.find(option => option.value === formData.packageId) || null}
              onChange={(selected) => setFormData({...formData, packageId: selected?.value || ''})}
              placeholder="Paket seçiniz..."
              isClearable
              isSearchable
            />
            <button
              type="button"
              onClick={() => setShowNewPackage(true)}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              <FiPlus />
            </button>
          </div>
        </div>

        {/* Satış Tarihi */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiCalendar className="inline mr-1" /> Satış Tarihi
          </label>
          <input
            type="date"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.saleDate}
            onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
          />
        </div>

        {/* Satışı Yapan Çalışan */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiUsers className="inline mr-1" /> Satışı Yapan <span className="text-red-500">*</span>
          </label>
          <Select
            options={employeeOptions}
            value={employeeOptions.find(option => option.value === formData.sellerId) || null}
            onChange={(selected) => setFormData({...formData, sellerId: selected?.value || ''})}
            placeholder="Çalışan seçiniz..."
            isClearable
            isSearchable
          />
        </div>

        {/* Ödeme Yöntemi */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiDollarSign className="inline mr-1" /> Ödeme Yöntemi
          </label>
          <select
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.paymentMethod}
            onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
          >
            <option value="cash">Nakit</option>
            <option value="credit_card">Kredi Kartı</option>
            <option value="bank_transfer">Havale/EFT</option>
          </select>
        </div>

        {/* Taksitli Ödeme */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isInstallment"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.isInstallment}
              onChange={(e) => setFormData({...formData, isInstallment: e.target.checked})}
            />
            <label htmlFor="isInstallment" className="ml-2 block text-sm text-gray-700">
              Taksitli Ödeme
            </label>
          </div>
          
          {formData.isInstallment && (
            <div className="mt-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Taksit Sayısı</label>
              <input
                type="number"
                min="2"
                max="12"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={formData.installmentCount}
                onChange={(e) => setFormData({...formData, installmentCount: parseInt(e.target.value) || 2})}
              />
            </div>
          )}
        </div>

        {/* İndirim */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiDollarSign className="inline mr-1" /> İndirim (₺)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.discount}
            onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
          />
        </div>

        {/* Notlar */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            <FiFileText className="inline mr-1" /> Notlar
          </label>
          <textarea
            rows="3"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
          />
        </div>
      </div>

      {/* Özet */}
      <div className="bg-gray-50 p-4 rounded-md mt-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-600">Toplam Tutar:</div>
          <div className="text-right font-medium">{formData.totalAmount.toFixed(2)} ₺</div>
          
          <div className="text-sm text-gray-600">İndirim:</div>
          <div className="text-right font-medium text-red-600">-{formData.discount.toFixed(2)} ₺</div>
          
          <div className="text-sm font-semibold">Net Tutar:</div>
          <div className="text-right font-bold text-lg">{formData.finalAmount.toFixed(2)} ₺</div>
          
          {formData.isInstallment && (
            <>
              <div className="text-sm text-gray-600">Taksit Tutarı:</div>
              <div className="text-right font-medium">
                {(formData.finalAmount / formData.installmentCount).toFixed(2)} ₺ x {formData.installmentCount} taksit
              </div>
            </>
          )}
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>

      {/* Yeni Müşteri Modalı */}
      <Modal isOpen={showNewCustomer} onClose={() => setShowNewCustomer(false)} title="Yeni Müşteri Ekle">
        <CustomerForm
          onSubmit={(newCustomer) => {
            dispatch(addCustomer(newCustomer));
            setShowNewCustomer(false);
            toast.success('Müşteri başarıyla eklendi!');
          }}
          onCancel={() => setShowNewCustomer(false)}
        />
      </Modal>

      {/* Yeni Paket Modalı */}
      <Modal isOpen={showNewPackage} onClose={() => setShowNewPackage(false)} title="Yeni Paket Ekle">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Hizmet</label>
            <Select
              options={serviceOptions}
              value={serviceOptions.find(option => option.value === newPackageData.service) || null}
              onChange={(selected) => setNewPackageData({...newPackageData, service: selected?.value || ''})}
              placeholder="Hizmet seçiniz..."
              isClearable
              isSearchable
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Adet/Seans</label>
            <input
              type="number"
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newPackageData.quantity}
              onChange={(e) => setNewPackageData({...newPackageData, quantity: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Tür</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newPackageData.type}
              onChange={(e) => setNewPackageData({...newPackageData, type: e.target.value})}
            >
              <option value="seans">Seans</option>
              <option value="aylik">Aylık</option>
              <option value="yillik">Yıllık</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Fiyat (₺)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newPackageData.price}
              onChange={(e) => setNewPackageData({...newPackageData, price: e.target.value})}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowNewPackage(false)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleAddNewPackage}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}