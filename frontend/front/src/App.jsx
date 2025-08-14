import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { selectIsAuthenticated } from './redux/authSlice';

// Layout
import MainLayout from './layout/MainLayout';

// Auth Components
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import ChangePassword from './pages/ChangePassword';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminPanel from './pages/AdminPanel';
import Appointments from './pages/Appointments';
import Customers from './pages/Customers';
import Services from './pages/Services';
import PackageSales from './pages/PackageSales';
import Packages from './pages/Packages';
import MyAppointments from './pages/MyAppointments';

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <ErrorBoundary>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/randevularim" replace /> : <Login />
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect to my appointments */}
          <Route index element={<Navigate to="/randevularim" replace />} />
          
          {/* Change Password - accessible to all authenticated users */}
          <Route path="sifre-degistir" element={<ChangePassword />} />
          
          {/* Admin Panel - admin only */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          {/* Appointments - requires canViewAppointments permission */}
          <Route 
            path="randevular" 
            element={
              <ProtectedRoute requiredPermission="canViewAppointments">
                <Appointments />
              </ProtectedRoute>
            } 
          />
          
          {/* Customers - requires canViewCustomers permission */}
          <Route 
            path="musteriler" 
            element={
              <ProtectedRoute requiredPermission="canViewCustomers">
                <Customers />
              </ProtectedRoute>
            } 
          />
          
          {/* Services - requires canViewServices permission */}
          <Route 
            path="hizmetler" 
            element={
              <ProtectedRoute requiredPermission="canViewServices">
                <Services />
              </ProtectedRoute>
            } 
          />
          
          {/* Package Sales - requires canViewPackages permission */}
          <Route 
            path="paket-satislari" 
            element={
              <ProtectedRoute requiredPermission="canViewPackages">
                <PackageSales />
              </ProtectedRoute>
            } 
          />
          
          {/* Packages - requires canViewPackages permission */}
          <Route 
            path="paketler" 
            element={
              <ProtectedRoute requiredPermission="canViewPackages">
                <Packages />
              </ProtectedRoute>
            } 
          />
          
          {/* User Appointments - accessible to all authenticated users */}
          <Route 
            path="randevularim" 
            element={<MyAppointments />} 
          />
        </Route>

        {/* Catch all - redirect to login if not authenticated, my appointments if authenticated */}
        <Route 
          path="*" 
          element={
            <Navigate to={isAuthenticated ? "/randevularim" : "/login"} replace />
          } 
        />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
