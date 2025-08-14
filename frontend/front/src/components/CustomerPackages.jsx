import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiPackage, FiCalendar, FiClock, FiCheck } from 'react-icons/fi';
import { fetchCustomerPackages, consumeSession } from '../redux/customerPackagesSlice';
import { toast } from 'react-toastify';

export default function CustomerPackages({ customerId }) {
  const dispatch = useDispatch();
  const { items: customerPackages, loading, status, error } = useSelector(state => {
    console.log('🔄 Redux Store State:', state.customerPackages);
    return state.customerPackages;
  });
  const packageSales = useSelector(state => state.packageSales.items);

  useEffect(() => {
    console.log('🔍 Debug Bilgileri:');
    console.log('CustomerId:', customerId);
    console.log('Redux Store - CustomerPackages:', { items: customerPackages, loading, status, error });
    console.log('Redux Store - PackageSales:', packageSales);

    if (customerId) {
      console.log('📦 Paketler getiriliyor... CustomerId:', customerId);
      dispatch(fetchCustomerPackages(customerId)).unwrap()
        .then(response => {
          console.log('✅ API Yanıtı:', response);
          console.log('✅ API Data:', response.data);
          console.log('✅ API Status:', response.status);
          if (!response.data || response.data.length === 0) {
            console.log('⚠️ API boş veri döndü');
          }
        })
        .catch(error => {
          console.error('❌ API Hatası:', error);
          console.error('❌ Hata Detayı:', error.message);
        });
    }
  }, [dispatch, customerId]);

  const handleUseSession = async (customerPackageId, quantity = 1) => {
    try {
      await dispatch(consumeSession({ customerPackageId, quantity })).unwrap();
      toast.success('Seans başarıyla kullanıldı!');
    } catch (error) {
      toast.error(error || 'Seans kullanılırken bir hata oluştu');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'completed':
        return 'Tamamlandı';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FiPackage className="w-5 h-5" />
          Müşteri Paketleri
        </h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FiPackage className="w-5 h-5" />
        Müşteri Paketleri ({customerPackages.length})
      </h3>

      {customerPackages.length === 0 ? (
        <div className="text-center py-8">
          <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Bu müşterinin henüz paketi bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customerPackages.map((customerPackage) => (
            <div
              key={customerPackage._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {customerPackage.package?.service?.name || 'Hizmet'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {customerPackage.package?.quantity} {customerPackage.package?.type === 'seans' ? 'Seans' : 'Dakika'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customerPackage.status)}`}>
                    {getStatusText(customerPackage.status)}
                  </span>
                  {customerPackage.status === 'active' && (
                    <button
                      onClick={() => handleUseSession(customerPackage._id, 1)}
                      disabled={customerPackage.remainingQuantity < 1}
                      className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                      title="Seans Kullan"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Kalan: <span className="font-medium">{customerPackage.remainingQuantity}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Kullanılan: <span className="font-medium">{customerPackage.usedQuantity}</span>
                  </span>
                </div>
              </div>

              {customerPackage.validUntil && (
                <div className="mt-3 text-xs text-gray-500">
                  Geçerlilik: {new Date(customerPackage.validUntil).toLocaleDateString('tr-TR')}
                </div>
              )}

              {customerPackage.status === 'active' && customerPackage.remainingQuantity === 0 && (
                <div className="mt-3 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  Bu paketin tüm seansları kullanıldı.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}