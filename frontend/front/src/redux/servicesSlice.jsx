// src/redux/servicesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Tüm hizmetleri çekme (GET)
export const fetchServices = createAsyncThunk('services/fetch', async () => {
  console.log('Fetching services from API...');
  const { data } = await axios.get(`${API_BASE_URL}/api/services`);
  console.log('Services fetched:', data);
  return data;
});

// Yeni hizmet ekleme (POST)
export const addService = createAsyncThunk(
  'services/addService',
  async (service, { rejectWithValue }) => {
    console.log('Adding service:', service);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/services`, service);
      console.log('Service added successfully:', data);
      return data;
    } catch (err) {
      console.error('Error adding service:', err);
      const msg = err.response?.data?.message || 'Hizmet eklenirken bir sunucu hatası oluştu.';
      return rejectWithValue(msg);
    }
  }
);

// Hizmet düzenleme (PUT)
export const editService = createAsyncThunk(
  'services/editService',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const { data: response } = await axios.put(`${API_BASE_URL}/api/services/${id}`, data);
      return response;
    } catch (err) {
      const msg = err.response?.data?.message || 'Hizmet düzenlenirken bir sunucu hatası oluştu.';
      return rejectWithValue(msg);
    }
  }
);

// Hizmet silme (DELETE)
export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (id, { rejectWithValue }) => {
    try {
      console.log('Deleting service with ID:', id);
      const response = await axios.delete(`${API_BASE_URL}/api/services/${id}`);
      console.log('Delete response:', response.data);
      return id;
    } catch (err) {
      console.error('Delete error:', err);
      const msg = err.response?.data?.message || 'Hizmet silinirken bir sunucu hatası oluştu.';
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
  reducers: {
    // Senkron reducer'lar buraya eklenebilir
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload; // Gelen veriyi state'e ata
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addService.fulfilled, (state, action) => {
        state.loading = false;
        const newService = action.payload.data || action.payload;
        state.items = [...state.items, newService];
      })
      .addCase(addService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(editService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editService.fulfilled, (state, action) => {
        state.loading = false;
        const updatedService = action.payload.data || action.payload;
        const index = state.items.findIndex(item => item._id === updatedService._id);
        if (index !== -1) {
          state.items[index] = updatedService;
        }
      })
      .addCase(editService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteService için durumlar
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        // Silinen hizmeti listeden çıkar
        state.items = state.items.filter(service => service._id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default servicesSlice.reducer;