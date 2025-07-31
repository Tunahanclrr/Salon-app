// src/redux/employeesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Çalışanları API'den çek
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async () => {
    const response = await api.get('/api/employees');
    return response.data;
  }
);

// Çalışan silme
export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id) => {
    await api.delete(`/api/employees/${id}`);
    return id;
  }
);

// Çalışan ekleme
export const addEmployee = createAsyncThunk(
  'employees/addEmployee',
  async (employee, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/employees', employee);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Çalışan eklenemedi');
    }
  }
);

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
      })
      // Çalışan ekleme
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default employeesSlice.reducer;