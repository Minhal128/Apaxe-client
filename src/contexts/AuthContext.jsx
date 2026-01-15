import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const clerkAuth = useClerkAuth();
  const clerkSignedIn = clerkAuth?.isSignedIn || false;
  const clerkLoaded = clerkAuth?.isLoaded ?? false;
  const clerkSignOut = clerkAuth?.signOut;
  
  const [isBackendLoggedIn, setIsBackendLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check if user is logged in via backend on app start
  useEffect(() => {
    checkBackendAuth();
  }, []);

  const checkBackendAuth = async () => {
    try {
      const token = await api.getToken();
      if (token) {
        const cachedUser = await authService.getUser();
        setUser(cachedUser);
        setIsBackendLoggedIn(true);
      } else {
        setIsBackendLoggedIn(false);
      }
    } catch (error) {
      // Don't crash on auth check failure - just log and continue
      if (__DEV__) {
        console.error('Error checking backend auth:', error);
      }
      setIsBackendLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // User is authenticated if logged in via Clerk (Google) OR backend (email/password)
  const isAuthenticated = clerkSignedIn || isBackendLoggedIn;
  const isLoaded = (clerkLoaded === true) && !isLoading;

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    if (response.success) {
      const cachedUser = await authService.getUser();
      setUser(cachedUser);
      setIsBackendLoggedIn(true);
    }
    return response;
  };

  const register = async (data) => {
    return authService.register(data);
  };

  const logout = async () => {
    try {
      // Logout from backend
      await authService.logout();
      setIsBackendLoggedIn(false);
      setUser(null);

      // Also logout from Clerk if signed in via Google
      if (clerkSignedIn) {
        await clerkSignOut();
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  const value = {
    isAuthenticated,
    isLoaded,
    isBackendLoggedIn,
    isClerkSignedIn: clerkSignedIn,
    user,
    login,
    register,
    logout,
    refreshUser,
    checkBackendAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAppAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
