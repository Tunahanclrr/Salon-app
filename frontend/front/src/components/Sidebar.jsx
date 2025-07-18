import { Link, useLocation } from 'react-router-dom'
import { 
  FiCalendar, 
  FiUsers, 
  FiSettings, 
  FiHome,
  FiScissors,
  FiUserCheck,
  FiPackage
} from 'react-icons/fi'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  const menuItems = [
    { path: '/', icon: FiHome, label: 'Ana Sayfa' },
    { path: '/randevular', icon: FiCalendar, label: 'Randevular' },
    { path: '/hizmetler', icon: FiScissors, label: 'Hizmetler' },
    { path: '/personeller', icon: FiUserCheck, label: 'Personeller' },
    { path: '/musteriler', icon: FiUsers, label: 'Müşteriler' },
    { path: '/paket-satislari', icon: FiPackage, label: 'Paket Satışları' },
  ];
  
  
  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      
      {/* Logo ve başlık */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div>
            <h2 className="text-xl font-bold text-blue-600">Krasa</h2>
            <p className="text-sm text-gray-500">Randevu Yönetimi</p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path || 
                          (location.pathname === '/' && item.path === '/appointments')
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-purple-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

 
    </div>
  )
}

export default Sidebar