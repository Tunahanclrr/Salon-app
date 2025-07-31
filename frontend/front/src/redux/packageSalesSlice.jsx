import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Paket satışlarını çekme
export const fetchPackageSales = createAsyncThunk(
  'packageSales/fetchPackageSales',
  async () => {
    const response = await api.get('/api/package-sales');
    return response.data;
  }
);

// Yeni paket satışı ekleme
export const addPackageSale = createAsyncThunk(
  'packageSales/addPackageSale',
  async (packageSale, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/package-sales', packageSale);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Paket satışı eklenirken hata oluştu');
    }
  }
);

// Paket satışını güncelleme
export const updatePackageSale = createAsyncThunk(
  'packageSales/updatePackageSale',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/package-sales/${id}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Paket satışı güncellenirken hata oluştu');
    }
  }
);

// Taksit ödeme
export const addInstallmentPayment = createAsyncThunk(
  'packageSales/addInstallmentPayment',
  async ({ id, payment, installmentIndex = 0 }, { rejectWithValue }) => {
    try {
      // Taksit indeksini parametre olarak al
      const response = await api.post(`/api/package-sales/${id}/installments/${installmentIndex}/pay`, {
        paymentMethod: payment.paymentMethod,
        paidDate: payment.date,
        amount: payment.amount, // Ödeme tutarını da gönder
        description: payment.description // Açıklamayı da gönder
      });
      return response.data;
    } catch (error) {
      console.error('Taksit ödeme API hatası:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Taksit ödemesi eklenirken hata oluştu');
    }
  }
);

// Tahsilat yapma
export const makePayment = createAsyncThunk(
  'packageSales/makePayment',
  async ({ id, paymentData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/package-sales/${id}/payments`, paymentData);
      return response.data;
    } catch (error) {
      console.error('Tahsilat API hatası:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Tahsilat yapılırken hata oluştu');
    }
  }
);

// Hizmet kullanımı
export const usePackageService = createAsyncThunk(
  'packageSales/usePackageService',
  async ({ id, serviceId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/package-sales/${id}/use-service`, {
        serviceId,
        quantity
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Hizmet kullanımı kaydedilirken hata oluştu');
    }
  }
);

// Müşteriye ait paket satışlarını çekme
export const fetchCustomerPackageSales = createAsyncThunk(
  'packageSales/fetchCustomerPackageSales',
  async (customerId) => {
    const response = await api.get(`/api/package-sales/customer/${customerId}`);
    return response.data;
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