// src/features/customers/customersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Müşterileri getirme thunk'ı
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/customers');
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

// Müşteri ekleme thunk'ı
export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/customers', customerData);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Müşteri eklenirken hata oluştu';
      return rejectWithValue(msg);
    }
  }
);

// Müşteri güncelleme thunk'ı
export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/customers/${id}`, customerData);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Müşteri güncellenirken hata oluştu';
      return rejectWithValue(msg);
    }
  }
);

// Müşteri silme thunk'ı
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/customers/${id}`);
      return id;
    } catch (err) {
      const msg = err.response?.data?.message || 'Müşteri silinirken hata oluştu';
      return rejectWithValue(msg);
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
    .addCase(fetchCustomers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c._id !== action.payload);
      })
      .addCase(addCustomer.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(addCustomer.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default customersSlice.reducer;