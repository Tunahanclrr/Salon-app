import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectUserPermissions, selectIsAdmin } from '../redux/authSlice';

const ProtectedRoute = ({ children, requiredPermission, adminOnly = false }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userPermissions = useSelector(selectUserPermissions);
  const isAdmin = useSelector(selectIsAdmin);
  const location = useLocation();

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Sadece admin erişimi gerekiyorsa
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600">Bu sayfaya erişim için admin yetkisi gereklidir.</p>
        </div>
      </div>
    );
  }

  // Belirli bir izin gerekiyorsa
  if (requiredPermission && !isAdmin && !userPermissions[requiredPermission]) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Erişim Reddedildi</h1>
          <p className="text-gray-600">Bu sayfaya erişim için gerekli izniniz bulunmuyor.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;