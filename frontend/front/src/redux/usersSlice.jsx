// src/redux/usersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Kullanıcıları API'den çek (sadece employee rolündekiler)
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async () => {
    const response = await api.get('/api/auth/users');
    // Backend'ten gelen response: { success: true, data: users }
    return response.data.data;
  }
);

// Kullanıcı ekleme
export const addUser = createAsyncThunk(
  'users/addUser',
  async (user, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', user);
      return response.data.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Kullanıcı eklenemedi');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    items: [],
    status: 'idle', // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Kullanıcıları çekme
      .addCase(fetchUsers.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Kullanıcı ekleme
      .addCase(addUser.fulfilled, (state, action) => {
        if (action.payload.role === 'employee') {
          state.items.push(action.payload);
        }
      });
  },
});

export default usersSlice.reducer;