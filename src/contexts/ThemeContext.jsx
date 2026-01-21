import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

export const lightColors = {
  // Main colors
  primary: '#00D68F',
  danger: '#FF4757',
  
  // Background colors
  background: '#F5F7FA',
  cardBackground: '#FFFFFF',
  inputBackground: '#F0F2F5',
  
  // Text colors
  textPrimary: '#1A1D2E',
  textSecondary: '#6B6E7F',
  textGray: '#8F92A1',
  
  // UI elements
  border: '#E5E7EB',
  green: '#00D68F',
  red: '#FF4757',
  yellow: '#FFB800',
  blue: '#5B8DEE',
  
  // Opacity variants
  greenOpacity: 'rgba(0, 214, 143, 0.1)',
  redOpacity: 'rgba(255, 71, 87, 0.1)',
};

export const darkColors = {
  // Main colors
  primary: '#00D68F',
  danger: '#FF4757',
  
  // Background colors
  background: '#1A1D2E',
  cardBackground: '#252838',
  inputBackground: '#2F3347',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#8F92A1',
  textGray: '#6B6E7F',
  
  // UI elements
  border: '#3A3D4E',
  green: '#00D68F',
  red: '#FF4757',
  yellow: '#FFB800',
  blue: '#5B8DEE',
  
  // Opacity variants
  greenOpacity: 'rgba(0, 214, 143, 0.1)',
  redOpacity: 'rgba(255, 71, 87, 0.1)',
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('Dark'); // Always Dark
  const [colors, setColors] = useState(darkColors); // Always use dark colors

  useEffect(() => {
    // Always use dark theme
    setColors(darkColors);
  }, []);

  const changeTheme = async (mode) => {
    // Theme changing is disabled - always stay dark
    console.log('Theme changing is disabled - app uses dark theme only');
  };

  return (
    <ThemeContext.Provider value={{ themeMode: 'Dark', colors: darkColors, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
