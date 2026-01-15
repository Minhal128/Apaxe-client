import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants/api';

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = 10000; // 10 second timeout
    this.tokenProvider = null;
  }

  setTokenProvider(provider) {
    this.tokenProvider = provider;
  }

  async getToken() {
    // First try to get token from AsyncStorage (backend login)
    const storedToken = await AsyncStorage.getItem('token');
    if (storedToken) {
      return storedToken;
    }
    
    // Fall back to Clerk token provider (Google OAuth)
    if (this.tokenProvider) {
      return await this.tokenProvider();
    }
    
    return null;
  }

  async setToken(token) {
    await AsyncStorage.setItem('token', token);
  }

  async setRefreshToken(token) {
    await AsyncStorage.setItem('refreshToken', token);
  }

  async clearTokens() {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const url = `${this.baseURL}${endpoint}`;
    console.log('API Request:', url);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('API Response status:', response.status);

      const data = await response.json();
      console.log('API Response data:', JSON.stringify(data).substring(0, 200));

      // Don't throw errors for authentication issues - let the services handle them
      if (!response.ok) {
        // For authentication errors, return the error data instead of throwing
        if (response.status === 401 || (data.error && data.error.code === 'AUTHENTICATION_ERROR')) {
          return {
            success: false,
            error: data.error || { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' },
            status: response.status
          };
        }

        // For validation errors, return the error data instead of throwing
        if (response.status === 400 || (data.error && data.error.code === 'VALIDATION_ERROR')) {
          return {
            success: false,
            error: data.error || { code: 'VALIDATION_ERROR', message: 'Validation failed' },
            status: response.status
          };
        }

        // For forbidden errors, return the error data instead of throwing
        if (response.status === 403 || (data.error && data.error.code === 'FORBIDDEN_ERROR')) {
          return {
            success: false,
            error: data.error || { code: 'FORBIDDEN_ERROR', message: 'Access forbidden' },
            status: response.status
          };
        }

        // For other errors, still throw
        throw new Error(data.message || data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('API Request timed out:', url);
        throw new Error('Request timed out');
      }

      // Don't log authentication errors as errors - they're expected
      if (error.message && (error.message.includes('Authentication') || error.message.includes('No token'))) {
        console.log('Authentication required for:', url);
      } else {
        console.error('API Error:', error.message);
      }
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  }

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export default new ApiService();
