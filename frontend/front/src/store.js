import { configureStore } from '@reduxjs/toolkit';
import employeesReducer from './redux/employeesSlice';
import customerReducer from './redux/customersSlice';
import appointmentsReducer from './redux/appointmentsSlice';
import servicesReducer from './redux/servicesSlice';

export const store = configureStore({
  reducer: {
    employees: employeesReducer,
    customers: customerReducer,
    appointments: appointmentsReducer,
    services: servicesReducer,
  },
});
