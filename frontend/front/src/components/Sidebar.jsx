import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import React from 'react'
import { 
  FiCalendar, 
  FiUsers, 
  FiSettings, 
  FiHome,
  FiScissors,
  FiUserCheck,
  FiPackage,
  FiLogOut,
  FiShield,
  FiUser,
  FiLock
} from 'react-icons/fi'
import { logout, selectCurrentUser, selectUserPermissions, selectIsAdmin } from '../redux/authSlice'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const permissions = useSelector(selectUserPermissions)
  const isAdmin = useSelector(selectIsAdmin)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  // Menu items with permission checks
  const getMenuItems = () => {
    const items = [
      { path: '/dashboard', icon: FiHome, label: 'Ana Sayfa', permission: null },
      { path: '/randevularim', icon: FiUserCheck, label: 'Randevularım', permission: null },
    ]

    // Admin-only items
    if (isAdmin) {
      items.push({ path: '/admin', icon: FiShield, label: 'Admin Panel', permission: null })
    }

    // Permission-based items
    if (permissions.canViewAppointments || isAdmin) {
      items.push({ path: '/randevular', icon: FiCalendar, label: 'Randevular', permission: 'canViewAppointments' })
    }

    if (permissions.canViewServices || isAdmin) {
      items.push({ path: '/hizmetler', icon: FiScissors, label: 'Hizmetler', permission: 'canViewServices' })
    }

    if (permissions.canViewCustomers || isAdmin) {
      items.push({ path: '/musteriler', icon: FiUsers, label: 'Müşteriler', permission: 'canViewCustomers' })
    }

    if (permissions.canViewPackages || isAdmin) {
      items.push({ path: '/paket-satislari', icon: FiPackage, label: 'Paket Satışları', permission: 'canViewPackages' })
    }

    return items
  }

  const menuItems = getMenuItems()
  
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } xl:translate-x-0 flex flex-col`}>
      
      {/* Logo ve başlık */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-xl font-bold text-purple-600">Krasa</h2>
            <p className="text-sm text-gray-500">Güzellik Salonu Yönetimi</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">
            {React.createElement(FiUser, { className: "w-5 h-5 text-gray-600" })}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">{currentUser?.username}</p>
            <p className="text-xs text-gray-500">
              {isAdmin ? 'Admin' : 'Personel'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (location.pathname === '/' && item.path === '/dashboard')
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
              }`}
            >
              {React.createElement(item.icon, { className: "w-5 h-5" })}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          to="/sifre-degistir"
          onClick={() => setIsOpen(false)}
          className="w-full flex items-center space-x-3 p-3 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-purple-600 transition-all duration-200"
        >
          {React.createElement(FiLock, { className: "w-5 h-5" })}
          <span className="font-medium">Şifre Değiştir</span>
        </Link>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-3 rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200"
        >
          {React.createElement(FiLogOut, { className: "w-5 h-5" })}
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar