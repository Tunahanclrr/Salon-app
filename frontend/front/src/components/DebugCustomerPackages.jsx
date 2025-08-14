import React, { useState } from 'react';
import api from '../config/api';

export default function DebugCustomerPackages() {
  const [allPackages, setAllPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllCustomerPackages = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/customer-packages/debug/all');
      console.log('🔍 Tüm müşteri paketleri:', response.data);
      setAllPackages(response.data.data || []);
    } catch (error) {
      console.error('❌ Hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerPackages = async (customerId) => {
    try {
      const response = await api.get(`/api/customer-packages/customer/${customerId}`);
      console.log(`🔍 Müşteri ${customerId} paketleri:`, response.data);
    } catch (error) {
      console.error('❌ Hata:', error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">🔍 CustomerPackage Debug</h2>
      
      <div className="space-y-4">
        <button
          onClick={fetchAllCustomerPackages}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Yükleniyor...' : 'Tüm Müşteri Paketlerini Getir'}
        </button>

        <button
          onClick={() => fetchCustomerPackages('doruk-customer-id')}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Doruk Müşteri Paketlerini Getir
        </button>

        {allPackages.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">📦 Tüm Müşteri Paketleri ({allPackages.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {allPackages.map((pkg) => (
                <div key={pkg._id} className="border p-3 rounded bg-gray-50">
                  <p><strong>Müşteri:</strong> {pkg.customer?.name || 'Bilinmiyor'}</p>
                  <p><strong>Paket:</strong> {pkg.package?.service?.name || 'Bilinmiyor'}</p>
                  <p><strong>Kalan:</strong> {pkg.remainingQuantity} / {pkg.totalQuantity}</p>
                  <p><strong>Durum:</strong> {pkg.status}</p>
                  <p><strong>Oluşturulma:</strong> {new Date(pkg.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 