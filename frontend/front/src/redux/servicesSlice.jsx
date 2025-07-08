import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchServices = createAsyncThunk('services/fetch', async ()=>{
  const { data } = await axios.get('http://localhost:4000/api/services');
  return data;
});

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