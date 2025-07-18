import React, { useState } from 'react';
import { FiDollarSign, FiX, FiCalendar, FiCreditCard, FiList } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function InstallmentPaymentForm({ packageSale, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0],
    installmentIndex: 0 // Varsayılan olarak ilk taksit
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Ödeme tutarını sayıya çevir
    const numericAmount = parseFloat(formData.amount);

    // Ödeme tutarı geçerli bir sayı değilse
     if (isNaN(numericAmount)) {
       toast.error('Lütfen geçerli bir ödeme tutarı girin');
       return;
     }

     // Ödeme tutarı 0 veya negatif olamaz
     if (numericAmount <= 0) {
       toast.error('Ödeme tutarı 0 veya negatif olamaz');
       return;
     }

     // Ödeme tutarı kalan bakiyeden büyük olamaz
     if (numericAmount > packageSale.remainingAmount) {
       toast.error('Ödeme tutarı kalan tutardan fazla olamaz');
       return;
     }

    onSubmit({
      ...formData,
      amount: numericAmount,
      date: formData.paymentDate || new Date().toISOString().split('T')[0],
      installmentIndex: parseInt(formData.installmentIndex, 10)
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getCustomerName = () => {
    return packageSale?.customer?.name || 'Bilinmeyen Müşteri';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Ödenmemiş taksitleri filtrele
  const unpaidInstallments = packageSale?.installments?.filter(inst => !inst.isPaid) || [];

  // Seçilen taksitin tutarını otomatik doldur
  const handleInstallmentChange = (e) => {
    const index = parseInt(e.target.value, 10);
    const selectedInstallment = packageSale?.installments?.[index];
    
    if (selectedInstallment) {
      setFormData(prev => ({
        ...prev,
        installmentIndex: index,
        amount: selectedInstallment.amount.toString()
      }));
    }
  };

  if (!packageSale) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Package Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-gray-900 mb-2">Paket Bilgileri</h3>
        <div className="space-y-1 text-sm text-gray-600">
          <div>Müşteri: <span className="font-medium text-gray-900">{getCustomerName()}</span></div>
          <div>Paket Türü: <span className="font-medium text-gray-900">{packageSale.packageType}</span></div>
          <div>Toplam Tutar: <span className="font-medium text-gray-900">{formatCurrency(packageSale.totalAmount)}</span></div>
          <div>Ödenen: <span className="font-medium text-green-600">{formatCurrency(packageSale.paidAmount)}</span></div>
          <div>Kalan: <span className="font-medium text-red-600">{formatCurrency(packageSale.remainingAmount)}</span></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Installment Selection */}
        {packageSale.installments && packageSale.installments.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiList className="inline mr-1" />
              Taksit Seçimi
            </label>
            <select
              value={formData.installmentIndex}
              onChange={handleInstallmentChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {packageSale.installments.map((installment, index) => (
                <option 
                  key={index} 
                  value={index}
                  disabled={installment.isPaid}
                >
                  {index + 1}. Taksit - {formatCurrency(installment.amount)} - 
                  {installment.isPaid 
                    ? `Ödendi (${formatDate(installment.paidDate)})` 
                    : `Vade: ${formatDate(installment.dueDate)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ödeme Tutarı (₺)
          </label>
          <input
            type="number"
            min="0"
            max={packageSale.remainingAmount}
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ödeme tutarını girin"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Maksimum: {formatCurrency(packageSale.remainingAmount)}
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiCreditCard className="inline mr-1" />
            Ödeme Yöntemi
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="cash">Nakit</option>
            <option value="card">Kredi Kartı</option>
            <option value="transfer">Havale/EFT</option>
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiCalendar className="inline mr-1" />
            Ödeme Tarihi
          </label>
          <input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Açıklama
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ödeme ile ilgili notlar..."
          />
        </div>

        {/* Quick Amount Buttons */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hızlı Tutar Seçimi
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, amount: (packageSale.remainingAmount / 4).toFixed(2) }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              1/4
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, amount: (packageSale.remainingAmount / 2).toFixed(2) }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              1/2
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, amount: packageSale.remainingAmount.toFixed(2) }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tümü
            </button>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            Ödemeyi Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}