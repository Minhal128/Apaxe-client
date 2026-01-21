import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { instrumentService, segmentService } from '../services';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [instruments, setInstruments] = useState([]);
  const [segments, setSegments] = useState([]);
  const [selectedSegment, setSelectedSegment] = useState('MCX2');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [hasApiError, setHasApiError] = useState(false); // Track if it's an API error vs empty data

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSegment && (segments.length > 0 || selectedSegment === 'MCX2')) {
      fetchInstruments();
    }
  }, [selectedSegment, segments]);

  const fetchData = async () => {
    try {
      console.log('Fetching segments...');
      const segmentsRes = await segmentService.getSegments();
      console.log('Segments response:', segmentsRes);
      // Handle nested response: { data: { segments: [...] } }
      const segmentsList = segmentsRes?.data?.segments || segmentsRes?.segments || [];
      setSegments(segmentsList);
      
      // Trigger instruments fetch after segments are loaded
      if (selectedSegment) {
        setTimeout(() => fetchInstruments(), 100);
      }
    } catch (err) {
      console.error('Error fetching segments:', err);
    }
  };

  const fetchInstruments = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasApiError(false);
      console.log('Fetching instruments for segment:', selectedSegment);
      
      // Map UI segment names to segment IDs for filtering
      const segmentIdMap = {
        'MCX2': '6946a6bb2056b8e4a5319327',
        'Forex': 'FOREX',
        'NSE': 'NSE',
        'Equity': 'NSE',
        'Commodity': 'MCX'
      };
      
      const segmentId = segmentIdMap[selectedSegment];
      console.log('Segment ID:', segmentId);
      
      // Fetch instruments directly from /instruments endpoint (more reliable)
      const params = segmentId ? { segment: segmentId } : {};
      const res = await instrumentService.getInstruments(params);
      console.log('Instruments response:', res);
      
      // The response structure is { success: true, data: [...], meta: {...} }
      const instrumentsData = res?.data || [];
      
      // Transform instrument data to match expected format
      const transformedData = instrumentsData.map(item => ({
        id: item.id,
        symbol: item.symbol,
        name: item.name || item.displayName || item.symbol,
        lastPrice: item.lastPrice || item.bidPrice || 0,
        price: item.lastPrice || item.bidPrice || 0,
        changePercent: item.changePercent || 0,
        volume: item.volume || 0,
        segment: item.segment?.name || selectedSegment
      }));
      
      setInstruments(transformedData);
      
      if (transformedData.length > 0) {
        console.log(`✅ Loaded ${transformedData.length} instruments`);
      }
      
    } catch (err) {
      console.log('Error fetching instruments:', err.message);
      setError('Unable to load market data. Please check your connection.');
      setHasApiError(true);
      setInstruments([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstruments = instruments.filter(i => 
    !searchQuery || i.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
  );
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
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Position Filters */}
      <View style={styles.positionFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.positionFilters}>
            {['Crypto', 'MCX2', 'Forex', 'NSE', 'Equity', 'Commodity'].map((seg) => (
              <TouchableOpacity 
                key={seg}
                style={[styles.filterButton, selectedSegment === seg && styles.filterButtonActive]}
                onPress={() => setSelectedSegment(seg)}
              >
                <Text style={selectedSegment === seg ? styles.filterTextActive : styles.filterText}>{seg}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Crypto List */}
      <ScrollView style={styles.cryptoList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.loadingText}>Loading instruments...</Text>
          </View>
        ) : error && hasApiError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubText}>Please check your internet connection and try again</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchInstruments}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredInstruments.length > 0 ? filteredInstruments.map((crypto) => (
          <TouchableOpacity
            key={crypto.id || crypto.symbol}
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('CoinChart', { symbol: crypto.symbol, instrumentId: crypto.id, isLoggedIn: false })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>{crypto.symbol}</Text>
              <Text style={styles.cryptoVolume}>{crypto.volume ? `${crypto.volume} USDT` : crypto.name}</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>{(crypto.lastPrice || crypto.price || 0).toLocaleString()}</Text>
              <View
                style={[
                  styles.changeContainer,
                  { backgroundColor: (crypto.changePercent || 0) >= 0 ? colors.green : colors.red },
                ]}
              >
                <Text style={styles.changeText}>
                  {(crypto.changePercent || 0) >= 0 ? '+' : ''}{(crypto.changePercent || 0).toFixed(2)}%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="bar-chart-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.noDataText}>No instruments available</Text>
            <Text style={styles.noDataSubText}>
              {selectedSegment === 'MCX2' 
                ? 'MCX2 instruments are being loaded...' 
                : `No ${selectedSegment} instruments found in the database`}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navbar */}
      <View style={[styles.bottomNavbar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('TradeOriginal', { isLoggedIn: false })}
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
    paddingBottom: 100,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  errorText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  noDataText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noDataSubText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
