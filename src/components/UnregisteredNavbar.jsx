import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { useLanguage } from '../contexts/LanguageContext';

export default function UnregisteredNavbar({ navigation, activeScreen = 'home' }) {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

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
      {/* Home */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={navigateToHome}
      >
        <Ionicons
          name="home-outline"
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

      {/* Trade */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => {
          navigation.navigate('TradeOriginal', { isLoggedIn: false });
        }}
      >
        <Ionicons
          name="bar-chart-outline"
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

      {/* Market */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('MarketWatch', { isLoggedIn: false })}
      >
        <TouchableOpacity
          style={styles.walletIconContainer}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Ionicons name="wallet" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons
          name="analytics-outline"
          size={24}
          color={activeScreen === 'Watchlist' || activeScreen === 'MarketWatch' ? colors.textPrimary : colors.textSecondary}
        />
        <Text style={[
          styles.navLabel,
          { color: activeScreen === 'Watchlist' || activeScreen === 'MarketWatch' ? colors.textPrimary : colors.textSecondary }
        ]}>
          {t.market}
        </Text>
      </TouchableOpacity>

      {/* Position */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Position')}
      >
        <Ionicons
          name="grid-outline"
          size={24}
          color={activeScreen === 'Position' ? colors.textPrimary : colors.textSecondary}
        />
        <Text style={[
          styles.navLabel,
          { color: activeScreen === 'Position' ? colors.textPrimary : colors.textSecondary }
        ]}>
          {t.position}
        </Text>
      </TouchableOpacity>

      {/* Profile */}
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons
          name="person-outline"
          size={24}
          color={activeScreen === 'Profile' ? colors.textPrimary : colors.textSecondary}
        />
        <Text style={[
          styles.navLabel,
          { color: activeScreen === 'Profile' ? colors.textPrimary : colors.textSecondary }
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
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '20%',
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  walletIconContainer: {
    position: 'absolute',
    top: -70,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
});
