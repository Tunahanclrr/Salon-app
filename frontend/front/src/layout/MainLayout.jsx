import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile and tablet menu button */}
      <div className="xl:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white p-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          {sidebarOpen ? (
            <FiX className="w-6 h-6 text-gray-600" />
          ) : (
            <FiMenu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="xl:ml-72 transition-all duration-300">
        <main className="p-4 xl:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile and tablet overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
