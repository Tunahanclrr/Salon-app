// src/redux/employeesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Çalışanları getirme thunk'ı
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/employees`);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

export const deleteEmployee = createAsyncThunk('employees/deleteEmployee', async (id) => {
  await axios.delete(`${API_BASE_URL}/api/employees/${id}`);
  return id;
});

export const addEmployee = createAsyncThunk('employees/addEmployee', async (employeeData) => {
  const response = await axios.post(`${API_BASE_URL}/api/employees`, employeeData);
  return response.data;
});

const employeesSlice = createSlice({
  name: 'employees',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Çalışanları çekme
      .addCase(fetchEmployees.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Çalışan silme
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.items = state.items.filter(emp => emp._id !== action.payload);
      });
      builder
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default employeesSlice.reducer;