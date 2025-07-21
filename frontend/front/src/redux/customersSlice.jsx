// src/features/customers/customersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Müşterileri getirme thunk'ı
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/customers`);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

export const deleteCustomer = createAsyncThunk('customers/deleteCustomer', async (id) => {
  await axios.delete(`${API_BASE_URL}/api/customers/${id}`);
  return id;
});

export const addCustomer = createAsyncThunk('customers/addCustomer', async (customer) => {
  const response = await axios.post(`${API_BASE_URL}/api/customers`, customer);
  return response.data;
});

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