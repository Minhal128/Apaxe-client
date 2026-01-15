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
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/clerk-expo';
import { colors } from '../constants/colors';
import { Svg, Path, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import RegisteredNavbar from '../components/RegisteredNavbar';
import { userService, instrumentService, positionService, authService, watchlistService } from '../services';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 60) / 3;

const tabs = ['Top gainers', 'Top losers', 'Most active', 'Favorites'];
const categories = ['Crypto', 'MCX', 'Forex', 'NSE', 'Equity', 'Commodity'];

// Icon mapping for different symbols
const ICON_CONFIG = {
  'BTC': { icon: '₿', color: '#F7931A', bg: '#F7931A20' },
  'ETH': { icon: '◊', color: '#627EEA', bg: '#627EEA20' },
  'SOL': { icon: '◎', color: '#00FFA3', bg: '#00FFA320' },
  'XRP': { icon: '✕', color: '#23292F', bg: '#FFFFFF' },
  'BNB': { icon: '⬡', color: '#F3BA2F', bg: '#F3BA2F20' },
  'TRX': { icon: '◈', color: '#FF0013', bg: '#FF001320' },
  'TRON': { icon: '◈', color: '#FF0013', bg: '#FF001320' },
  'BITCOIN': { icon: '₿', color: '#F7931A', bg: '#F7931A20' },
  'BITCOINCASH': { icon: '₿', color: '#8DC351', bg: '#8DC35120' },
  'CARDANO': { icon: '◉', color: '#0033AD', bg: '#0033AD20' },
  'DOGECOIN': { icon: 'Ð', color: '#C2A633', bg: '#C2A63320' },
  'AXIS': { icon: 'A', color: '#97144D', bg: '#FFFFFF' },
  'AXISBANK': { icon: 'A', color: '#97144D', bg: '#FFFFFF' },
  'SBIN': { icon: 'S', color: '#0066B2', bg: '#FFFFFF' },
  'NIFTY': { icon: '◉', color: '#1A1A2E', bg: '#FFFFFF' },
  'NIFTY50': { icon: '◉', color: '#1A1A2E', bg: '#FFFFFF' },
  'DEFAULT': { icon: '●', color: '#5B8DEE', bg: '#5B8DEE20' },
};

// Get icon config for symbol
const getIconConfig = (symbol) => {
  const baseSymbol = symbol?.split('/')[0]?.toUpperCase() || '';
  return ICON_CONFIG[baseSymbol] || ICON_CONFIG.DEFAULT;
};

// Mini chart component with gradient fill
const MiniChart = ({ isPositive, data = [] }) => {
  const chartWidth = 70;
  const chartHeight = 35;
  
  const generatePath = () => {
    const points = data.length >= 2 ? data : (isPositive 
      ? [22, 20, 18, 16, 14, 12, 10, 8] 
      : [8, 10, 12, 14, 16, 18, 20, 22]);
    
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
  const gradientId = isPositive ? 'greenGradHome' : 'redGradHome';

  return (
    <Svg height={chartHeight} width={chartWidth} style={{ marginTop: 8 }}>
      <Defs>
        <LinearGradient id="greenGradHome" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.green} stopOpacity="0.3" />
          <Stop offset="1" stopColor={colors.green} stopOpacity="0.05" />
        </LinearGradient>
        <LinearGradient id="redGradHome" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.red} stopOpacity="0.3" />
          <Stop offset="1" stopColor={colors.red} stopOpacity="0.05" />
        </LinearGradient>
      </Defs>
      <Path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      <Polyline
        points={linePath.replace('M', '')}
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

export default function HomeScreenLoggedIn({ navigation }) {
  // Get Clerk user for Google OAuth
  const clerkUserData = useUser();
  const clerkUser = clerkUserData?.user;
  
  const [activeTab, setActiveTab] = useState('Top gainers');
  const [selectedCategory, setSelectedCategory] = useState('Crypto');
  const [positionFilter, setPositionFilter] = useState('Open');
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(false);
  const [instrumentsLoading, setInstrumentsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [topMovers, setTopMovers] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [allMarketData, setAllMarketData] = useState([]);
  const [positions, setPositions] = useState([]);
  
  // Simulated trading balance
  const [simulatedBalance, setSimulatedBalance] = useState(10000);
  const [simulatedPositions, setSimulatedPositions] = useState([]);

  // Load simulated balance from AsyncStorage (user-specific)
  const loadSimulatedData = async (userId) => {
    try {
      const userKey = userId || user?.id || user?.email || 'default';
      const savedBalance = await AsyncStorage.getItem(`simulatedBalance_${userKey}`);
      const savedPositions = await AsyncStorage.getItem(`simulatedPositions_${userKey}`);
      if (savedBalance) setSimulatedBalance(parseFloat(savedBalance));
      if (savedPositions) setSimulatedPositions(JSON.parse(savedPositions));
    } catch (e) {
      console.log('Error loading simulated data:', e);
    }
  };

  // Fetch initial user data
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Load simulated data after user is loaded
  useEffect(() => {
    if (user?.id || user?.email) {
      loadSimulatedData(user?.id || user?.email);
    }
  }, [user]);
  
  // Reload simulated data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user?.id || user?.email) {
        loadSimulatedData(user?.id || user?.email);
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [userData, dashboardData, positionsData] = await Promise.all([
        authService.getUser(),
        userService.getDashboard().catch(() => null),
        positionService.getPositions().catch(() => ({ data: [] })),
      ]);
      
      // Use backend user data, or fall back to Clerk user (Google OAuth)
      if (userData) {
        setUser(userData);
      } else if (clerkUser) {
        console.log('Using Clerk user data for Google OAuth user:', clerkUser.firstName, clerkUser.lastName);
        setUser({
          id: clerkUser.id,
          firstName: clerkUser.firstName || clerkUser.username || 'User',
          lastName: clerkUser.lastName || '',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          imageUrl: clerkUser.imageUrl,
        });
      }
      
      setDashboard(dashboardData?.data);
      setPositions(Array.isArray(positionsData?.data) ? positionsData.data : []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // On error, try to use Clerk user
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          firstName: clerkUser.firstName || clerkUser.username || 'User',
          lastName: clerkUser.lastName || '',
          email: clerkUser.primaryEmailAddress?.emailAddress,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Refetch data when Clerk user changes
  useEffect(() => {
    if (clerkUser && !user) {
      fetchInitialData();
    }
  }, [clerkUser]);

  // Fetch top movers based on active tab
  const fetchTopMovers = useCallback(async () => {
    try {
      setMarketLoading(true);
      
      const marketRes = await instrumentService.getMarketWatch('ALL');
      const allInstruments = marketRes?.data?.instruments || [];
      
      // Store all market data for reference
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

      setAllMarketData(transformedData);

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
              segment: item.segment,
              priceHistory: item.priceHistory || []
            }));
          } catch (e) {
            console.log('Failed to fetch favorites:', e.message);
            sortedMovers = [];
          }
          break;
        default:
          sortedMovers = transformedData.slice(0, 10);
      }
      
      setTopMovers(sortedMovers);
    } catch (err) {
      console.log('Error fetching top movers:', err.message);
      setTopMovers([]);
    } finally {
      setMarketLoading(false);
    }
  }, [activeTab]);

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
    await Promise.all([fetchInitialData(), fetchTopMovers(), fetchInstruments()]);
    if (user?.id || user?.email) {
      loadSimulatedData(user?.id || user?.email);
    }
    setRefreshing(false);
  };

  // Navigate to ChartScreen when clicking on a coin
  const navigateToChart = (item) => {
    navigation.navigate('Chart', { 
      symbol: item.symbol, 
      instrumentId: item.id,
      isLoggedIn: true,
      userId: user?.id || user?.email || null
    });
  };

  // Use simulated balance if available, otherwise use dashboard balance
  const balance = simulatedBalance || dashboard?.balance || 10000;
  const pnl = dashboard?.todayPnl || 0;
  const pnlPercent = dashboard?.todayPnlPercent || 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <Text style={styles.profileText}>{user?.firstName?.[0] || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notification')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Alert')}
            >
              <Ionicons name="notifications" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Your balance</Text>
            <Ionicons name="help-circle-outline" size={16} color={colors.textPrimary} />
          </View>
          <View style={styles.balanceMainRow}>
            <View>
              <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
              <View style={styles.balanceFooter}>
                <Text style={styles.pnlLabel}>Today's PNL</Text>
                <Text style={[styles.pnlValue, { color: pnlPercent >= 0 ? colors.green : colors.red }]}>
                  {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addFundButton}
              onPress={() => navigation.navigate('WalletLoggedIn')}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.addFundText}>Add fund</Text>
            </TouchableOpacity>
          </View>
        </View>
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

      {/* Content */}
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
        {marketLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.green} />
            <Text style={styles.loadingText}>Loading market data...</Text>
          </View>
        ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.gainersScrollView}
            contentContainerStyle={styles.gainersListContainer}
          >
            {topMovers.length > 0 ? topMovers.map((item, index) => {
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
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconContainer, { backgroundColor: iconConfig.bg }]}>
                      <Text style={[styles.cardIconText, { color: iconConfig.color }]}>
                        {iconConfig.icon}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardNameRow}>
                    <Text style={styles.cardSymbol} numberOfLines={1}>
                      {displaySymbol}
                    </Text>
                    <Text style={[
                      styles.cardChange,
                      { color: isPositive ? colors.green : colors.red }
                    ]}>
                      {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                  <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                  <MiniChart isPositive={isPositive} data={item.priceHistory} />
                </TouchableOpacity>
              );
            }) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {activeTab === 'Favorites' 
                    ? 'No favorites yet. Add instruments to your watchlist.'
                    : 'No instruments found'}
                </Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Categories */}
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
        </View>

        {/* Instruments List */}
        <View style={styles.instrumentsList}>
          {instrumentsLoading ? (
            <View style={styles.instrumentsLoadingContainer}>
              <ActivityIndicator size="small" color={colors.green} />
            </View>
          ) : instruments.length > 0 ? (
            instruments.map((item, index) => {
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
                        {item.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyInstrumentsContainer}>
              <Text style={styles.emptyText}>No instruments available for {selectedCategory}</Text>
            </View>
          )}
        </View>

        {/* Positions Section */}
        <View style={styles.positionsSection}>
          <View style={styles.positionFilters}>
            <TouchableOpacity 
              style={[styles.filterButton, positionFilter === 'Open' && styles.filterButtonActive]}
              onPress={() => setPositionFilter('Open')}
            >
              <Text style={positionFilter === 'Open' ? styles.filterTextActive : styles.filterText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, positionFilter === 'Pending' && styles.filterButtonActive]}
              onPress={() => setPositionFilter('Pending')}
            >
              <Text style={positionFilter === 'Pending' ? styles.filterTextActive : styles.filterText}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, positionFilter === 'Closed' && styles.filterButtonActive]}
              onPress={() => setPositionFilter('Closed')}
            >
              <Text style={positionFilter === 'Closed' ? styles.filterTextActive : styles.filterText}>Closed</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={styles.totalAmount}>
              ${Array.isArray(positions) ? positions.reduce((sum, p) => sum + (p.currentValue || 0), 0).toLocaleString() : '0'}
            </Text>
          </View>

          {(() => {
            // Filter positions based on selected filter
            let filteredPositions = [];
            if (Array.isArray(positions)) {
              if (positionFilter === 'Open') {
                filteredPositions = positions.filter(p => p.status === 'OPEN' || !p.status);
              } else if (positionFilter === 'Pending') {
                filteredPositions = positions.filter(p => p.status === 'PENDING');
              } else if (positionFilter === 'Closed') {
                filteredPositions = positions.filter(p => p.status === 'CLOSED' || p.status === 'FILLED');
              }
            }

            return filteredPositions.length > 0 ? filteredPositions.slice(0, 3).map((position) => (
              <TouchableOpacity key={position.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <View style={styles.positionLeft}>
                    <View style={styles.positionIcon}>
                      <Text style={styles.positionIconText}>{position.instrument?.symbol?.[0] || 'P'}</Text>
                    </View>
                    <View>
                      <Text style={styles.positionSymbol}>{position.instrument?.symbol || 'Unknown'}</Text>
                      <Text style={styles.positionAction}>
                        <Text style={position.side === 'BUY' ? styles.buyText : styles.sellText}>
                          {position.side} {position.quantity}
                        </Text>
                        <Text style={styles.atText}> at {position.avgPrice?.toFixed(2)}</Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.positionAmount, { color: (position.unrealizedPnl || 0) >= 0 ? colors.green : colors.red }]}>
                    ${(position.currentValue || 0).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            )) : (
              <Text style={{ color: colors.textSecondary, padding: 20, textAlign: 'center' }}>
                No {positionFilter.toLowerCase()} positions
              </Text>
            );
          })()}
        </View>
      </ScrollView>

      <RegisteredNavbar navigation={navigation} activeScreen="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8C4A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2F3E',
  },
  welcomeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 8,
  },
  pnlValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.green,
  },
  addFundButton: {
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addFundText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
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
  gainersScrollView: {
    marginTop: 16,
    marginBottom: 16,
  },
  gainersListContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  // Loading and empty states
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
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
  // Top Mover Cards styles (matching TradeOriginalScreen)
  topMoverCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    width: CARD_WIDTH,
    minHeight: 130,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    marginBottom: 8,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardSymbol: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  cardChange: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  // Categories wrapper styles
  categoriesWrapper: {
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
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
  positionsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  positionFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blue,
  },
  positionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D4262',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionIconText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  positionAction: {
    fontSize: 13,
  },
  buyText: {
    color: colors.blue,
    fontWeight: '500',
  },
  sellText: {
    color: colors.red,
    fontWeight: '500',
  },
  atText: {
    color: colors.textSecondary,
  },
  positionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.blue,
  },
});
