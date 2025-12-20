import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Svg, Path, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import RegisteredNavbar from '../components/RegisteredNavbar';
import UnregisteredNavbar from '../components/UnregisteredNavbar';
import { instrumentService, watchlistService } from '../services';

const categories = ['Crypto', 'MCX', 'MCX2', 'Forex', 'NSE', 'Equity', 'Commodity'];

// Mini chart component
const MiniChart = ({ isPositive }) => {
  const points = isPositive 
    ? "0,20 10,18 20,15 30,12 40,10 50,8"
    : "0,10 10,12 20,15 30,13 40,16 50,20";
  
  return (
    <Svg height="30" width="60" style={{ marginTop: 8 }}>
      <Polyline
        points={points}
        fill="none"
        stroke={isPositive ? colors.green : colors.red}
        strokeWidth="2"
      />
    </Svg>
  );
};

export default function TradeScreen({ route, navigation }) {
  const { isLoggedIn = false } = route?.params || {};
  const [activeTab, setActiveTab] = useState('Top gainers');
  const [selectedCategory, setSelectedCategory] = useState('Crypto');
  const [topMovers, setTopMovers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    fetchInstruments();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching top movers...');
      const moversRes = await instrumentService.getTopMovers();
      console.log('Top movers response:', moversRes);
      // Handle response: { data: [...] }
      const data = Array.isArray(moversRes?.data) ? moversRes.data : [];
      setTopMovers(data);
      
      if (data.length === 0 && moversRes.success) {
        setError('No market data available. This is normal if the database is not seeded yet.');
      }
    } catch (err) {
      console.log('Error fetching top movers (this is normal if not authenticated):', err.message);
      setError('Unable to load market data. Please login to view live prices.');
      setTopMovers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstruments = async () => {
    try {
      console.log('Fetching instruments for category:', selectedCategory);
      // Backend uses 'search' parameter for filtering
      const res = await instrumentService.getInstruments({ search: selectedCategory });
      console.log('Instruments response:', res);
      // Handle response: { data: [...] }
      const data = Array.isArray(res?.data) ? res.data : [];
      setInstruments(data);
    } catch (err) {
      console.log('Error fetching instruments (this is normal if not authenticated):', err.message);
      setInstruments([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    await fetchInstruments();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trade</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Top gainers' && styles.tabActive]}
          onPress={() => setActiveTab('Top gainers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Top gainers' && styles.tabTextActive,
            ]}
          >
            Top gainers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Top losers' && styles.tabActive]}
          onPress={() => setActiveTab('Top losers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Top losers' && styles.tabTextActive,
            ]}
          >
            Top losers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Most active' && styles.tabActive]}
          onPress={() => setActiveTab('Most active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Most active' && styles.tabTextActive,
            ]}
          >
            Most active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Favorites' && styles.tabActive]}
          onPress={() => setActiveTab('Favorites')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Favorites' && styles.tabTextActive,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gainers List */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubText}>Make sure the backend server is running on port 3000</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.gainersScrollView}
              contentContainerStyle={styles.gainersListContainer}
            >
              {topMovers.length > 0 ? topMovers.map((item) => (
                <TouchableOpacity
                  key={item.id || item.symbol}
                  style={styles.gainerCard}
                  onPress={() => navigation.navigate('Chart', { symbol: item.symbol, instrumentId: item.id })}
                >
                  <View style={styles.gainerHeader}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.iconText}>{item.symbol?.[0] || 'X'}</Text>
                    </View>
                    <View style={styles.gainerHeaderRight}>
                      <Text style={styles.gainerName}>{item.symbol || item.name}</Text>
                      <Text style={[styles.gainerChange, { color: (item.changePercent || 0) >= 0 ? colors.green : colors.red }]}>
                        {(item.changePercent || 0) >= 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.gainerPrice}>{(item.lastPrice || item.price || 0).toLocaleString()}</Text>
                  <MiniChart isPositive={(item.changePercent || 0) >= 0} />
                </TouchableOpacity>
              )) : (
                <Text style={{ color: colors.textSecondary, padding: 20 }}>No data available</Text>
              )}
            </ScrollView>

            {/* Categories */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Instruments List */}
            {instruments.map((item) => (
              <TouchableOpacity
                key={item.id || item.symbol}
                style={styles.instrumentCard}
                onPress={() => navigation.navigate('Chart', { symbol: item.symbol, instrumentId: item.id })}
              >
                <View style={styles.instrumentLeft}>
                  <View style={styles.instrumentIcon}>
                    <Text style={styles.instrumentIconText}>{item.symbol?.[0] || 'X'}</Text>
                  </View>
                  <View>
                    <Text style={styles.instrumentSymbol}>{item.symbol}</Text>
                    <Text style={styles.instrumentName}>{item.name}</Text>
                  </View>
                </View>
                <View style={styles.instrumentRight}>
                  <Text style={styles.instrumentPrice}>{(item.lastPrice || 0).toLocaleString()}</Text>
                  <Text style={[styles.instrumentChange, { color: (item.changePercent || 0) >= 0 ? colors.green : colors.red }]}>
                    {(item.changePercent || 0) >= 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Crypto List */}
        <View style={styles.cryptoList}>
          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'BTC/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>BTC/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changeNegative]}>
                <Text style={styles.changeText}>-1.67%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'SOL/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>SOL/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changePositive]}>
                <Text style={styles.changeText}>1.27%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'ETH/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>ETH/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changePositive]}>
                <Text style={styles.changeText}>1.27%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'TRON/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>TRON/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changePositive]}>
                <Text style={styles.changeText}>1.27%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'XRP/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>XRP/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changeNegative]}>
                <Text style={styles.changeText}>-1.67%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'BNB/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>BNB/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changeNegative]}>
                <Text style={styles.changeText}>-1.67%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navbar */}
      {isLoggedIn ? (
        <RegisteredNavbar navigation={navigation} activeScreen="Trade" />
      ) : (
        <UnregisteredNavbar navigation={navigation} activeScreen="Trade" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  gainersList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  gainersScrollView: {
    marginTop: 16,
    marginBottom: 16,
  },
  gainersListContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 140,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gainerHeaderRight: {
    marginLeft: 8,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3D4262',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
  },
  gainerInfo: {
    alignItems: 'center',
    marginBottom: 4,
  },
  gainerName: {
    color: '#2C2F3E',
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  gainerChange: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '500',
  },
  gainerPrice: {
    color: '#2C2F3E',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    maxHeight: 50,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
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
  cryptoList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cryptoCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
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
    fontWeight: '600',
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
    fontWeight: '600',
    marginBottom: 4,
  },
  changeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  changePositive: {
    backgroundColor: colors.green,
  },
  changeNegative: {
    backgroundColor: colors.red,
  },
  changeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
    paddingTop: 80,
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
});
