import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { 
  getAllUsers, 
  register, 
  updatePermissions, 
  toggleUserStatus,
  deleteUser,
  clearError 
} from '../redux/authSlice';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  Check, 
  X,
  AlertCircle,
  Save
} from 'lucide-react';

const AdminPanel = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.auth);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [permissions, setPermissions] = useState({});
  // Kullanıcı silme onayı için state ekliyorum
  const [userToDelete, setUserToDelete] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    name: '',
    phone: '',
    gender: '',
    job: ''
  });

  useEffect(() => {
    dispatch(getAllUsers());
  }, [dispatch]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await dispatch(register(newUser)).unwrap();
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'employee',
        name: '',
        phone: '',
        gender: '',
        job: ''
      });
      setShowAddUser(false);
      toast.success('Kullanıcı başarıyla eklendi!');
    } catch (error) {
      console.error('Kullanıcı eklenirken hata:', error);
      toast.error(error || 'Kullanıcı oluşturulurken bir hata oluştu!');
    }
  };

  const handleToggleStatus = (userId) => {
    // Kullanıcı aktifse (silme işlemi için) onay iste
    const user = users.find(u => u._id === userId);
    if (user && user.isActive) {
      setUserToDelete(userId);
      setConfirmModalOpen(true);
    } else {
      // Pasif kullanıcıyı aktifleştirme işlemi doğrudan yapılabilir
      dispatch(toggleUserStatus(userId));
      toast.success('Kullanıcı durumu güncellendi!');
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      dispatch(deleteUser(userToDelete))
        .unwrap()
        .then(() => {
          toast.success('Kullanıcı başarıyla silindi!');
        })
        .catch((error) => {
          toast.error(error || 'Kullanıcı silinirken bir hata oluştu!');
        });
    }
    setConfirmModalOpen(false);
    setUserToDelete(null);
  };
  
  const handlePermissionChange = (permission, value) => {
    setEditingPermissions(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const handleSavePermissions = async () => {
    try {
      await dispatch(updatePermissions({
        userId: editingPermissions._id,
        permissions: editingPermissions.permissions
      })).unwrap();
      setEditingPermissions(null);
      toast.success('İzinler başarıyla güncellendi!');
    } catch (error) {
      console.error('İzin güncelleme hatası:', error);
      toast.error(error || 'İzinler güncellenirken hata oluştu!');
    }
  };

  const permissionLabels = {
    canViewAppointments: 'Randevuları Görüntüle',
    canEditAppointments: 'Randevuları Düzenle',
    canViewCustomers: 'Müşterileri Görüntüle',
    canEditCustomers: 'Müşterileri Düzenle',
    canViewUsers: 'Kullanıcıları Görüntüle',
    canEditUsers: 'Kullanıcıları Düzenle',
    canViewServices: 'Hizmetleri Görüntüle',
    canEditServices: 'Hizmetleri Düzenle',
    canViewPackages: 'Paketleri Görüntüle',
    canEditPackages: 'Paketleri Düzenle'
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-purple-600" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-1">Kullanıcı yönetimi ve sistem ayarları</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center transition duration-200"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={() => dispatch(clearError())}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Kullanıcılar ({users?.length || 0})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Giriş
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'Personel'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('tr-TR') : 'Hiç'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {user.role !== 'admin' && (
                        <>
                          <button
                            onClick={() => setEditingPermissions({
                              ...user,
                              permissions: user.permissions || {}
                            })}
                            className="text-blue-600 hover:text-blue-900"
                            title="İzinleri Düzenle"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`${
                              user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={user.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                          >
                            {user.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Yeni Kullanıcı Ekle</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad
                </label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    // Username'i otomatik olarak name'den oluştur (boşlukları kaldır, küçük harf yap)
                    const username = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
                    setNewUser({...newUser, name, username});
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="employee">Personel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role === 'employee' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      required={newUser.role === 'employee'}
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cinsiyet
                    </label>
                    <select
                      value={newUser.gender}
                      onChange={(e) => setNewUser({...newUser, gender: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required={newUser.role === 'employee'}
                    >
                      <option value="">Cinsiyet Seçiniz</option>
                      <option value="kadın">Kadın</option>
                      <option value="erkek">Erkek</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Görev
                    </label>
                    <select
                      value={newUser.job || ''}
                      onChange={(e) => setNewUser({...newUser, job: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required={newUser.role === 'employee'}
                    >
                      <option value="">Görev Seçiniz</option>
                      <option value="manikür">Manikür</option>
                      <option value="cilt bakım uzmanı">Cilt Bakım Uzmanı</option>
                      <option value="epilasyon uzmanı">Epilasyon Uzmanı</option>
                    </select>
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Permissions Modal */}
      {editingPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              İzinleri Düzenle - {editingPermissions.username}
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(permissionLabels).map(([permission, label]) => (
                <div key={permission} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPermissions.permissions[permission] || false}
                      onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => setEditingPermissions(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleSavePermissions}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Kullanıcıyı Sil</h3>
            <p className="mb-6">Kullanıcıyı silmek istediğinizden emin misiniz?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;