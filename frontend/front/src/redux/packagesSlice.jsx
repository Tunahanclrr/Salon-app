import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Paketleri getirme thunk'ı
export const fetchPackages = createAsyncThunk('packages/fetchPackages', async () => {
  const response = await axios.get(`${API_BASE_URL}/api/packages`);
  return response.data;
});

// Paket ekleme thunk'ı
export const addPackage = createAsyncThunk('packages/addPackage', async (packageData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/packages`, packageData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Paket eklenirken hata oluştu');
  }
});

// Paket güncelleme thunk'ı
export const updatePackage = createAsyncThunk(
  'packages/updatePackage',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/packages/${id}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Paket güncellenirken hata oluştu');
    }
  }
);

// Paket silme thunk'ı
export const deletePackage = createAsyncThunk(
  'packages/deletePackage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/packages/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Paket silinirken hata oluştu');
    }
  }
);

const packagesSlice = createSlice({
  name: 'packages',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    loading: false
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Paketleri çekme
      .addCase(fetchPackages.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.items = action.payload.packages || [];
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })
      
      // Paket ekleme
      .addCase(addPackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload.data);
      })
      .addCase(addPackage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Paket güncelleme
      .addCase(updatePackage.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      
      // Paket silme
      .addCase(deletePackage.fulfilled, (state, action) => {
        state.items = state.items.filter(item => item._id !== action.payload.id);
      });
  }
});

export const { clearError } = packagesSlice.actions;
export default packagesSlice.reducer;