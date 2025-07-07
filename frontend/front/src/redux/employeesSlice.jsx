// src/redux/employeesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Çalışanları API'den çek
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async () => {
    const response = await axios.get('http://localhost:4000/api/employees');
    return response.data;
  }
);

// Çalışan silme
export const deleteEmployee = createAsyncThunk(
  'employees/deleteEmployee',
  async (id) => {
    await axios.delete(`http://localhost:4000/api/employees/${id}`);
    return id;
  }
);
export const addEmployee = createAsyncThunk(
  'employees/addEmployee',
  async (employeeData, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:4000/api/employees', employeeData);
      return response.data.data; // 
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
      });
      builder
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default employeesSlice.reducer;