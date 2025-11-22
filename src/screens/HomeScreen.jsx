import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const cryptoData = [
  { symbol: 'BTC/USDT', volume: '770M USDT', price: '11,0263.8', change: '-1.67%', isPositive: false },
  { symbol: 'SOL/USDT', volume: '770M USDT', price: '11,0263.8', change: '1.27%', isPositive: true },
  { symbol: 'ETH/USDT', volume: '770M USDT', price: '11,0263.8', change: '1.27%', isPositive: true },
  { symbol: 'TRON/USDT', volume: '770M USDT', price: '11,0263.8', change: '1.27%', isPositive: true },
  { symbol: 'XRP/USDT', volume: '770M USDT', price: '11,0263.8', change: '-1.67%', isPositive: false },
];


export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Logo/Illustration */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoEmoji}>💰</Text>
          <Text style={styles.logoEmoji}>📈</Text>
          <Text style={styles.logoEmoji}></Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Experience Real-Time Trading{'\n'}Video, without the Risk.
        </Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInButtonText}>Sign in/ Sign up</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coin"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Position Filters */}
      <View style={styles.positionFiltersContainer}>
        <View style={styles.positionFilters}>
          <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
            <Text style={styles.filterTextActive}>Crypto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>MCX</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Forex</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>NSE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Equity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterText}>Commodity</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Crypto List */}
      <ScrollView style={styles.cryptoList} showsVerticalScrollIndicator={false}>
        {cryptoData.map((crypto) => (
          <TouchableOpacity
            key={crypto.symbol}
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: crypto.symbol, isLoggedIn: false })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
              <Text style={styles.cryptoVolume}>{crypto.volume}</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>{crypto.price}</Text>
              <View
                style={[
                  styles.changeContainer,
                  { backgroundColor: crypto.isPositive ? colors.green : colors.red },
                ]}
              >
                <Text style={styles.changeText}>{crypto.change}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navbar */}
      <View style={styles.bottomNavbar}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Chart', { symbol: 'BTC/USDT', isLoggedIn: false })}
        >
          <Ionicons name="bar-chart" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Trade</Text>
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
          <Ionicons name="grid" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>More</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Profile')}
        >
          <Ionicons name="person" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  logoEmoji: {
    fontSize: 30,
    marginHorizontal: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: colors.green,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  signInButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    maxHeight: 50,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  positionFiltersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  positionFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterTextActive: {
    color: colors.background,
    fontSize: 13,
    fontWeight: '600',
  },
  totalAmount: {
    color: '#4A9FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cryptoList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cryptoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cryptoLeft: {
    flex: 1,
  },
  cryptoSymbol: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cryptoVolume: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cryptoRight: {
    alignItems: 'flex-end',
  },
  cryptoPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  changeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
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
  },
  navLabel: {
    fontSize: 11,
    color: colors.textPrimary,
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
