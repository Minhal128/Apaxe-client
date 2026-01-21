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
import { Svg, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import RegisteredNavbar from '../components/RegisteredNavbar';
import UnregisteredNavbar from '../components/UnregisteredNavbar';
import { instrumentService, watchlistService } from '../services';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2.5;

const tabs = ['Top gainers', 'Top losers', 'Most active', 'Favorites'];
const marketSegments = ['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Commodity'];

// Mini chart component for top movers cards
const MiniChart = ({ isPositive, data = [] }) => {
  // Generate smooth chart points based on data or random pattern
  const generatePoints = () => {
    if (data.length >= 2) {
      const maxVal = Math.max(...data);
      const minVal = Math.min(...data);
      const range = maxVal - minVal || 1;
      return data.map((val, i) => {
        const x = (i / (data.length - 1)) * 60;
        const y = 25 - ((val - minVal) / range) * 20;
        return `${x},${y}`;
      }).join(' ');
    }
    
    // Default pattern based on trend
    if (isPositive) {
      return "0,22 10,20 20,18 30,16 40,12 50,10 60,8";
    } else {
      return "0,8 10,10 20,12 30,14 40,18 50,20 60,22";
    }
  };

  return (
    <Svg height="30" width="60" style={{ marginTop: 8 }}>
      <Polyline
        points={generatePoints()}
        fill="none"
        stroke={isPositive ? colors.green : colors.red}
        strokeWidth="2"
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

// Format price
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

// Get icon background color based on symbol
const getIconColor = (symbol) => {
  const colorMap = {
    'BTC': '#F7931A',
    'ETH': '#627EEA',
    'SOL': '#00FFA3',
    'XRP': '#23292F',
    'BNB': '#F3BA2F',
    'TRON': '#FF0013',
    'TRX': '#FF0013',
    'AXIS': '#97144D',
    'SBIN': '#0066B2',
    'NIFTY': '#1A1A2E',
  };
  const firstPart = symbol?.split('/')[0] || symbol;
  return colorMap[firstPart] || '#3D4262';
};

export default function TradeScreen({ route, navigation }) {
  const { isLoggedIn = false } = route?.params || {};
  const [activeTab, setActiveTab] = useState('Top gainers');
  const [selectedSegment, setSelectedSegment] = useState('NSE');
  const [topMovers, setTopMovers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch top movers data based on active tab and selected segment
  const fetchTopMovers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Map segment names to API segment names for backend
      const segmentMap = {
        'NSE': 'NSE',
        'MCX': 'MCX',
        'Forex': 'FOREX',
        'Crypto': 'CRYPTO',
        'Equity': 'EQUITY',
        'Commodity': 'COMMODITY'
      };
      
      const apiSegment = segmentMap[selectedSegment] || selectedSegment.toUpperCase();
      
      // Fetch market data for selected segment
      const marketRes = await instrumentService.getMarketWatch(apiSegment);
      const allInstruments = marketRes?.data?.instruments || [];
      
      // Transform data
      const transformedData = allInstruments.map(item => ({
        id: item.instrumentId || item.id,
        symbol: item.symbol,
        name: item.name || item.symbol,
        price: item.currentPrice?.ltp || item.ltp || 0,
        changePercent: item.currentPrice?.changePercent || item.changePercent || 0,
        volume: item.currentPrice?.volume || item.volume || 0,
        segment: item.segment
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
          // Fetch from watchlist if logged in
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
  }, [activeTab, isLoggedIn, selectedSegment]);

  // Fetch instruments by selected market segment
  const fetchInstruments = useCallback(async () => {
    try {
      setInstrumentsLoading(true);
      
      // Map segment names to API segment names for backend
      const segmentMap = {
        'NSE': 'NSE',
        'MCX': 'MCX',
        'Forex': 'FOREX',
        'Crypto': 'CRYPTO',
        'Equity': 'EQUITY',
        'Commodity': 'COMMODITY'
      };
      
      const apiSegment = segmentMap[selectedSegment] || selectedSegment.toUpperCase();
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
  }, [selectedSegment]);

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

  const navigateToChart = (item) => {
    navigation.navigate('Chart', { 
      symbol: item.symbol, 
      instrumentId: item.id,
      isLoggedIn 
    });
  };

  const renderTopMoverCard = (item) => (
    <TouchableOpacity
      key={item.id || item.symbol}
      style={styles.topMoverCard}
      onPress={() => navigateToChart(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.symbol) }]}>
          <Text style={styles.iconText}>
            {item.symbol?.split('/')[0]?.[0] || item.symbol?.[0] || '?'}
          </Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardSymbol} numberOfLines={1}>
            {item.symbol?.split('/')[0] || item.symbol}
          </Text>
          <Text style={[
            styles.cardChange,
            { color: item.changePercent >= 0 ? colors.green : colors.red }
          ]}>
            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
      <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
      <MiniChart isPositive={item.changePercent >= 0} />
    </TouchableOpacity>
  );

  const renderInstrumentRow = (item) => (
    <TouchableOpacity
      key={item.id || item.symbol}
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
          { backgroundColor: item.changePercent >= 0 ? colors.green : colors.red }
        ]}>
          <Text style={styles.changeTagText}>
            {item.changePercent >= 0 ? '' : ''}{item.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Market Segment Tabs - Top header tabs */}
      <View style={styles.segmentTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentTabsContent}
        >
          {marketSegments.map((segment) => (
            <TouchableOpacity
              key={segment}
              style={[
                styles.segmentTab,
                selectedSegment === segment && styles.segmentTabActive
              ]}
              onPress={() => setSelectedSegment(segment)}
            >
              <Text style={[
                styles.segmentTabText,
                selectedSegment === segment && styles.segmentTabTextActive
              ]}>
                {segment}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Top Tabs - Gainers/Losers/Active/Favorites */}
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
        {/* Top Movers Cards */}
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
              topMovers.map(renderTopMoverCard)
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'Favorites' 
                    ? (isLoggedIn ? 'No favorites yet. Add instruments to your watchlist.' : 'Login to view your favorites')
                    : `No instruments found for ${selectedSegment}`}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Instruments List Section Header */}
        <View style={styles.instrumentsHeader}>
          <Text style={styles.instrumentsHeaderText}>{selectedSegment} Instruments</Text>
        </View>

        {/* Instruments List */}
        <View style={styles.instrumentsList}>
          {instrumentsLoading ? (
            <View style={styles.instrumentsLoadingContainer}>
              <ActivityIndicator size="small" color={colors.green} />
            </View>
          ) : instruments.length > 0 ? (
            instruments.map(renderInstrumentRow)
          ) : (
            <View style={styles.emptyInstrumentsContainer}>
              <Text style={styles.emptyText}>No instruments available for {selectedSegment}</Text>
            </View>
          )}
        </View>
        
        {/* Bottom padding for navbar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Chart', { isLoggedIn })}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.textPrimary} />
      </TouchableOpacity>

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
  segmentTabsContainer: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  segmentTabsContent: {
    paddingRight: 16,
  },
  segmentTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
  },
  segmentTabActive: {
    backgroundColor: colors.textPrimary,
  },
  segmentTabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTabTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  tabsContainer: {
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
  content: {
    flex: 1,
  },
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
  topMoversContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  topMoverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: CARD_WIDTH,
    minHeight: 140,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cardHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  cardSymbol: {
    color: '#2C2F3E',
    fontSize: 13,
    fontWeight: '500',
  },
  cardChange: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardPrice: {
    color: '#2C2F3E',
    fontSize: 18,
    fontWeight: '700',
  },
  instrumentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  instrumentsHeaderText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
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
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  fab: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: colors.blue,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
