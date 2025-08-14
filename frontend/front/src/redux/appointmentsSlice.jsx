import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../config/api';

// Randevu ekleme thunk'ı
export const addAppointment = createAsyncThunk(
  'appointments/addAppointment',
  async (appointment, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/api/appointments', appointment);
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
  async (_, { rejectWithValue }) => {
    try {
      console.log('🚀 fetchAppointments thunk called');
      const response = await api.get('/api/appointments');
      console.log('✅ fetchAppointments response:', response.data);
      return response.data;
    } catch (err) {
      console.log('❌ fetchAppointments error:', err);
      const msg = err.response?.data?.message || 'Randevular yüklenirken hata oluştu';
      return rejectWithValue(msg);
    }
  }
);

// Randevu güncelleme thunk'ı
export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ id, appointmentData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(
        `/api/appointments/${id}`,
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
      const { data } = await api.put(
        `/api/appointments/${appointmentId}/customer-not-arrived`,
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
        state.status = 'succeeded';
        // Backend yalnızca oluşturulan randevuyu döndürüyorsa, listeye ekle
        if (action.payload && action.payload._id) {
          state.items.push(action.payload);
        }
      })
      .addCase(fetchAppointments.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.status = 'succeeded';
        // Backend'ten gelen response formatı: { success: true, data: { appointments: [...] } }
        state.items = action.payload.data?.appointments || action.payload.appointments || [];
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
        const index = state.items.findIndex(app => app._id === action.payload._id || 
                                     app._id === action.payload.data?._id);
        if (index !== -1) {
          // Backend'den gelen yanıt formatına göre doğru veriyi al
          const updatedAppointment = action.payload.data || action.payload;
          state.items[index] = updatedAppointment;
        } else {
          // Eğer bulunamazsa, yeni randevuyu listeye ekle
          const newAppointment = action.payload.data || action.payload;
          state.items.push(newAppointment);
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