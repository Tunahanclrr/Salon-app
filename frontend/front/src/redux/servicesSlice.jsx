import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchServices = createAsyncThunk('services/fetch', async ()=>{
  const { data } = await axios.get('http://localhost:4000/api/services');
  return data;
});

export const addService = createAsyncThunk(
  'services/addService',
  async (service, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/createService', service);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

const servicesSlice = createSlice({
    name: 'services',
    initialState: {
      items: [],
      loading: false,
      error: null
    },
    extraReducers: (builder) => {
      builder
        .addCase(fetchServices.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchServices.fulfilled, (state, action) => {
          state.loading = false;
          state.items = action.payload;
        })
        .addCase(fetchServices.rejected, (state, action) => {
          state.loading = false;
          state.error = action.error.message;
        });
    }
  });

export default servicesSlice.reducer;