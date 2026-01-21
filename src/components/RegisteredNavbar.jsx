import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppAuth } from '../contexts/AuthContext';

export default function RegisteredNavbar({ navigation, activeScreen = 'home' }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { isAuthenticated } = useAppAuth();
  const insets = useSafeAreaInsets();
  
  // Navigate to home safely - reset to MainTabs
  const navigateToHome = () => {
    if (isAuthenticated) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } else {
      navigation.navigate('InitialHome');
    }
  };
  
  return (
    <View style={[styles.bottomNavbar, { backgroundColor: colors.cardBackground, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={navigateToHome}
      >
        <Ionicons 
          name="home" 
          size={24} 
          color={activeScreen === 'home' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'home' ? colors.textPrimary : colors.textSecondary }
        ]}>
          {t.home}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => {
          if (isAuthenticated) {
            // Use reset to clear stack and navigate to TradeOriginal
            navigation.reset({
              index: 0,
              routes: [{ name: 'TradeOriginal', params: { isLoggedIn: true } }],
            });
          } else {
            navigation.navigate('TradeOriginal', { isLoggedIn: false });
          }
        }}
      >
        <Ionicons 
          name="bar-chart" 
          size={24} 
          color={activeScreen === 'Trade' || activeScreen === 'TradeOriginal' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'Trade' || activeScreen === 'TradeOriginal' ? colors.textPrimary : colors.textSecondary }
        ]}>
          {t.trade}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.walletButton, { backgroundColor: colors.green }]}
        onPress={() => {
          if (isAuthenticated) {
            navigation.navigate('WalletLoggedIn');
          } else {
            navigation.navigate('Wallet');
          }
        }}
      >
        <Ionicons name="wallet" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => {
          if (isAuthenticated) {
            navigation.navigate('PositionLoggedIn');
          } else {
            navigation.navigate('Position');
          }
        }}
      >
        <Ionicons 
          name="grid" 
          size={24} 
          color={activeScreen === 'PositionLoggedIn' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'PositionLoggedIn' ? colors.textPrimary : colors.textSecondary }
        ]}>
          {t.position}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => {
          if (isAuthenticated) {
            console.log('Profile button pressed, navigating to ProfileLoggedIn');
            navigation.navigate('ProfileLoggedIn');
          } else {
            console.log('Profile button pressed, navigating to Profile (not logged in)');
            navigation.navigate('Profile');
          }
        }}
      >
        <Ionicons 
          name="person" 
          size={24} 
          color={activeScreen === 'ProfileLoggedIn' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'ProfileLoggedIn' ? colors.textPrimary : colors.textSecondary }
        ]}>
          {t.profile}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    minHeight: 60,
  },
  navLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  walletButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
