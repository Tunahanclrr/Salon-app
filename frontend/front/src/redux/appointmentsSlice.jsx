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

const appointmentsSlice = createSlice({
  name: 'appointments',
  initialState: {
    items: [],
    status: 'idle',
    error: null,
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
      });
  },
});

export default appointmentsSlice.reducer; 