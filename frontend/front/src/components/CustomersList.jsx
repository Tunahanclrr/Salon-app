import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCustomers, deleteCustomer, addCustomer } from '../redux/customersSlice';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import CustomerPackages from './CustomerPackages';
import * as XLSX from 'xlsx';

export default function CustomersList() {
  const dispatch = useDispatch();
  const { items: customers, status } = useSelector((state) => state.customers);
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filtered = (customers || []).filter(
    c =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
  );
  

  // Müşteri ekleme işlemi
  const handleAddCustomer = async (form) => {
    try {
      await dispatch(addCustomer(form));
      setAddModalOpen(false);
      dispatch(fetchCustomers()); // ekleyebilirsin, listeyi güncellemek için
    } catch (error) {
      console.error("Müşteri eklenemedi:", error);
    }
  };
  
  // Müşteri silme işlemi
  const handleDeleteCustomer = (id) => {
    setCustomerToDelete(id);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (customerToDelete) {
      dispatch(deleteCustomer(customerToDelete));
    }
    setConfirmModalOpen(false);
    setCustomerToDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmModalOpen(false);
    setCustomerToDelete(null);
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
        const formattedData = jsonData.map((row, index) => ({
          id: index + 1,
          name: row['Ad Soyad'] || row['Name'] || row['İsim'] || row['name'] || '',
          phone: row['Telefon'] || row['Phone'] || row['phone'] || '',
          email: row['E-posta'] || row['Email'] || row['email'] || '',
          notes: row['Not'] || row['Notes'] || row['notes'] || ''
        })).filter(customer => customer.name || customer.phone || customer.email);

        setImportData(formattedData);
        setImportModalOpen(true);
      } catch (error) {
        console.error('Excel dosyası okuma hatası:', error);
        alert('Excel dosyası okunamadı. Lütfen geçerli bir Excel dosyası seçin.');
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
        'Ad Soyad': 'Örnek Müşteri 1',
        'Telefon': '05551234567',
        'E-posta': 'ornek1@email.com',
        'Not': 'Örnek not'
      },
      {
        'Ad Soyad': 'Örnek Müşteri 2',
        'Telefon': '05559876543',
        'E-posta': 'ornek2@email.com',
        'Not': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Müşteriler');
    
    // Dosyayı indir
    XLSX.writeFile(workbook, 'musteri-sablonu.xlsx');
  };

  // Toplu müşteri ekleme işlemi
  const handleBulkImport = async () => {
    if (importData.length === 0) return;

    setImportLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const customer of importData) {
        try {
          await dispatch(addCustomer({
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            notes: customer.notes
          }));
          successCount++;
        } catch (error) {
          console.error('Müşteri eklenemedi:', customer, error);
          errorCount++;
        }
      }

      alert(`İçe aktarma tamamlandı!\nBaşarılı: ${successCount}\nHatalı: ${errorCount}`);
      
      if (successCount > 0) {
        dispatch(fetchCustomers()); // Listeyi güncelle
      }
      
      setImportModalOpen(false);
      setImportData([]);
    } catch (error) {
      console.error('Toplu import hatası:', error);
      alert('İçe aktarma sırasında bir hata oluştu.');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-2">
      <div className="flex flex-col items-center gap-4 mb-6">
        <h2 className="text-3xl font-bold text-blue-900 text-center">Müşteriler</h2>
        <div className="flex w-full max-w-md gap-2">
          <input
            type="text"
            placeholder="İsim, telefon veya e-posta ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded px-4 py-2 w-full shadow-sm focus:ring-2 focus:ring-blue-200 transition"
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded shadow"
            onClick={() => setAddModalOpen(true)}
          >
             Müşteri Ekle
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded shadow cursor-pointer"
          >
            Excel'den İçe Aktar
          </label>
          <button
            onClick={downloadTemplate}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded shadow"
          >
            Excel Şablonu İndir
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        {status === 'loading' ? (
          <div className="text-center py-8 text-blue-600">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-lg">Müşteri bulunamadı.</div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="bg-blue-100 text-blue-900">
                <th className="py-3 px-4 text-left">Ad Soyad</th>
                <th className="py-3 px-4 text-left">Telefon</th>
                <th className="py-3 px-4 text-left">E-posta</th>
                <th className="py-3 px-4 text-left">Not</th>
                <th className="py-3 px-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer._id} className="border-b hover:bg-blue-50 transition">
                  <td className="py-2 px-4">{customer.name}</td>
                  <td className="py-2 px-4">{customer.phone}</td>
                  <td className="py-2 px-4">{customer.email}</td>
                  <td className="py-2 px-4">{customer.notes || '-'}</td>
                  <td className="py-2 px-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm shadow"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDetailModalOpen(true);
                        }}
                      >
                        Detay
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm shadow"
                        onClick={() => handleDeleteCustomer(customer._id)}
                      >
                        Sil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Müşteri ekleme modalı */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Müşteri Ekle">
        <CustomerForm
          onSubmit={handleAddCustomer}
          onCancel={() => setAddModalOpen(false)}
        />
      </Modal>

      {/* Excel import modalı */}
      <Modal 
        open={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        title="Excel'den Müşteri İçe Aktarma"
      >
        <div className="max-h-96 overflow-y-auto">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {importData.length} müşteri bulundu. İçe aktarmak istediğiniz müşterileri kontrol edin:
            </p>
            <div className="text-xs text-gray-500 mb-4">
              <strong>Desteklenen sütun isimleri:</strong><br/>
              • Ad Soyad / Name / İsim / name<br/>
              • Telefon / Phone / phone<br/>
              • E-posta / Email / email<br/>
              • Not / Notes / notes
            </div>
          </div>
          
          {importData.length > 0 && (
            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Ad Soyad</th>
                    <th className="px-3 py-2 text-left">Telefon</th>
                    <th className="px-3 py-2 text-left">E-posta</th>
                    <th className="px-3 py-2 text-left">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {importData.slice(0, 10).map((customer) => (
                    <tr key={customer.id} className="border-t">
                      <td className="px-3 py-2">{customer.name}</td>
                      <td className="px-3 py-2">{customer.phone}</td>
                      <td className="px-3 py-2">{customer.email}</td>
                      <td className="px-3 py-2">{customer.notes}</td>
                    </tr>
                  ))}
                  {importData.length > 10 && (
                    <tr className="border-t bg-gray-50">
                      <td colSpan="4" className="px-3 py-2 text-center text-gray-500">
                        ... ve {importData.length - 10} müşteri daha
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={() => setImportModalOpen(false)}
            disabled={importLoading}
          >
            İptal
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            onClick={handleBulkImport}
            disabled={importLoading || importData.length === 0}
          >
            {importLoading ? 'İçe Aktarılıyor...' : `${importData.length} Müşteriyi İçe Aktar`}
          </button>
        </div>
      </Modal>
      {/* Müşteri silme onay modalı */}
      <Modal
        open={confirmModalOpen}
        onClose={handleCancelDelete}
        title="Müşteriyi Sil"
      >
        <div className="mb-4">Silmek istediğinizden emin misiniz?</div>
        <div className="flex justify-end gap-2">
          <button
            className="bg-gray-300 px-4 py-2 rounded"
            onClick={handleCancelDelete}
          >
            İptal
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={handleConfirmDelete}
          >
            Evet, Sil
          </button>
        </div>
      </Modal>

      {/* Müşteri detay modalı */}
      <Modal 
        open={detailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        title={`${selectedCustomer?.name || 'Müşteri'} Detayları`}
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Ad Soyad:</span>
                  <p className="text-gray-900">{selectedCustomer.name}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Telefon:</span>
                  <p className="text-gray-900">{selectedCustomer.phone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">E-posta:</span>
                  <p className="text-gray-900">{selectedCustomer.email || '-'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Not:</span>
                  <p className="text-gray-900">{selectedCustomer.notes || '-'}</p>
                </div>
              </div>
            </div>
            
            <CustomerPackages customerId={selectedCustomer._id} />
          </div>
        )}
      </Modal>
    </div>
  );
}