import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    // Backend returns accessToken, not token
    const token = res.data?.accessToken || res.data?.token;
    const refreshToken = res.data?.refreshToken;
    const user = res.data?.user;
    
    if (token) {
      await api.setToken(token);
      if (refreshToken) {
        await api.setRefreshToken(refreshToken);
      }
      if (user) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    }
    return res;
  },

  async register(data) {
    return api.post('/auth/register', data);
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors, clear tokens anyway
    }
    await api.clearTokens();
  },

  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, password) {
    return api.post('/auth/reset-password', { token, password });
  },

  async changePassword(currentPassword, newPassword) {
    return api.post('/auth/change-password', { currentPassword, newPassword });
  },

  async refreshToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const res = await api.post('/auth/refresh-token', { refreshToken });
    if (res.data?.token) {
      await api.setToken(res.data.token);
    }
    return res;
  },

  async getUser() {
    // First try to get from cache
    const cachedUser = await AsyncStorage.getItem('user');
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }
    return null;
  },

  async getProfile() {
    // Fetch fresh profile from API
    const res = await api.get('/auth/profile');
    if (res.success && res.data) {
      // Update cached user data
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user || res.data));
      return res.data.user || res.data;
    }
    return null;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/profile', data);
    if (res.success && res.data) {
      // Update cached user data
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user || res.data));
    }
    return res;
  },

  async isLoggedIn() {
    const token = await api.getToken();
    return !!token;
  },
};

export default authService;
