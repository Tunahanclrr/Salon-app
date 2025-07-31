import { configureStore } from '@reduxjs/toolkit';
import usersReducer from './redux/usersSlice';
import customerReducer from './redux/customersSlice';
import appointmentsReducer from './redux/appointmentsSlice';
import servicesReducer from './redux/servicesSlice';
import packageSalesReducer from './redux/packageSalesSlice';
import packagesReducer from './redux/packagesSlice';
import authReducer from './redux/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    customers: customerReducer,
    appointments: appointmentsReducer,
    services: servicesReducer,
    packageSales: packageSalesReducer,
    packages: packagesReducer,
  },
});
