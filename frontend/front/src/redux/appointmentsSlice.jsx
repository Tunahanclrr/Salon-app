import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import API_BASE_URL from '../config/api';

// Randevu ekleme thunk'ı
export const addAppointment = createAsyncThunk(
  'appointments/addAppointment',
  async (appointment, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/appointments`, appointment);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

// Randevuları getirme thunk'ı
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/appointments`);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

// Randevu güncelleme thunk'ı
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, appointmentData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/appointments/${id}`,
        appointmentData
      );
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

// Müşteri gelmedi durumunu güncelleme thunk'ı
export const updateCustomerNotArrived = createAsyncThunk(
  'appointments/updateCustomerNotArrived',
  async ({ appointmentId, notArrived }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/api/appointments/${appointmentId}/customer-not-arrived`,
        { customerNotArrived: notArrived }
      );
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
    currentAppointment: null, // Düzenlenen randevuyu saklamak için
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(addAppointment.fulfilled, (state, action) => {
        // Bileşen listeyi yeniden çektiği için burada state'i değiştirmiyoruz.
        state.status = 'succeeded';
      })
      .addCase(fetchAppointments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // action.payload { appointments: [...] } şeklinde bir obje, bize sadece dizi lazım.
        state.items = action.payload.appointments;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(updateAppointment.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Güncellenen randevuyu listede güncelle
        const index = state.items.findIndex(app => app._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.currentAppointment = null; // Düzenleme tamamlandı
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(updateCustomerNotArrived.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateCustomerNotArrived.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Güncellenen randevuyu listede güncelle
        const index = state.items.findIndex(app => app._id === action.payload.data._id);
        if (index !== -1) {
          state.items[index] = action.payload.data;
        }
      })
      .addCase(updateCustomerNotArrived.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
      
  },
});

export default appointmentsSlice.reducer;