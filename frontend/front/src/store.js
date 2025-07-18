import { configureStore } from '@reduxjs/toolkit';
import employeesReducer from './redux/employeesSlice';
import customerReducer from './redux/customersSlice';
import appointmentsReducer from './redux/appointmentsSlice';
import servicesReducer from './redux/servicesSlice';
import packageSalesReducer from './redux/packageSalesSlice';
import packagesReducer from './redux/packagesSlice';

export const store = configureStore({
  reducer: {
    employees: employeesReducer,
    customers: customerReducer,
    appointments: appointmentsReducer,
    services: servicesReducer,
    packageSales: packageSalesReducer,
    packages: packagesReducer,
  },
});
