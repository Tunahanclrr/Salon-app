import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Employes from './pages/Employes';
import Services from './pages/Services';
import PackageSales from './pages/PackageSales';
import EmployeeAppointments from './pages/EmployeeAppointments';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="randevular" element={<Appointments />} />
          <Route path="/personeller/:id/randevular" element={<EmployeeAppointments />} />
          <Route path="personeller" element={<Employes />} />
          <Route path="musteriler" element={<Customers />} />
          <Route path="hizmetler" element={<Services />} />
          <Route path="paket-satislari" element={<PackageSales />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
