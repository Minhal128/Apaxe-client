import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function RegisteredNavbar({ navigation, activeScreen = 'home' }) {
  return (
    <View style={styles.bottomNavbar}>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => {
          console.log('Home button pressed, navigating to MainTabs');
          navigation.navigate('MainTabs');
        }}
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
        onPress={() => navigation.navigate('Chart', { symbol: 'BTC/USDT', isLoggedIn: true })}
      >
        <Ionicons 
          name="bar-chart" 
          size={24} 
          color={activeScreen === 'Chart' ? colors.textPrimary : colors.textSecondary} 
        />
        <Text style={[
          styles.navLabel, 
          { color: activeScreen === 'Chart' ? colors.textPrimary : colors.textSecondary }
        ]}>
          Trade
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.walletButton}
        onPress={() => navigation.navigate('WalletLoggedIn')}
      >
        <Ionicons name="wallet" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => navigation.navigate('PositionLoggedIn')}
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
          Position
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => {
          console.log('Profile button pressed, navigating to ProfileLoggedIn');
          navigation.navigate('ProfileLoggedIn');
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
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
