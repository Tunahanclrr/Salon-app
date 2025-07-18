import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Randevu ekleme thunk'ı
export const addAppointment = createAsyncThunk(
  'appointments/addAppointment',
  async (appointment, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('http://localhost:4000/api/appointments', appointment);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Sunucu hatası';
      return rejectWithValue(msg);
    }
  }
);

// Randevuları çekme thunk'ı
export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async () => {
    const response = await axios.get('http://localhost:4000/api/appointments');
    return response.data;
  }
);

// Randevu güncelleme thunk'ı
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, appointmentData }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/appointments/${id}`,
        appointmentData
      );
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Güncelleme sırasında hata oluştu';
      return rejectWithValue(msg);
    }
  }
);

// Müşteri gelmedi durumunu güncelleme thunk'ı
export const updateCustomerNotArrived = createAsyncThunk(
  'appointments/updateCustomerNotArrived',
  async ({ appointmentId, customerNotArrived }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/appointments/${appointmentId}/customer-not-arrived`,
        { customerNotArrived }
      );
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Müşteri gelmedi durumu güncellenirken hata oluştu';
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