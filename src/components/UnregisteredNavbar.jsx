import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

export default function UnregisteredNavbar({ navigation, activeScreen = 'home' }) {
  const insets = useSafeAreaInsets();
  
  // Safe navigation to home - handles both auth and unauth stacks
  const navigateToHome = () => {
    try {
      // Try InitialHome first (unauth stack)
      navigation.navigate('InitialHome');
    } catch (e) {
      // Fallback to Home (auth stack)
      navigation.navigate('Home');
    }
  };
  
  return (
    <View style={[styles.bottomNavbar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
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
          Home
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => {
          // Navigate to TradeOriginal without resetting the stack
          navigation.navigate('TradeOriginal', { isLoggedIn: false });
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
          Trade
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.walletButton}
        onPress={() => navigation.navigate('Wallet')}
      >
        <Ionicons name="wallet" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Position')}
      >
        <Ionicons 
          name="grid" 
          size={24} 
          color={activeScreen === 'Position' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'Position' ? colors.textPrimary : colors.textSecondary }
        ]}>
          Position
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons 
          name="person" 
          size={24} 
          color={activeScreen === 'Profile' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'Profile' ? colors.textPrimary : colors.textSecondary }
        ]}>
          Profile
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
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
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
    backgroundColor: colors.green,
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
