import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiEdit, FiDollarSign, FiPackage, FiCalendar, FiUser, FiInfo } from 'react-icons/fi';
import { fetchPackageSales, addPackageSale, addInstallmentPayment } from '../redux/packageSalesSlice';
import { fetchPackages } from '../redux/packagesSlice';
import { fetchCustomers } from '../redux/customersSlice';
import { fetchUsers } from '../redux/usersSlice';
import { fetchServices } from '../redux/servicesSlice';
import Modal from '../components/Modal';
import PackageSaleForm from '../components/PackageSaleForm';
import InstallmentPaymentForm from '../components/InstallmentPaymentForm';
import PackageDetailsModal from '../components/PackageDetailsModal';
import { toast } from 'react-toastify';

export default function PackageSales() {
  const dispatch = useDispatch();
  const { items: packageSales, status, loading } = useSelector(state => state.packageSales);
  const { items: customers } = useSelector(state => state.customers);
  const { items: users } = useSelector(state => state.users);
  const { items: packages } = useSelector(state => state.packages);
  const { items: services } = useSelector(state => state.services);
  
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed, expired

  useEffect(() => {
    dispatch(fetchPackageSales());
    dispatch(fetchCustomers());
    dispatch(fetchUsers());
    dispatch(fetchServices());
    dispatch(fetchPackages());
  }, [dispatch]);

  const handleAddPackageSale = (packageSaleData) => {
    // Loading durumunu göster
    dispatch(addPackageSale(packageSaleData))
      .then((resultAction) => {
        if (addPackageSale.fulfilled.match(resultAction)) {
          toast.success('Paket satışı başarıyla eklendi!');
          setAddModalOpen(false);
          // Paket satışlarını yeniden yükle
          dispatch(fetchPackageSales());
        } else if (addPackageSale.rejected.match(resultAction)) {
          const errorMessage = resultAction.payload || resultAction.error.message;
          console.error('Paket satışı eklenirken hata:', errorMessage);
          toast.error(errorMessage || 'Paket satışı eklenirken hata oluştu');
        }
      })
      .catch((error) => {
        console.error('Beklenmeyen hata:', error);
        toast.error('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      });
  };

  const handleInstallmentPayment = (paymentData) => {
    dispatch(addInstallmentPayment({ 
      id: selectedPackage._id, 
      payment: paymentData,
      installmentIndex: paymentData.installmentIndex || 0 // Seçilen taksit indeksi
    }))
      .then((resultAction) => {
        if (addInstallmentPayment.fulfilled.match(resultAction)) {
          // Taksitli mi yoksa doğrudan ödeme mi olduğunu kontrol et
          if (selectedPackage.isInstallment && paymentData.installmentIndex !== undefined) {
            toast.success('Taksit ödemesi başarıyla eklendi!');
          } else {
            toast.success('Ödeme doğrudan yapılmıştır!');
          }
          setPaymentModalOpen(false);
          setSelectedPackage(null);
          // Paket satışlarını ve paketleri yeniden yükle
          dispatch(fetchPackageSales());
          dispatch(fetchPackages());
        } else if (addInstallmentPayment.rejected.match(resultAction)) {
          const errorMessage = resultAction.payload || resultAction.error.message;
          console.error('Ödeme eklenirken hata:', errorMessage);
          toast.error(errorMessage || 'Ödeme eklenirken hata oluştu');
        }
      })
      .catch((error) => {
        console.error('Beklenmeyen hata:', error);
        toast.error('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      });
  };

  const getCustomerName = (customerId) => {
    // Eğer customerId bir obje ise (populate edilmiş)
    if (typeof customerId === 'object' && customerId !== null) {
      return customerId.name || 'Bilinmeyen Müşteri';
    }
    // Eğer customerId bir string ise (id referansı)
    const customer = customers.find(c => c._id === customerId);
    return customer ? customer.name : 'Bilinmeyen Müşteri';
  };

  const getUserName = (userId) => {
    // Eğer userId bir obje ise (populate edilmiş)
    if (typeof userId === 'object' && userId !== null) {
      return userId.name || 'Bilinmeyen Kullanıcı';
    }
    // Eğer userId bir string ise (id referansı)
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Bilinmeyen Kullanıcı';
  };

  const getPackageName = (packageId) => {
    // Eğer packageId bir obje ise (populate edilmiş)
    if (typeof packageId === 'object' && packageId !== null) {
      return packageId.name || 'Bilinmeyen Paket';
    }
    // Eğer packageId bir string ise (id referansı)
    const packageItem = packages.find(p => p._id === packageId);
    return packageItem ? packageItem.name : 'Bilinmeyen Paket';
  };



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Aktif';
      case 'completed': return 'Tamamlandı';
      case 'expired': return 'Süresi Doldu';
      default: return status;
    }
  };

  const filteredPackageSales = packageSales.filter(pkg => {
    const customerName = getCustomerName(pkg.customer);
    const matchesSearch = customerName.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || pkg.status === filter;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FiPackage className="text-blue-600" />
            Paket Satışları
          </h1>
          <p className="text-gray-600 mt-1">Paket satışlarını yönetin ve takip edin</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FiPlus size={20} />
          Yeni Paket Satışı
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Müşteri adı ile ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="completed">Tamamlandı</option>
            <option value="expired">Süresi Doldu</option>
          </select>
        </div>
      </div>

      {/* Package Sales List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {filteredPackageSales.length === 0 ? (
          <div className="text-center py-12">
            <FiPackage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Paket satışı bulunamadı</h3>
            <p className="text-gray-500">
              {search ? 'Arama kriterlerinize uygun paket satışı bulunamadı.' : 'Henüz hiç paket satışı yapılmamış.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Müşteri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Satış Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paket Türü
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Toplam Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödenen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kalan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPackageSales.map((pkg) => (
                  <tr key={pkg._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUser className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {getCustomerName(pkg.customer)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Satış: {getUserName(pkg.seller)}
                          </div>
                          <div className="text-xs text-blue-500 mt-1">
                            Son Tahsilat: {pkg.payments && pkg.payments.length > 0 ? formatDate(pkg.payments[pkg.payments.length - 1].paymentDate) : 'Yok'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FiCalendar className="text-gray-400 mr-2" />
                        {formatDate(pkg.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPackageName(pkg.packageType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(pkg.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {formatCurrency(pkg.paidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      {formatCurrency(pkg.remainingAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pkg.status)}`}>
                        {getStatusText(pkg.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {pkg.remainingAmount > 0 && (
                          <button
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setPaymentModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Taksit Öde"
                          >
                            <FiDollarSign size={16} />
                            Ödeme
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setDetailsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="Detaylar"
                        >
                          <FiInfo size={16} />
                          Detay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Package Sale Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Yeni Paket Satışı">
        <PackageSaleForm
          onSubmit={handleAddPackageSale}
          onCancel={() => setAddModalOpen(false)}
          loading={loading}
        />
      </Modal>

      {/* Installment Payment Modal */}
      <Modal open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Taksit Ödemesi">
        <InstallmentPaymentForm
          packageSale={selectedPackage ? {
            ...selectedPackage,
            packageName: getPackageName(selectedPackage.packageType)
          } : null}
          onSubmit={handleInstallmentPayment}
          onCancel={() => setPaymentModalOpen(false)}
          loading={loading}
        />
      </Modal>
      
      {/* Package Details Modal */}
      <Modal open={detailsModalOpen} onClose={() => setDetailsModalOpen(false)} title="Paket Detayları" size="lg">
        <PackageDetailsModal
          packageSale={selectedPackage}
          onClose={() => setDetailsModalOpen(false)}
          formatCurrency={formatCurrency}
          getCustomerName={getCustomerName}
          getUserName={getUserName}
        />
      </Modal>
    </div>
  );
}