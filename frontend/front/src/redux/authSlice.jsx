import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { API_BASE_URL } from '../config/api';

// Login thunk
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Giriş başarısız');
      }

      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data.data;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Register thunk (sadece admin kullanabilir)
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Kayıt başarısız');
      }

      return data.data.user;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Get profile thunk
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Profil alınamadı');
      }

      return data.data.user;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Get all users thunk (sadece admin)
export const getAllUsers = createAsyncThunk(
  'auth/getAllUsers',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Kullanıcılar alınamadı');
      }

      return data.data;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Update permissions thunk (sadece admin)
export const updatePermissions = createAsyncThunk(
  'auth/updatePermissions',
  async ({ userId, permissions }, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ permissions }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'İzinler güncellenemedi');
      }

      return data.data.user;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Toggle user status thunk (sadece admin)
export const toggleUserStatus = createAsyncThunk(
  'auth/toggleUserStatus',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Kullanıcı durumu değiştirilemedi');
      }

      return data.data.user;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Delete user thunk (sadece admin)
export const deleteUser = createAsyncThunk(
  'auth/deleteUser',
  async (userId, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.message || 'Kullanıcı silinemedi');
      }

      return userId;
    } catch (error) {
      return rejectWithValue('Bağlantı hatası');
    }
  }
);

// Initial state
const initialState = {
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  users: [],
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.users = [];
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      // Kullanıcıyı normalize et: _id yoksa id'yi _id yap
      const normalizedUser = { ...user, _id: user._id || user.id };
      state.user = normalizedUser;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        // Kullanıcıyı normalize et (_id garanti)
        const normalizedUser = { ...action.payload.user, _id: action.payload.user._id || action.payload.user.id };
        state.user = normalizedUser;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        // Yeni kullanıcıyı users listesine ekle
        state.users.push(action.payload);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        // Kullanıcıyı normalize et (_id garanti)
        const normalizedUser = { ...action.payload, _id: action.payload._id || action.payload.id };
        state.user = normalizedUser;
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        if (action.payload.includes('token')) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      })
      
      // Get All Users
      .addCase(getAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Permissions
      .addCase(updatePermissions.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.users.findIndex(user => user._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], permissions: updatedUser.permissions };
        }
        
        // Eğer güncellenen kullanıcı mevcut kullanıcıysa, state.user'ı da güncelle
        if (state.user && state.user._id === updatedUser._id) {
          state.user = { ...state.user, permissions: updatedUser.permissions };
          localStorage.setItem('user', JSON.stringify(state.user));
        }
      })
      
      // Toggle User Status
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.users.findIndex(user => user._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], isActive: updatedUser.isActive };
        }
      })
      // Delete User
      .addCase(deleteUser.fulfilled, (state, action) => {
        const deletedUserId = action.payload;
        state.users = state.users.filter(user => user._id !== deletedUserId);
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;

// Selectors
// Selectors
export const selectCurrentUser = createSelector(
  (state) => state.auth.user,
  (user) => {
    if (!user) return null;
    // _id yoksa id’yi _id olarak map et
    return user._id ? user : { ...user, _id: user.id };
  }
);
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectAllUsers = (state) => state.auth.users;

// Memoized selector for user permissions
export const selectUserPermissions = createSelector(
  [selectCurrentUser],
  (user) => user?.permissions || {}
);

export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;