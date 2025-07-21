import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Paket satışlarını getirme thunk'ı
export const fetchPackageSales = createAsyncThunk('packageSales/fetchPackageSales', async () => {
  const response = await axios.get(`${API_BASE_URL}/api/package-sales`);
  return response.data;
});

// Paket satışı ekleme thunk'ı
export const addPackageSale = createAsyncThunk('packageSales/addPackageSale', async (packageSale, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/package-sales`, packageSale);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Paket satışı eklenirken hata oluştu');
  }
});

// Paket satışı güncelleme thunk'ı
export const updatePackageSale = createAsyncThunk(
  'packageSales/updatePackageSale',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/package-sales/${id}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Paket satışı güncellenirken hata oluştu');
    }
  }
);

// Taksit ödeme thunk'ı
export const payInstallment = createAsyncThunk(
  'packageSales/payInstallment',
  async ({ id, installmentIndex, paymentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/package-sales/${id}/installments/${installmentIndex}/pay`, {
        ...paymentData
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Taksit ödemesi yapılırken hata oluştu');
    }
  }
);

// Ek ödeme ekleme thunk'ı
export const addPayment = createAsyncThunk(
  'packageSales/addPayment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/package-sales/${id}/payments`, paymentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ödeme eklenirken hata oluştu');
    }
  }
);

// Hizmet kullanma thunk'ı
export const useService = createAsyncThunk(
  'packageSales/useService',
  async ({ id, serviceId, usedCount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/package-sales/${id}/use-service`, {
        serviceId,
        usedCount
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Hizmet kullanılırken hata oluştu');
    }
  }
);

// Müşteriye göre paket satışlarını getirme thunk'ı
export const fetchPackageSalesByCustomer = createAsyncThunk(
  'packageSales/fetchPackageSalesByCustomer',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/package-sales/customer/${customerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Müşteri paket satışları getirilirken hata oluştu');
    }
  }
);

const packageSalesSlice = createSlice({
  name: 'packageSales',
  initialState: {
    items: [],
    customerPackages: [],
    status: 'idle',
    error: null,
    loading: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCustomerPackages: (state) => {
      state.customerPackages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Paket satışlarını çekme
      .addCase(fetchPackageSales.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchPackageSales.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.items = action.payload.packageSales || [];
      })
      .addCase(fetchPackageSales.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Paket satışı ekleme
      .addCase(addPackageSale.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPackageSale.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(addPackageSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Paket satışı güncelleme
      .addCase(updatePackageSale.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      
      // Taksit ödeme
      .addCase(addInstallmentPayment.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      
      // Tahsilat yapma
      .addCase(makePayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(makePayment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      .addCase(makePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Hizmet kullanımı
      .addCase(usePackageService.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      
      // Müşteri paket satışları
      .addCase(fetchCustomerPackageSales.fulfilled, (state, action) => {
        state.customerPackages = action.payload.packageSales || [];
      });
  }
});

export const { clearError, clearCustomerPackages } = packageSalesSlice.actions;
export default packageSalesSlice.reducer;