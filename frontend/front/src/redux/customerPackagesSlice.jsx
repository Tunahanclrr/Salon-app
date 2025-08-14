import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Müşteri paketlerini çekme
export const fetchCustomerPackages = createAsyncThunk(
  'customerPackages/fetchCustomerPackages',
  async (customerId, { rejectWithValue }) => {
    try {
      console.log('🔍 Müşteri paketleri çekiliyor. Müşteri ID:', customerId);
      const response = await api.get(`/api/customer-packages/customer/${customerId}`);
      console.log('📦 Müşteri paketleri yanıtı:', response);
      
      // Check if the response has a data property with an array
      if (response.data && Array.isArray(response.data)) {
        return { data: response.data };
      }
      // If the response has a data property that's an object with a data array
      else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        return { data: response.data.data };
      }
      // If no data found, return empty array
      return { data: [] };
    } catch (error) {
      console.error('❌ Müşteri paketleri çekilirken hata:', error);
      return rejectWithValue(error.response?.data?.message || 'Müşteri paketleri yüklenirken bir hata oluştu');
    }
  }
);

// Müşteri paketi oluşturma
export const createCustomerPackage = createAsyncThunk(
  'customerPackages/createCustomerPackage',
  async (packageData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/customer-packages', packageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Müşteri paketi oluşturulurken hata oluştu');
    }
  }
);

// Seans kullanma
export const consumeSession = createAsyncThunk(
  'customerPackages/consumeSession',
  async ({ customerPackageId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/customer-packages/${customerPackageId}/use-session`, { quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Seans kullanılırken hata oluştu');
    }
  }
);

// Müşteri paketini güncelleme
export const updateCustomerPackage = createAsyncThunk(
  'customerPackages/updateCustomerPackage',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/customer-packages/${id}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Müşteri paketi güncellenirken hata oluştu');
    }
  }
);

// Müşteri paketini silme
export const deleteCustomerPackage = createAsyncThunk(
  'customerPackages/deleteCustomerPackage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/customer-packages/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Müşteri paketi silinirken hata oluştu');
    }
  }
);

const customerPackagesSlice = createSlice({
  name: 'customerPackages',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    loading: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCustomerPackages: (state) => {
      state.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Müşteri paketlerini çekme
      .addCase(fetchCustomerPackages.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchCustomerPackages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.items = action.payload.data || [];
      })
      .addCase(fetchCustomerPackages.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Müşteri paketi oluşturma
      .addCase(createCustomerPackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCustomerPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(createCustomerPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Seans kullanma
      .addCase(consumeSession.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      
      // Müşteri paketini güncelleme
      .addCase(updateCustomerPackage.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      
      // Müşteri paketini silme
      .addCase(deleteCustomerPackage.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload.id);
      });
  }
});

export const { clearError, clearCustomerPackages } = customerPackagesSlice.actions;
export default customerPackagesSlice.reducer; 