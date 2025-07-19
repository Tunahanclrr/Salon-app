import React from 'react';
import { FiX, FiCalendar, FiDollarSign, FiList, FiUser, FiFileText, FiCreditCard } from 'react-icons/fi';
import { useSelector } from 'react-redux';

export default function PackageDetailsModal({ packageSale, onClose, formatCurrency, getCustomerName, getEmployeeName }) {
  const { items: packages } = useSelector(state => state.packages);

  const getPackageName = (packageId) => {
    // Eğer packageId bir obje ise (populate edilmiş)
    if (typeof packageId === 'object' && packageId !== null) {
      return packageId.name || 'Bilinmeyen Paket';
    }
    // Eğer packageId bir string ise (id referansı)
    const packageItem = packages.find(p => p._id === packageId);
    return packageItem ? packageItem.name : 'Bilinmeyen Paket';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Paket Detayları</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200 divide-y divide-gray-200">
              {/* Temel Bilgiler */}
              <div className="p-4 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">Temel Bilgiler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Müşteri</p>
                    <p className="font-medium">{getCustomerName(packageSale.customer)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Satış Yapan</p>
                    <p className="font-medium">{getEmployeeName(packageSale.seller)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paket Türü</p>
                    <p className="font-medium">{getPackageName(packageSale.packageType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Satış Tarihi</p>
                    <p className="font-medium flex items-center gap-1">
                      <FiCalendar className="text-gray-400" size={14} />
                      {formatDate(packageSale.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durum</p>
                    <p className="font-medium">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(packageSale.status)}`}>
                        {getStatusText(packageSale.status)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-1">
                  <FiDollarSign className="text-gray-500" size={16} />
                  Ödeme Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Toplam Tutar</p>
                    <p className="font-medium text-gray-900 text-lg">{formatCurrency(packageSale.totalAmount)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Ödenen Tutar</p>
                    <p className="font-medium text-green-600 text-lg">{formatCurrency(packageSale.paidAmount)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Kalan Tutar</p>
                    <p className="font-medium text-red-600 text-lg">{formatCurrency(packageSale.remainingAmount)}</p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ödeme Yöntemi</p>
                    <p className="font-medium flex items-center gap-1">
                      <FiCreditCard className="text-gray-400" size={14} />
                      {packageSale.paymentMethod === 'cash' ? 'Nakit' : 
                       packageSale.paymentMethod === 'card' ? 'Kredi Kartı' : 
                       packageSale.paymentMethod === 'transfer' ? 'Havale/EFT' : 
                       packageSale.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Ödeme Planı</p>
                    <p className="font-medium">
                      {packageSale.isInstallment ? 
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Taksitli Ödeme</span> : 
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Tek Seferde Ödeme</span>}
                    </p>
                  </div>
                  {packageSale.isInstallment && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Taksit Sayısı</p>
                      <p className="font-medium">{packageSale.installmentCount} Taksit</p>
                    </div>
                  )}
                </div>
                
                {/* Ödeme Durumu Göstergesi */}
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Ödeme Durumu</p>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, (packageSale.paidAmount / packageSale.totalAmount) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {Math.round((packageSale.paidAmount / packageSale.totalAmount) * 100)}% Tamamlandı
                  </p>
                </div>
              </div>

              {/* Paket İçeriği kısmı kaldırıldı */}

              {/* Taksit Bilgileri */}
              {packageSale.isInstallment && packageSale.installments && packageSale.installments.length > 0 && (
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-1">
                    <FiDollarSign className="text-gray-500" size={16} />
                    Taksit Bilgileri
                  </h3>
                  
                  {/* Taksit Özeti */}
                  <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Toplam Taksit</p>
                      <p className="font-medium text-blue-700 text-lg">{packageSale.installments.length}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Ödenen Taksit</p>
                      <p className="font-medium text-green-700 text-lg">
                        {packageSale.installments.filter(i => i.isPaid).length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Kalan Taksit</p>
                      <p className="font-medium text-yellow-700 text-lg">
                        {packageSale.installments.filter(i => !i.isPaid).length}
                      </p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taksit No</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vade Tarihi</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme Tarihi</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme Yöntemi</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {packageSale.installments.map((installment, index) => (
                          <tr key={index} className={installment.isPaid ? 'bg-green-50' : ''}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(installment.amount)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-1">
                                <FiCalendar className="text-gray-400" size={14} />
                                {formatDate(installment.dueDate)}
                              </div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {installment.paidDate ? (
                                <div className="flex items-center gap-1">
                                  <FiCalendar className="text-green-500" size={14} />
                                  {formatDate(installment.paidDate)}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {installment.isPaid ? (
                                <div className="flex items-center gap-1">
                                  <FiCreditCard className="text-gray-400" size={14} />
                                  {installment.paymentMethod === 'cash' ? 'Nakit' : 
                                   installment.paymentMethod === 'card' ? 'Kredi Kartı' : 
                                   installment.paymentMethod === 'transfer' ? 'Havale/EFT' : 
                                   installment.paymentMethod}
                                </div>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${installment.isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {installment.isPaid ? 'Ödendi' : 'Bekliyor'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tahsilat Geçmişi */}
              {packageSale.payments && packageSale.payments.length > 0 && (
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-1">
                    <FiDollarSign className="text-gray-500" size={16} />
                    Tahsilat Geçmişi
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ödeme Yöntemi</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {packageSale.payments.map((payment, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.paymentDate)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payment.amount)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                              {payment.paymentMethod === 'cash' ? 'Nakit' : 
                               payment.paymentMethod === 'card' ? 'Kredi Kartı' : 
                               payment.paymentMethod === 'transfer' ? 'Havale/EFT' : 
                               payment.paymentMethod}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{payment.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notlar */}
              {packageSale.notes && (
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-1">
                    <FiFileText className="text-gray-500" size={16} />
                    Notlar
                  </h3>
                  <p className="text-sm text-gray-600">{packageSale.notes}</p>
                </div>
              )}


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}