import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Svg, Polyline, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import RegisteredNavbar from '../components/RegisteredNavbar';
import UnregisteredNavbar from '../components/UnregisteredNavbar';
import { instrumentService, watchlistService } from '../services';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 56) / 2.5;

const tabs = ['Top gainers', 'Top losers', 'Most active', 'Favorites'];
const categories = ['Crypto', 'MCX', 'Forex', 'NSE', 'Equity', 'Commodity'];

// Icon mapping for different symbols
const ICON_CONFIG = {
  'BTC': { icon: '₿', color: '#F7931A', bg: '#FFFFFF' },
  'ETH': { icon: '◊', color: '#627EEA', bg: '#FFFFFF' },
  'SOL': { icon: '◎', color: '#00FFA3', bg: '#FFFFFF' },
  'XRP': { icon: '✕', color: '#23292F', bg: '#FFFFFF' },
  'BNB': { icon: '⬡', color: '#F3BA2F', bg: '#FFFFFF' },
  'TRX': { icon: '◈', color: '#FF0013', bg: '#FFFFFF' },
  'TRON': { icon: '◈', color: '#FF0013', bg: '#FFFFFF' },
  'AXIS': { icon: 'A', color: '#97144D', bg: '#FFFFFF' },
  'AXISBANK': { icon: 'A', color: '#97144D', bg: '#FFFFFF' },
  'SBIN': { icon: 'Ⓢ', color: '#0066B2', bg: '#FFFFFF' },
  'NIFTY': { icon: '₹', color: '#1A1A2E', bg: '#FFFFFF' },
  'NIFTY50': { icon: '₹', color: '#1A1A2E', bg: '#FFFFFF' },
  'GOLD': { icon: '◉', color: '#FFD700', bg: '#FFFFFF' },
  'SILVER': { icon: '◉', color: '#C0C0C0', bg: '#FFFFFF' },
  'CRUDE': { icon: '◉', color: '#000000', bg: '#FFFFFF' },
  'DEFAULT': { icon: '●', color: '#5B8DEE', bg: '#FFFFFF' },
};

// Get icon config for symbol
const getIconConfig = (symbol) => {
  const baseSymbol = symbol?.split('/')[0]?.toUpperCase() || '';
  return ICON_CONFIG[baseSymbol] || ICON_CONFIG.DEFAULT;
};

// Mini chart component with gradient fill
const MiniChart = ({ isPositive, data = [] }) => {
  const chartWidth = 100;
  const chartHeight = 35;
  
  const generatePath = () => {
    const points = data.length >= 2 ? data : (isPositive 
      ? [22, 20, 18, 19, 16, 14, 15, 12, 10, 8] 
      : [8, 10, 12, 11, 14, 16, 15, 18, 20, 22]);
    
    const maxVal = Math.max(...points);
    const minVal = Math.min(...points);
    const range = maxVal - minVal || 1;
    
    const pathPoints = points.map((val, i) => {
      const x = (i / (points.length - 1)) * chartWidth;
      const y = chartHeight - 5 - ((val - minVal) / range) * (chartHeight - 10);
      return `${x},${y}`;
    });
    
    const linePath = `M${pathPoints.join(' L')}`;
    const areaPath = `${linePath} L${chartWidth},${chartHeight} L0,${chartHeight} Z`;
    
    return { linePath, areaPath };
  };

  const { linePath, areaPath } = generatePath();
  const gradientId = isPositive ? 'greenGrad' : 'redGrad';
  const lineColor = isPositive ? '#00C853' : '#FF5252';
  const gradientColorStart = isPositive ? '#00C853' : '#FF5252';

  return (
    <Svg height={chartHeight} width={chartWidth} style={{ marginTop: 8 }}>
      <Defs>
        <LinearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#00C853" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#00C853" stopOpacity="0.05" />
        </LinearGradient>
        <LinearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FF5252" stopOpacity="0.3" />
          <Stop offset="1" stopColor="#FF5252" stopOpacity="0.05" />
        </LinearGradient>
      </Defs>
      <Path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      <Polyline
        points={linePath.replace('M', '')}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Format volume to readable string
const formatVolume = (volume) => {
  if (!volume) return '0';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(0)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(0)}K`;
  return volume.toString();
};

// Format price with proper decimals
const formatPrice = (price) => {
  if (!price) return '0.00';
  if (price >= 10000) {
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (price >= 1) {
    return price.toFixed(2);
  }
  return price.toFixed(4);
};

export default function TradeOriginalScreen({ route, navigation }) {
  const { isLoggedIn = false } = route?.params || {};
  const [activeTab, setActiveTab] = useState('Top gainers');
  const [selectedCategory, setSelectedCategory] = useState('Crypto');
  const [topMovers, setTopMovers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch top movers data based on active tab
  const fetchTopMovers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all market data
      const marketRes = await instrumentService.getMarketWatch('ALL');
      const allInstruments = marketRes?.data?.instruments || [];
      
      // Transform data
      const transformedData = allInstruments.map(item => ({
        id: item.instrumentId || item.id,
        symbol: item.symbol,
        name: item.name || item.symbol,
        price: item.currentPrice?.ltp || item.ltp || 0,
        changePercent: item.currentPrice?.changePercent || item.changePercent || 0,
        volume: item.currentPrice?.volume || item.volume || 0,
        segment: item.segment,
        priceHistory: item.priceHistory || []
      }));

      let sortedMovers = [];
      
      switch (activeTab) {
        case 'Top gainers':
          sortedMovers = transformedData
            .filter(item => item.changePercent > 0)
            .sort((a, b) => b.changePercent - a.changePercent)
            .slice(0, 10);
          break;
        case 'Top losers':
          sortedMovers = transformedData
            .filter(item => item.changePercent < 0)
            .sort((a, b) => a.changePercent - b.changePercent)
            .slice(0, 10);
          break;
        case 'Most active':
          sortedMovers = transformedData
            .sort((a, b) => (b.volume || 0) - (a.volume || 0))
            .slice(0, 10);
          break;
        case 'Favorites':
          if (isLoggedIn) {
            try {
              const watchlistRes = await watchlistService.getDefaultWatchlist();
              const watchlistInstruments = watchlistRes?.data?.instruments || [];
              sortedMovers = watchlistInstruments.map(item => ({
                id: item.instrumentId || item.id,
                symbol: item.symbol,
                name: item.name || item.symbol,
                price: item.currentPrice?.ltp || item.ltp || 0,
                changePercent: item.currentPrice?.changePercent || item.changePercent || 0,
                volume: item.currentPrice?.volume || item.volume || 0,
                segment: item.segment
              }));
            } catch (e) {
              console.log('Failed to fetch favorites:', e.message);
              sortedMovers = [];
            }
          }
          break;
        default:
          sortedMovers = transformedData.slice(0, 10);
      }
      
      setTopMovers(sortedMovers);
      
      if (sortedMovers.length === 0 && activeTab !== 'Favorites') {
        setError('No market data available');
      }
    } catch (err) {
      console.log('Error fetching top movers:', err.message);
      setError('Unable to load market data');
      setTopMovers([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isLoggedIn]);

  // Fetch instruments by category/segment
  const fetchInstruments = useCallback(async () => {
    try {
      setInstrumentsLoading(true);
      
      const segmentMap = {
        'Crypto': 'CRYPTO',
        'MCX': 'MCX',
        'Forex': 'FOREX',
        'NSE': 'NSE',
        'Equity': 'NSE',
        'Commodity': 'MCX'
      };
      
      const apiSegment = segmentMap[selectedCategory] || 'ALL';
      const res = await instrumentService.getMarketWatch(apiSegment);
      const fetchedInstruments = res?.data?.instruments || [];
      
      const transformedData = fetchedInstruments.map(item => ({
        id: item.instrumentId || item.id,
        symbol: item.symbol,
        name: item.name || item.symbol,
        price: item.currentPrice?.ltp || item.ltp || 0,
        changePercent: item.currentPrice?.changePercent || item.changePercent || 0,
        volume: item.currentPrice?.volume || item.volume || 0,
        segment: item.segment
      }));
      
      setInstruments(transformedData);
    } catch (err) {
      console.log('Error fetching instruments:', err.message);
      setInstruments([]);
    } finally {
      setInstrumentsLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchTopMovers();
  }, [fetchTopMovers]);

  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTopMovers(), fetchInstruments()]);
    setRefreshing(false);
  };

  // Navigate to CoinChartScreen when clicking on a coin
  const navigateToChart = async (item) => {
    // Get userId from cached user data
    let userId = null;
    try {
      const cachedUser = await AsyncStorage.getItem('cachedUser');
      if (cachedUser) {
        const user = JSON.parse(cachedUser);
        userId = user?.id || user?.email || null;
      }
    } catch (e) {
      console.log('Error getting user ID:', e);
    }
    
    navigation.navigate('CoinChart', { 
      symbol: item.symbol, 
      instrumentId: item.id,
      isLoggedIn,
      userId
    });
  };

  // Render top mover card (matches screenshot style)
  const renderTopMoverCard = (item, index) => {
    const iconConfig = getIconConfig(item.symbol);
    const isPositive = item.changePercent >= 0;
    const displaySymbol = item.symbol?.split('/')[0] || item.symbol;
    
    return (
      <TouchableOpacity
        key={item.id || `${item.symbol}-${index}`}
        style={styles.topMoverCard}
        onPress={() => navigateToChart(item)}
        activeOpacity={0.7}
      >
        {/* Icon */}
        <View style={styles.cardTopRow}>
          <View style={[styles.iconContainer, { backgroundColor: '#F0F0F0' }]}>
            <Text style={[styles.iconText, { color: iconConfig.color }]}>
              {iconConfig.icon}
            </Text>
          </View>
        </View>
        
        {/* Symbol and Change Badge Row */}
        <View style={styles.cardNameRow}>
          <Text style={styles.cardSymbol} numberOfLines={1}>
            {displaySymbol}
          </Text>
          <View style={[
            styles.changeBadge,
            { backgroundColor: isPositive ? 'rgba(0, 200, 83, 0.15)' : 'rgba(255, 82, 82, 0.15)' }
          ]}>
            <Text style={[
              styles.changeBadgeText,
              { color: isPositive ? '#00C853' : '#FF5252' }
            ]}>
              {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>
        
        {/* Price */}
        <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
        
        {/* Mini Chart */}
        <MiniChart isPositive={isPositive} data={item.priceHistory} />
      </TouchableOpacity>
    );
  };

  // Render instrument row (matches screenshot style)
  const renderInstrumentRow = (item, index) => {
    const isPositive = item.changePercent >= 0;
    
    return (
      <TouchableOpacity
        key={item.id || `${item.symbol}-${index}`}
        style={styles.instrumentRow}
        onPress={() => navigateToChart(item)}
        activeOpacity={0.7}
      >
        <View style={styles.instrumentLeft}>
          <Text style={styles.instrumentSymbol}>{item.symbol}</Text>
          <Text style={styles.instrumentVolume}>{formatVolume(item.volume)} USDT</Text>
        </View>
        <View style={styles.instrumentRight}>
          <Text style={styles.instrumentPrice}>{formatPrice(item.price)}</Text>
          <View style={[
            styles.changeTag,
            { backgroundColor: isPositive ? colors.green : colors.red }
          ]}>
            <Text style={styles.changeTagText}>
              {isPositive ? '' : ''}{item.changePercent.toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Top Tabs - Top gainers, Top losers, Most active, Favorites */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.green}
            colors={[colors.green]}
          />
        }
      >
        {/* Top Movers Cards - Horizontal scrollable */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.loadingText}>Loading market data...</Text>
          </View>
        ) : error && topMovers.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topMoversContainer}
          >
            {topMovers.length > 0 ? (
              topMovers.map((item, index) => renderTopMoverCard(item, index))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'Favorites' 
                    ? (isLoggedIn ? 'No favorites yet. Add instruments to your watchlist.' : 'Login to view your favorites')
                    : 'No instruments found'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Category Tabs - Crypto, MCX, Forex, NSE, Equity, Commodity */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  selectedCategory === category && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Instruments List */}
        <View style={styles.instrumentsList}>
          {instrumentsLoading ? (
            <View style={styles.instrumentsLoadingContainer}>
              <ActivityIndicator size="small" color={colors.green} />
            </View>
          ) : instruments.length > 0 ? (
            instruments.map((item, index) => renderInstrumentRow(item, index))
          ) : (
            <View style={styles.emptyInstrumentsContainer}>
              <Text style={styles.emptyText}>No instruments available for {selectedCategory}</Text>
            </View>
          )}
        </View>
        
        {/* Bottom padding for navbar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navbar */}
      {isLoggedIn ? (
        <RegisteredNavbar navigation={navigation} activeScreen="TradeOriginal" />
      ) : (
        <UnregisteredNavbar navigation={navigation} activeScreen="TradeOriginal" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Top Tabs styles
  tabsContainer: {
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  tab: {
    marginRight: 24,
    paddingVertical: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  // Content area
  content: {
    flex: 1,
  },
  // Loading & Error states
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.green,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 20,
    width: width - 32,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  // Top Movers Cards styles
  topMoversContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  topMoverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: CARD_WIDTH,
    minHeight: 160,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  iconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  cardSymbol: {
    color: '#1A1A2E',
    fontSize: 14,
    fontWeight: '600',
  },
  cardChange: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardPrice: {
    color: '#1A1A2E',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  // Category tabs styles
  categoriesWrapper: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryTabActive: {
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
  // Instruments list styles
  instrumentsList: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  instrumentsLoadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyInstrumentsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  instrumentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  instrumentLeft: {
    flex: 1,
  },
  instrumentSymbol: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  instrumentVolume: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  instrumentRight: {
    alignItems: 'flex-end',
  },
  instrumentPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  changeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  changeTagText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  // Floating Action Button
  // fab removed
});
