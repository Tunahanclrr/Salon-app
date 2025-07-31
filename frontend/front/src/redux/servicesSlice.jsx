// src/redux/servicesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Tüm hizmetleri çekme (GET)
export const fetchServices = createAsyncThunk('services/fetch', async () => {
  console.log('Fetching services from API...');
  const { data } = await api.get('/api/services');
  console.log('Services fetched:', data);
  return data;
});

// Yeni hizmet ekleme (POST)
export const addService = createAsyncThunk(
  'services/addService',
  async (service, { rejectWithValue }) => {
    console.log('Adding service:', service);
    try {
      const { data } = await api.post('/api/services', service);
      console.log('Service added:', data);
      return data.data;
    } catch (err) {
      console.error('Add service error:', err);
      return rejectWithValue(err.response?.data?.message || 'Hizmet eklenemedi');
    }
  }
);

// Hizmet güncelleme (PUT)
export const updateService = createAsyncThunk(
  'services/updateService',
  async ({ id, data }, { rejectWithValue }) => {
    console.log('🔧 Redux updateService called with:', { id, data });
    console.log('🔧 Data being sent to API:', data);
    try {
      const response = await api.put(`/api/services/${id}`, data);
      console.log('🔧 API Response:', response.data);
      return response.data.data;
    } catch (err) {
      console.error('❌ Update service error:', err);
      console.error('❌ Error response:', err.response?.data);
      return rejectWithValue(err.response?.data?.message || 'Hizmet güncellenemedi');
    }
  }
);

// Hizmet silme (DELETE)
export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (id, { rejectWithValue }) => {
    console.log('Deleting service:', id);
    try {
      await api.delete(`/api/services/${id}`);
      console.log('Service deleted:', id);
      return id;
    } catch (err) {
      console.error('Delete service error:', err);
      return rejectWithValue(err.response?.data?.message || 'Hizmet silinemedi');
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
      .addCase(updateService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        const updatedService = action.payload.data || action.payload;
        const index = state.items.findIndex(item => item._id === updatedService._id);
        if (index !== -1) {
          state.items[index] = updatedService;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
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