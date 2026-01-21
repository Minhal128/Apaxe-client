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
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
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
const MiniChart = ({ isPositive, data = [], colors }) => {
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
  
  // Get theme and language
  const { colors } = useTheme();
  const { t } = useLanguage();
  
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

  // Fetch initial user data
  useEffect(() => {
    fetchInitialData();
  }, []);
  
  // Reload dashboard when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Refresh dashboard to get updated balance from API
      fetchDashboard();
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch dashboard data (for balance updates)
  const fetchDashboard = async () => {
    try {
      const dashboardData = await userService.getDashboard();
      if (dashboardData?.data) {
        setDashboard(dashboardData.data);
      }
    } catch (error) {
      console.log('Error refreshing dashboard:', error.message);
    }
  };

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

  // Use API balance from dashboard
  const balance = dashboard?.balance || 0;
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <Text style={styles.profileText}>{user?.firstName?.[0] || 'U'}</Text>
            </View>
            <View>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t.welcome}</Text>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.firstName} {user?.lastName}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Notification')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate('Alert')}
            >
              <Ionicons name="notifications" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t.yourBalance}</Text>
            <Ionicons name="help-circle-outline" size={16} color={colors.textPrimary} />
          </View>
          <View style={styles.balanceMainRow}>
            <View>
              <Text style={[styles.balanceAmount, { color: colors.textPrimary }]}>${balance.toLocaleString()}</Text>
              <View style={styles.balanceFooter}>
                <Text style={[styles.pnlLabel, { color: colors.textSecondary }]}>{t.todayPnl}</Text>
                <Text style={[styles.pnlValue, { color: pnlPercent >= 0 ? colors.green : colors.red }]}>
                  {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.addFundButton, { backgroundColor: colors.green }]}
              onPress={() => navigation.navigate('WalletLoggedIn')}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={[styles.addFundText, { color: colors.textPrimary }]}>{t.addFund}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Top gainers' && { ...styles.tabActive, borderBottomColor: colors.textPrimary }]}
          onPress={() => setActiveTab('Top gainers')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Top gainers' ? colors.textPrimary : colors.textSecondary },
              activeTab === 'Top gainers' && styles.tabTextActive,
            ]}
          >
            {t.topGainers}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Top losers' && { ...styles.tabActive, borderBottomColor: colors.textPrimary }]}
          onPress={() => setActiveTab('Top losers')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Top losers' ? colors.textPrimary : colors.textSecondary },
              activeTab === 'Top losers' && styles.tabTextActive,
            ]}
          >
            {t.topLosers}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Most active' && { ...styles.tabActive, borderBottomColor: colors.textPrimary }]}
          onPress={() => setActiveTab('Most active')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Most active' ? colors.textPrimary : colors.textSecondary },
              activeTab === 'Most active' && styles.tabTextActive,
            ]}
          >
            {t.mostActive}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Favorites' && { ...styles.tabActive, borderBottomColor: colors.textPrimary }]}
          onPress={() => setActiveTab('Favorites')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Favorites' ? colors.textPrimary : colors.textSecondary },
              activeTab === 'Favorites' && styles.tabTextActive,
            ]}
          >
            {t.favorites}
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
                  </View>
                  <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                  <MiniChart isPositive={isPositive} data={item.priceHistory} colors={colors} />
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
        <View style={[styles.categoriesWrapper, { borderBottomColor: colors.border }]}>
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
                  { borderColor: colors.border },
                  selectedCategory === category && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === category ? colors.background : colors.textSecondary },
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
                  style={[styles.instrumentRow, { borderBottomColor: colors.border }]}
                  onPress={() => navigateToChart(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.instrumentLeft}>
                    <Text style={[styles.instrumentSymbol, { color: colors.textPrimary }]}>{item.symbol}</Text>
                    <Text style={[styles.instrumentVolume, { color: colors.textSecondary }]}>{formatVolume(item.volume)} USDT</Text>
                  </View>
                  <View style={styles.instrumentRight}>
                    <Text style={[styles.instrumentPrice, { color: colors.textPrimary }]}>{formatPrice(item.price)}</Text>
                    <View style={[
                      styles.changeTag,
                      { backgroundColor: isPositive ? colors.green : colors.red }
                    ]}>
                      <Text style={[styles.changeTagText, { color: colors.textPrimary }]}>
                        {item.changePercent.toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyInstrumentsContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No instruments available for {selectedCategory}</Text>
            </View>
          )}
        </View>

        {/* Positions Section */}
        <View style={styles.positionsSection}>
          <View style={styles.positionFilters}>
            <TouchableOpacity 
              style={[
                styles.filterButton, 
                { backgroundColor: colors.cardBackground },
                positionFilter === 'Open' && { backgroundColor: colors.textPrimary }
              ]}
              onPress={() => setPositionFilter('Open')}
            >
              <Text style={[
                styles.filterText,
                { color: positionFilter === 'Open' ? colors.background : colors.textSecondary },
                positionFilter === 'Open' && styles.filterTextActive
              ]}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton,
                { backgroundColor: colors.cardBackground },
                positionFilter === 'Pending' && { backgroundColor: colors.textPrimary }
              ]}
              onPress={() => setPositionFilter('Pending')}
            >
              <Text style={[
                styles.filterText,
                { color: positionFilter === 'Pending' ? colors.background : colors.textSecondary },
                positionFilter === 'Pending' && styles.filterTextActive
              ]}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.filterButton,
                { backgroundColor: colors.cardBackground },
                positionFilter === 'Closed' && { backgroundColor: colors.textPrimary }
              ]}
              onPress={() => setPositionFilter('Closed')}
            >
              <Text style={[
                styles.filterText,
                { color: positionFilter === 'Closed' ? colors.background : colors.textSecondary },
                positionFilter === 'Closed' && styles.filterTextActive
              ]}>Closed</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={[styles.totalAmount, { color: colors.blue }]}>
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
              <TouchableOpacity key={position.id} style={[styles.positionCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.positionHeader}>
                  <View style={styles.positionLeft}>
                    <View style={styles.positionIcon}>
                      <Text style={[styles.positionIconText, { color: colors.textPrimary }]}>{position.instrument?.symbol?.[0] || 'P'}</Text>
                    </View>
                    <View>
                      <Text style={[styles.positionSymbol, { color: colors.textPrimary }]}>{position.instrument?.symbol || 'Unknown'}</Text>
                      <Text style={styles.positionAction}>
                        <Text style={[styles.buyText, { color: position.side === 'BUY' ? colors.blue : colors.red }]}>
                          {position.side} {position.quantity}
                        </Text>
                        <Text style={[styles.atText, { color: colors.textSecondary }]}> at {position.avgPrice?.toFixed(2)}</Text>
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
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
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
    marginBottom: 8,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlLabel: {
    fontSize: 13,
    marginRight: 8,
  },
  pnlValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  addFundButton: {
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
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
  },
  tabTextActive: {
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
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    width: width - 32,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Top Mover Cards styles (matching reference design - white cards)
  topMoverCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    width: CARD_WIDTH,
    minHeight: 130,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  cardIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    overflow: 'hidden',
  },
  cardSymbol: {
    color: '#1A1A2E',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '55%',
  },
  cardChange: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 0,
  },
  cardPrice: {
    color: '#1A1A2E',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  // Categories wrapper styles
  categoriesWrapper: {
    marginTop: 8,
    borderBottomWidth: 1,
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
  },
  categoryButtonActive: {
  },
  categoryText: {
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
  },
  instrumentLeft: {
    flex: 1,
  },
  instrumentSymbol: {
    fontSize: 16,
    fontWeight: '600',
  },
  instrumentVolume: {
    fontSize: 12,
    marginTop: 4,
  },
  instrumentRight: {
    alignItems: 'flex-end',
  },
  instrumentPrice: {
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
    marginRight: 8,
  },
  filterButtonActive: {
  },
  filterText: {
    fontSize: 14,
  },
  filterTextActive: {
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  positionCard: {
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
    fontSize: 18,
    fontWeight: '700',
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  positionAction: {
    fontSize: 13,
  },
  buyText: {
    fontWeight: '500',
  },
  sellText: {
    fontWeight: '500',
  },
  atText: {
  },
  positionAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
});
