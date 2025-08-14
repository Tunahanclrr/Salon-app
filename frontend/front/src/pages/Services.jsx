// src/pages/Services.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServices, addService, deleteService, updateService } from '../redux/servicesSlice';
import Modal from '../components/Modal';
import ServiceForm from '../components/ServiceForm';
import { FiPlus, FiDownload, FiUpload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export default function Services() {
  const dispatch = useDispatch();
  const services = useSelector((state) => state.services.items);
  const loading = useSelector((state) => state.services.loading);
  const error = useSelector((state) => state.services.error);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletingService, setDeletingService] = useState(null);

  // Excel import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    console.log('Fetching services...');
    dispatch(fetchServices())
      .unwrap()
      .then(() => {
        console.log('Services fetched successfully');
      })
      .catch((error) => {
        console.error('Error fetching services:', error);
      });
  }, [dispatch]);

  // Excel dışa aktarma işlemi
  const handleExportToExcel = () => {
    try {
      const exportData = services.map(service => ({
        'Hizmet Adı': service.name,
        'Süre (Dakika)': service.duration,
        'Fiyat (₺)': service.price,
        'Oluşturulma Tarihi': service.createdAt ? new Date(service.createdAt).toLocaleDateString('tr-TR') : '',
        'Son Güncelleme': service.updatedAt ? new Date(service.updatedAt).toLocaleDateString('tr-TR') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hizmetler');

      // Kolon genişlikleri ayarla
      const columnWidths = [
        { wch: 25 }, // Hizmet Adı
        { wch: 15 }, // Süre
        { wch: 15 }, // Fiyat
        { wch: 20 }, // Oluşturulma Tarihi
        { wch: 20 }  // Son Güncelleme
      ];
      worksheet['!cols'] = columnWidths;

      const now = new Date();
      const dateStr = now.toLocaleDateString('tr-TR').replace(/\./g, '-');
      XLSX.writeFile(workbook, `hizmetler-${dateStr}.xlsx`);
      
      toast.success('Hizmetler Excel dosyasına aktarıldı!');
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
        const formattedData = jsonData.map((row, index) => ({
          id: index + 1,
          name: row['Hizmet Adı'] || row['Service Name'] || row['Name'] || row['name'] || '',
          duration: parseInt(row['Süre (Dakika)'] || row['Duration'] || row['duration']) || 30,
          price: parseFloat(row['Fiyat (₺)'] || row['Price'] || row['price']) || 0,
          isValid: (row['Hizmet Adı'] || row['Service Name'] || row['Name'] || row['name']) && 
                   !isNaN(parseInt(row['Süre (Dakika)'] || row['Duration'] || row['duration'])) &&
                   !isNaN(parseFloat(row['Fiyat (₺)'] || row['Price'] || row['price']))
        })).filter(service => service.name || service.duration || service.price);

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
        'Hizmet Adı': 'Saç Kesimi',
        'Süre (Dakika)': 30,
        'Fiyat (₺)': 100
      },
      {
        'Hizmet Adı': 'Sakal Tıraşı',
        'Süre (Dakika)': 20,
        'Fiyat (₺)': 50
      },
      {
        'Hizmet Adı': 'Saç Boyama',
        'Süre (Dakika)': 120,
        'Fiyat (₺)': 300
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hizmetler');
    
    // Dosyayı indir
    XLSX.writeFile(workbook, 'hizmet-sablonu.xlsx');
    toast.success('Hizmet şablonu indirildi!');
  };

  // Toplu hizmet ekleme işlemi
  const handleBulkImport = async () => {
    if (importData.length === 0) return;

    setImportLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const service of importData) {
        try {
          if (service.isValid) {
            await dispatch(addService({
              name: service.name,
              duration: service.duration,
              price: service.price
            }));
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error('Hizmet eklenemedi:', service, error);
          errorCount++;
        }
      }

      toast.success(`İçe aktarma tamamlandı!\nBaşarılı: ${successCount}\nHatalı: ${errorCount}`);
      
      if (successCount > 0) {
        dispatch(fetchServices()); // Listeyi güncelle
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

  const handleAddService = async (serviceData) => {
    try {
      console.log('Submitting service:', serviceData);
      const resultAction = await dispatch(addService(serviceData));
      if (addService.fulfilled.match(resultAction)) {
        toast.success('Hizmet başarıyla eklendi!');
        setIsAddModalOpen(false);
        await dispatch(fetchServices());
      } else {
        throw new Error(resultAction.payload || 'Hizmet eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error(error.message);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setIsEditModalOpen(true);
  };

  const handleEditService = async (id, data) => {
    try {
      console.log('🔧 handleEditService called with:', { id, data });
      console.log('Data keys:', Object.keys(data));
      console.log('Data values:', Object.values(data));
      
      const resultAction = await dispatch(updateService({ id, data }));
      if (updateService.fulfilled.match(resultAction)) {
        toast.success('Hizmet başarıyla düzenlendi!');
        setIsEditModalOpen(false);
        setEditingService(null);
        await dispatch(fetchServices());
      } else {
        console.log('❌ updateService failed:', resultAction);
        throw new Error(resultAction.payload || 'Hizmet düzenlenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error editing service:', error);
      toast.error(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const resultAction = await dispatch(deleteService(id));
      if (deleteService.fulfilled.match(resultAction)) {
        toast.success('Hizmet başarıyla silindi!');
        dispatch(fetchServices());
      } else {
        throw new Error(resultAction.payload || 'Hizmet silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(error.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
        <h2 className="text-xl sm:text-3xl font-bold text-gray-800 whitespace-nowrap">Hizmetler</h2>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="bg-orange-500 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base flex-1 sm:flex-none cursor-pointer"
          >
            <FiUpload className="text-base sm:text-lg" />
            <span className="whitespace-nowrap">Excel'den İçe Aktar</span>
          </label>
          <button
            onClick={downloadTemplate}
            className="bg-purple-500 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base flex-1 sm:flex-none"
          >
            <FiDownload className="text-base sm:text-lg" />
            <span className="whitespace-nowrap">Şablon İndir</span>
          </button>
          <button
            onClick={handleExportToExcel}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base flex-1 sm:flex-none"
          >
            <FiDownload className="text-base sm:text-lg" />
            <span className="whitespace-nowrap">Excel'e Aktar</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-base flex-1 sm:flex-none"
          >
            <FiPlus className="text-base sm:text-lg" />
            <span className="whitespace-nowrap">Yeni Hizmet Ekle</span>
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-600">Hizmetler yükleniyor...</p>}
      {error && <p className="text-center text-red-500">Hata: {error}</p>}

      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {services.length > 0 ? (
            services.map((service) => (
              <li key={service._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-base sm:text-lg font-medium text-gray-900 truncate flex-1">
                    {service.name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                      {service.duration} dakika
                    </span>
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                      {service.price} ₺
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={() => {
                        setDeletingService(service);
                        setConfirmDelete(true);
                      }}
                      className="px-2 py-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            !loading && !error && (
              <p className="px-4 py-4 text-gray-500 text-center">Henüz hiç hizmet eklenmemiş.</p>
            )
          )}
        </ul>
      </div>

      <Modal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Yeni Hizmet Ekle"
      >
        <ServiceForm
          onSubmit={handleAddService}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      <Modal
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingService(null);
        }}
        title="Hizmeti Düzenle"
      >
        <ServiceForm
          onSubmit={(data) => handleEditService(editingService._id, data)}
          onCancel={() => {
            setIsEditModalOpen(false);
            setEditingService(null);
          }}
          initialData={editingService}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={confirmDelete}
        onClose={() => {
          setConfirmDelete(false);
          setDeletingService(null);
        }}
        title="Hizmet Silme Onayı"
      >
        <div className="p-4">
          <p className="text-gray-700 mb-4">
            {deletingService ? 
              `"${deletingService.name}" hizmetini silmek istediğinize emin misiniz?` :
              'Bu hizmeti silmek istediğinize emin misiniz?'
            }
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setConfirmDelete(false);
                setDeletingService(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              İptal
            </button>
            <button
              onClick={() => {
                handleDelete(deletingService._id);
                setConfirmDelete(false);
                setDeletingService(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sil
            </button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal
        open={importModalOpen}
        onClose={() => {
          setImportModalOpen(false);
          setImportData([]);
        }}
        title="Excel'den Hizmet İçe Aktarma"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {importData.length} adet hizmet bulundu. İçe aktarmak istediğiniz hizmetleri kontrol edin:
          </p>
          
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Hizmet Adı</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Süre</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Fiyat</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Durum</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {importData.map((service, index) => (
                  <tr key={index} className={service.isValid ? '' : 'bg-red-50'}>
                    <td className="px-3 py-2 text-gray-900">{service.name}</td>
                    <td className="px-3 py-2 text-gray-900">{service.duration} dk</td>
                    <td className="px-3 py-2 text-gray-900">{service.price} ₺</td>
                    <td className="px-3 py-2">
                      {service.isValid ? (
                        <span className="text-green-600">✓ Geçerli</span>
                      ) : (
                        <span className="text-red-600">✗ Hatalı</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between">
            <div className="text-sm text-gray-600">
              Geçerli: {importData.filter(s => s.isValid).length} / {importData.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  setImportData([]);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={importLoading}
              >
                İptal
              </button>
              <button
                onClick={handleBulkImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={importLoading || importData.filter(s => s.isValid).length === 0}
              >
                {importLoading ? 'İşleniyor...' : 'İçe Aktar'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}