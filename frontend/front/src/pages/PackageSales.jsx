import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPlus, FiSearch, FiEdit, FiDollarSign, FiPackage, FiCalendar, FiUser, FiInfo, FiDownload, FiUpload } from 'react-icons/fi';
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
import * as XLSX from 'xlsx';

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

  // Excel import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchPackageSales());
    dispatch(fetchCustomers());
    dispatch(fetchUsers());
    dispatch(fetchServices());
    dispatch(fetchPackages());
  }, [dispatch]);

  // Excel dışa aktarma işlemi
  const handleExportToExcel = () => {
    try {
      const exportData = filteredPackageSales.map(pkg => ({
        'Müşteri': getCustomerName(pkg.customer),
        'Satış Tarihi': formatDate(pkg.createdAt),
        'Paket Türü': pkg.packageName || pkg.packageType || 'Bilinmeyen Paket',
        'Toplam Tutar (₺)': pkg.totalAmount,
        'Ödenen Tutar (₺)': pkg.paidAmount,
        'Kalan Tutar (₺)': pkg.remainingAmount,
        'Durum': getStatusText(pkg.status),
        'Satışı Yapan': getUserName(pkg.seller),
        'Ödeme Yöntemi': pkg.paymentMethod === 'cash' ? 'Nakit' : 
                        pkg.paymentMethod === 'credit_card' ? 'Kredi Kartı' : 
                        pkg.paymentMethod === 'bank_transfer' ? 'Havale/EFT' : pkg.paymentMethod,
        'Taksitli Mi': pkg.isInstallment ? 'Evet' : 'Hayır',
        'Taksit Sayısı': pkg.installmentCount || 1,
        'Notlar': pkg.notes || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Paket Satışları');

      // Kolon genişlikleri ayarla
      const columnWidths = [
        { wch: 20 }, // Müşteri
        { wch: 15 }, // Satış Tarihi
        { wch: 25 }, // Paket Türü
        { wch: 15 }, // Toplam Tutar
        { wch: 15 }, // Ödenen Tutar
        { wch: 15 }, // Kalan Tutar
        { wch: 15 }, // Durum
        { wch: 20 }, // Satışı Yapan
        { wch: 15 }, // Ödeme Yöntemi
        { wch: 12 }, // Taksitli Mi
        { wch: 12 }, // Taksit Sayısı
        { wch: 30 }  // Notlar
      ];
      worksheet['!cols'] = columnWidths;

      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
      XLSX.writeFile(workbook, `paket-satislari-${dateStr}.xlsx`);
      
      toast.success('Paket satışları Excel dosyasına aktarıldı!');
    } catch (error) {
      console.error('Excel dışa aktarma hatası:', error);
      toast.error('Excel dosyası oluşturulurken hata oluştu.');
    }
  };

  // Excel dosyası okuma işlemi
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Excel verilerini uygun formata dönüştür
        const formattedData = jsonData.map((row, index) => {
          // Müşteri ID'si bulma
          const customerName = row['Müşteri'] || row['Customer'] || row['customer'] || '';
          const customer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
          
          // Paket ID'si bulma
          const packageName = row['Paket Türü'] || row['Package Type'] || row['package'] || '';
          const packageItem = packages.find(p => p.name.toLowerCase() === packageName.toLowerCase());
          
          // Satış yapan ID'si bulma
          const sellerName = row['Satışı Yapan'] || row['Seller'] || row['seller'] || '';
          const seller = users.find(u => u.name.toLowerCase() === sellerName.toLowerCase());

          const totalAmount = parseFloat(row['Toplam Tutar (₺)'] || row['Total Amount'] || row['totalAmount']) || 0;
          const isInstallment = (row['Taksitli Mi'] || row['Is Installment'] || row['isInstallment'] || '').toLowerCase() === 'evet' || 
                               (row['Taksitli Mi'] || row['Is Installment'] || row['isInstallment'] || '').toLowerCase() === 'yes';

          return {
            id: index + 1,
            customerId: customer ? customer._id : null,
            customerName: customerName,
            packageId: packageItem ? packageItem._id : null,
            packageName: packageName,
            sellerId: seller ? seller._id : null,
            sellerName: sellerName,
            totalAmount: totalAmount,
            discount: parseFloat(row['İndirim'] || row['Discount'] || row['discount']) || 0,
            finalAmount: parseFloat(row['Net Tutar'] || row['Final Amount'] || row['finalAmount']) || totalAmount,
            saleDate: row['Satış Tarihi'] || row['Sale Date'] || row['saleDate'] || new Date().toISOString().slice(0, 10),
            paymentMethod: (row['Ödeme Yöntemi'] || row['Payment Method'] || row['paymentMethod'] || 'cash').toLowerCase().includes('nakit') ? 'cash' :
                          (row['Ödeme Yöntemi'] || row['Payment Method'] || row['paymentMethod'] || 'cash').toLowerCase().includes('kredi') ? 'credit_card' :
                          (row['Ödeme Yöntemi'] || row['Payment Method'] || row['paymentMethod'] || 'cash').toLowerCase().includes('havale') ? 'bank_transfer' : 'cash',
            isInstallment: isInstallment,
            installmentCount: parseInt(row['Taksit Sayısı'] || row['Installment Count'] || row['installmentCount']) || (isInstallment ? 2 : 1),
            notes: row['Notlar'] || row['Notes'] || row['notes'] || '',
            isValid: customer && packageItem && seller && totalAmount > 0
          };
        }).filter(sale => sale.customerName || sale.packageName);

        setImportData(formattedData);
        setImportModalOpen(true);
      } catch (error) {
        console.error('Excel dosyası okuma hatası:', error);
        toast.error('Excel dosyası okunamadı. Lütfen geçerli bir Excel dosyası seçin.');
      }
    };
    reader.readAsArrayBuffer(file);
    // Input'u temizle
    event.target.value = '';
  };

  // Excel şablonu indirme işlemi
  const downloadTemplate = () => {
    const templateData = [
      {
        'Müşteri': 'Örnek Müşteri 1',
        'Paket Türü': 'Premium Paket',
        'Satışı Yapan': 'Satış Temsilcisi 1',
        'Toplam Tutar (₺)': 1000,
        'İndirim': 100,
        'Net Tutar': 900,
        'Satış Tarihi': '2024-01-15',
        'Ödeme Yöntemi': 'Nakit',
        'Taksitli Mi': 'Hayır',
        'Taksit Sayısı': 1,
        'Notlar': 'Örnek paket satışı'
      },
      {
        'Müşteri': 'Örnek Müşteri 2',
        'Paket Türü': 'Standart Paket',
        'Satışı Yapan': 'Satış Temsilcisi 2',
        'Toplam Tutar (₺)': 1500,
        'İndirim': 0,
        'Net Tutar': 1500,
        'Satış Tarihi': '2024-01-16',
        'Ödeme Yöntemi': 'Kredi Kartı',
        'Taksitli Mi': 'Evet',
        'Taksit Sayısı': 3,
        'Notlar': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Paket Satışları');
    
    // Dosyayı indir
    XLSX.writeFile(workbook, 'paket-satisi-sablonu.xlsx');
    toast.success('Paket satışı şablonu indirildi!');
  };

  // Toplu paket satışı ekleme işlemi
  const handleBulkImport = async () => {
    if (importData.length === 0) return;

    setImportLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const sale of importData) {
        try {
          if (sale.isValid) {
            await dispatch(addPackageSale({
              customerId: sale.customerId,
              packageId: sale.packageId,
              sellerId: sale.sellerId,
              totalAmount: sale.totalAmount,
              discount: sale.discount,
              finalAmount: sale.finalAmount,
              saleDate: sale.saleDate,
              paymentMethod: sale.paymentMethod,
              isInstallment: sale.isInstallment,
              installmentCount: sale.installmentCount,
              notes: sale.notes
            }));
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Paket satışı eklenemedi:', sale, error);
          errorCount++;
        }
      }

      toast.success(`İçe aktarma tamamlandı!\nBaşarılı: ${successCount}\nHatalı: ${errorCount}`);
      
      if (successCount > 0) {
        dispatch(fetchPackageSales()); // Listeyi güncelle
      }
      
      setImportModalOpen(false);
      setImportData([]);
    } catch (error) {
      console.error('Toplu import hatası:', error);
      toast.error('İçe aktarma sırasında bir hata oluştu.');
    } finally {
      setImportLoading(false);
    }
  };

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
        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <FiUpload size={20} />
            Excel'den İçe Aktar
          </label>
          <button
            onClick={downloadTemplate}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <FiDownload size={20} />
            Şablon İndir
          </button>
          <button
            onClick={handleExportToExcel}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FiDownload size={20} />
            Excel'e Aktar
          </button>
          <button
            onClick={() => setAddModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FiPlus size={20} />
            Yeni Paket Satışı
          </button>
        </div>
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
                      {pkg.packageName || pkg.packageType || 'Bilinmeyen Paket'}
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