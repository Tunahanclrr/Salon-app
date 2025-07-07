// src/features/customers/customersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk ile API'den müşterileri çek
export const fetchCustomers = createAsyncThunk(
    'customers/fetchCustomers',
    async () => {
      const response = await axios.get('http://localhost:4000/api/customers');
      return response.data;
    }
  );

// Müşteri silme thunk'ı
export const deleteCustomer = createAsyncThunk(
  'customers/deleteCustomer',
  async (id) => {
    await axios.delete(`http://localhost:4000/api/customers/${id}`);
    return id;
  }
);

// Müşteri ekleme thunk'ı
export const addCustomer = createAsyncThunk(
  'customers/addCustomer',
  async (customer) => {
    const response = await axios.post('http://localhost:4000/api/customers', customer);
    return response.data;
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
      });
  },
});

export default customersSlice.reducer;