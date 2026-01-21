import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import CreateOrderModal from '../components/CreateOrderModal';
import TradeOrderModal from '../components/TradeOrderModal';
import SearchCoinModal from '../components/SearchCoinModal';
import RegisteredNavbar from '../components/RegisteredNavbar';
import UnregisteredNavbar from '../components/UnregisteredNavbar';
import { instrumentService, positionService, orderService, userService, segmentService, websocketService } from '../services';

// Deterministic pseudo-random generator for dummy chart data
function createSeededRNG(seedString) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedString.length; i++) {
    h = Math.imul(h ^ seedString.charCodeAt(i), 16777619) >>> 0;
  }
  let state = h >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state & 0xfffffff) / 0x10000000;
  };
}

function generateDummyOHLC(seedString, count = 60) {
  const rnd = createSeededRNG(String(seedString || 'default'));
  // base price derived from seed
  let base = 100 + Math.floor(rnd() * 10000);
  const candles = [];
  let prevClose = base;
  for (let i = 0; i < count; i++) {
    const changePct = (rnd() - 0.5) * 0.03; // +/-1.5%
    const close = Math.max(0.0001, prevClose * (1 + changePct));
    const high = Math.max(close, prevClose) * (1 + rnd() * 0.01);
    const low = Math.min(close, prevClose) * (1 - rnd() * 0.01);
    const positive = close >= prevClose;
    const open = prevClose;
    candles.push({ high: Number(high.toFixed(2)), low: Number(low.toFixed(2)), positive, close: Number(close.toFixed(2)), open: Number(open.toFixed(2)), volume: Math.round(rnd() * 1000000) });
    prevClose = close;
  }
  return candles;
}

const { width } = Dimensions.get('window');

const timeframes = ['1m', '5m', '15m', '1h', '1d', 'More'];

// Format volume to readable string
const formatVolume = (volume) => {
  if (!volume) return '0';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(0)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(0)}K`;
  return volume.toString();
};

export default function ChartScreen({ route, navigation }) {
  const { symbol = 'Nifty 500', instrumentId = null, isLoggedIn = false } = route?.params || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [activeTab, setActiveTab] = useState('Positions');
  const [positionFilter, setPositionFilter] = useState('Open'); // Open, Pending, Closed
  const [modalVisible, setModalVisible] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('NSE');
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real data states
  const [loading, setLoading] = useState(true);
  const [instrumentData, setInstrumentData] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [marketWatchData, setMarketWatchData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [candlestickData, setCandlestickData] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  
  // WebSocket subscription ref
  const unsubscribeRef = useRef(null);

  // Handle live price updates
  const handlePriceUpdate = useCallback((data) => {
    if (data.instrumentId === instrumentId || data.symbol === symbol) {
      setLivePrice(data);
      setInstrumentData(prev => ({
        ...prev,
        currentPrice: data.ltp,
        lastPrice: data.ltp,
        bidPrice: data.bid,
        askPrice: data.ask,
        high: data.high,
        low: data.low,
        change: data.change,
        changePercent: data.changePercent,
        volume: data.volume,
      }));
    }
  }, [instrumentId, symbol]);

  // Setup WebSocket connection for live prices
  useEffect(() => {
    if (isLoggedIn && instrumentId) {
      // Connect to WebSocket
      websocketService.connect().catch(console.error);
      
      // Subscribe to price updates
      unsubscribeRef.current = websocketService.subscribe('price', handlePriceUpdate);
      websocketService.subscribeToInstrument(instrumentId);
    }
    
    return () => {
      // Cleanup
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (instrumentId) {
        websocketService.unsubscribeFromInstrument(instrumentId);
      }
    };
  }, [isLoggedIn, instrumentId, handlePriceUpdate]);

  // Fetch instrument data
  const fetchInstrumentData = async () => {
    try {
      if (instrumentId) {
        const response = await instrumentService.getInstrument(instrumentId);
        if (response.success) {
          // Handle { data: { instrument: {...} } }
          setInstrumentData(response.data?.instrument || response.data);
        } else if (response.error === 'Authentication required') {
          console.log('Instrument details require authentication, using placeholder data');
          // Set placeholder data for unauthenticated users
          setInstrumentData({
            symbol: symbol || 'Unknown',
            name: symbol || 'Unknown Instrument',
            lastPrice: 0,
            changePercent: 0,
          });
        }
      } else if (symbol) {
        const response = await instrumentService.getBySymbol(symbol);
        if (response.success) {
          setInstrumentData(response.data?.instrument || response.data);
        } else if (response.error === 'Authentication required') {
          console.log('Instrument by symbol requires authentication, using placeholder data');
          setInstrumentData({
            symbol: symbol,
            name: symbol,
            lastPrice: 0,
            changePercent: 0,
          });
        }
      }
      
      // Fetch OHLC data for chart - only if we have a valid ID
      if (instrumentId) {
        try {
          const ohlcResponse = await instrumentService.getOHLC(instrumentId);
          if (ohlcResponse.success && Array.isArray(ohlcResponse.data)) {
            setCandlestickData(ohlcResponse.data);
          } else if (ohlcResponse.error === 'Authentication required') {
            console.log('OHLC data requires authentication, using placeholder chart data');
          }
        } catch (ohlcError) {
          console.log('OHLC data not available, using placeholder');
        }
      }
    } catch (error) {
      console.log('Error fetching instrument data, using placeholder:', error.message);
      // Set placeholder data on error
      setInstrumentData({
        symbol: symbol || 'Unknown',
        name: symbol || 'Unknown Instrument',
        lastPrice: 0,
        changePercent: 0,
      });
    }
  };

  // Fetch positions, orders and dashboard
  const fetchUserData = async () => {
    if (!isLoggedIn) return;
    
    try {
      const [positionsRes, ordersRes, orderHistoryRes, positionHistoryRes, dashboardRes] = await Promise.all([
        positionService.getPositions().catch(() => ({ success: false, data: [] })),
        orderService.getOrders().catch(() => ({ success: false, data: [] })),
        orderService.getOrderHistory().catch(() => ({ success: false, data: [] })),
        positionService.getPositionHistory().catch(() => ({ success: false, data: [] })),
        userService.getDashboard().catch(() => ({ success: false, data: {} }))
      ]);
      
      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      }
      if (ordersRes.success || orderHistoryRes.success) {
        // Combine orders and order history, filter for pending
        const allOrders = [...(ordersRes.data || []), ...(orderHistoryRes.data || [])];
        setOrders(allOrders);
      }
      if (positionHistoryRes.success) {
        setClosedPositions(positionHistoryRes.data || []);
      }
      if (dashboardRes.success) {
        setDashboardData(dashboardRes.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, [isLoggedIn]);

  // Fetch market watch data
  const fetchMarketWatch = async () => {
    try {
      // Map category names to API segment names for backend
      const segmentMap = {
        'NSE': 'NSE',
        'MCX': 'MCX',
        'Forex': 'FOREX',
        'Crypto': 'CRYPTO',
        'Equity': 'EQUITY',
        'Commodity': 'COMMODITY'
      };
      
      const apiSegment = segmentMap[selectedCategory] || selectedCategory.toUpperCase();
      const response = await instrumentService.getMarketWatch(apiSegment, { limit: 10 });
      if (response.success) {
        // Response structure: { data: { instruments: [...] } }
        const instrumentsList = response.data?.instruments || [];
        // Transform market data to match expected format
        const instruments = instrumentsList.map(item => ({
          id: item.instrumentId || item.id,
          symbol: item.symbol,
          name: item.name || item.symbol,
          lastPrice: item.currentPrice?.ltp || item.ltp || 0,
          price: item.currentPrice?.ltp || item.ltp || 0,
          changePercent: item.currentPrice?.changePercent || item.changePercent || 0,
          volume: item.currentPrice?.volume || item.volume || 0,
          segment: item.segment
        }));
        setMarketWatchData(instruments);
      }
    } catch (error) {
      console.error('Error fetching market watch:', error);
    }
  };

  // Fetch segments/categories
  const fetchCategories = async () => {
    try {
      const response = await segmentService.getSegments();
      // Handle nested response: { data: { segments: [...] } }
      const segments = response?.data?.segments || [];
      if (segments.length > 0) {
        // Map backend segments to display names and ensure all market types are included
        const backendCategories = segments.map(s => s.name || s.displayName);
        // Add any missing standard categories
        const standardCategories = ['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Commodity'];
        const mergedCategories = [...new Set([...backendCategories, ...standardCategories])];
        setCategories(mergedCategories);
        setSelectedCategory(backendCategories[0] || 'NSE');
      } else {
        setCategories(['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Commodity']);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Commodity']);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchInstrumentData(),
        fetchUserData(),
        fetchCategories()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchMarketWatch();
  }, [selectedCategory]);

  // Generate placeholder candlestick data if none from API.
  // Use a deterministic generator seeded by symbol+instrumentId so each instrument shows unique, realistic-looking candles.
  const seed = `${symbol || ''}-${instrumentId || ''}`;
  const chartCandlesticks = candlestickData.length > 0 ? candlestickData : generateDummyOHLC(seed, 120);

  // Generate order book data based on instrument price
  const currentPrice = instrumentData?.currentPrice || instrumentData?.lastPrice || instrumentData?.price || 0;
  const priceChange = instrumentData?.changePercent || instrumentData?.change || 0;
  const bidPrice = instrumentData?.bidPrice || currentPrice * 0.9998;
  const askPrice = instrumentData?.askPrice || currentPrice * 1.0002;
  
  // Generate realistic order book with spread around current price
  const generateOrderBook = (basePrice, isBid) => {
    if (!basePrice || basePrice === 0) {
      return Array(6).fill({ price: '0.00', amount: '0.00' });
    }
    return Array(6).fill(null).map((_, index) => {
      const spread = isBid ? -(index * 0.0001 * basePrice) : (index * 0.0001 * basePrice);
      const price = basePrice + spread;
      const amount = Math.random() * 5000 + 1000;
      return {
        price: price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        amount: amount.toFixed(2),
      };
    });
  };
  
  const orderBookBids = generateOrderBook(bidPrice, true);
  const orderBookAsks = generateOrderBook(askPrice, false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{symbol}</Text>
          <Ionicons name="flash" size={16} color={colors.textSecondary} />
        </View>
        <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
          <Ionicons name="search" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Market Segment Tabs */}
      <View style={styles.segmentTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentTabsContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.segmentTab,
                selectedCategory === category && styles.segmentTabActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.segmentTabText,
                  selectedCategory === category && styles.segmentTabTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Price Info */}
      <View style={styles.priceContainer}>
        <Text style={styles.currentPrice}>
          {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.changePercent, priceChange >= 0 ? styles.positiveChange : styles.negativeChange]}>
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
        </Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartWithLabels}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            {[64000, 64250, 64500, 64750, 65000].map((price) => (
              <Text key={price} style={styles.yAxisLabel}>
                {price}
              </Text>
            ))}
          </View>
          
          {/* Candlestick chart */}
          <View style={styles.candlestickContainer}>
            {chartCandlesticks.map((candle, index) => {
              const maxHigh = Math.max(...chartCandlesticks.map(c => c.high));
              const minLow = Math.min(...chartCandlesticks.map(c => c.low));
              const range = maxHigh - minLow;
              const wickHeight = ((candle.high - candle.low) / range) * 150;
              
              return (
                <View key={`candle-${index}`} style={styles.candlestick}>
                  <View
                    style={[
                      styles.candlestickWick,
                      {
                        height: wickHeight,
                        backgroundColor: candle.positive ? colors.green : colors.red,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Timeframe selector */}
        <View style={styles.timeframeContainer}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === tf && styles.timeframeTextActive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buy/Sell Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.sellButton]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Positions' && styles.tabActive]}
          onPress={() => setActiveTab('Positions')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Positions' && styles.tabTextActive,
            ]}
          >
            Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Order books' && styles.tabActive]}
          onPress={() => setActiveTab('Order books')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Order books' && styles.tabTextActive,
            ]}
          >
            Order books
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Market watch' && styles.tabActive]}
          onPress={() => setActiveTab('Market watch')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Market watch' && styles.tabTextActive,
            ]}
          >
            Market watch
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'Positions' && (
        <ScrollView 
          style={styles.tabContent} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />
          }
        >
          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>${dashboardData?.balance?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Equity</Text>
              <Text style={styles.balanceValue}>${dashboardData?.equity?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Free Margin</Text>
              <Text style={styles.balanceValue}>${dashboardData?.freeMargin?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.positionFilters}
          >
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
          </ScrollView>

          <View style={styles.positionAmount}>
            <Text style={styles.positionAmountText}>
              ${(() => {
                if (positionFilter === 'Open') {
                  return Array.isArray(positions) ? positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0).toFixed(2) : '0.00';
                } else if (positionFilter === 'Pending') {
                  const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED');
                  return pendingOrders.reduce((sum, o) => sum + ((o.quantity || 0) * (o.price || 0)), 0).toFixed(2);
                } else {
                  return Array.isArray(closedPositions) ? closedPositions.reduce((sum, p) => sum + (p.realizedPnl || p.pnl || 0), 0).toFixed(2) : '0.00';
                }
              })()}
            </Text>
          </View>

          {/* Open Positions */}
          {positionFilter === 'Open' && (
            <>
              {Array.isArray(positions) && positions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No open positions</Text>
                </View>
              ) : Array.isArray(positions) ? (
                positions.map((position) => (
                  <TouchableOpacity 
                    key={position.id}
                    style={styles.positionCard}
                    onPress={() => {
                      setSelectedPosition(position);
                      setTradeModalVisible(true);
                    }}
                  >
                    <View style={styles.positionHeader}>
                      <View style={styles.positionLeft}>
                        <View style={styles.iconContainer}>
                          <Text style={styles.iconText}>{position.instrument?.symbol?.[0] || 'P'}</Text>
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
                      <Text style={[styles.positionAmountValue, position.unrealizedPnl >= 0 ? styles.profitPositive : styles.profitNegative]}>
                        ${position.unrealizedPnl?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
                  <Text style={styles.emptyText}>No open positions</Text>
                </View>
              )}
            </>
          )}

          {/* Pending Orders */}
          {positionFilter === 'Pending' && (
            <>
              {(() => {
                const pendingOrders = orders.filter(o => o.status === 'PENDING' || o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED');
                if (pendingOrders.length === 0) {
                  return (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                      <Text style={styles.emptyText}>No pending orders</Text>
                    </View>
                  );
                }
                return pendingOrders.map((order) => (
                  <View key={order.id} style={styles.positionCard}>
                    <View style={styles.positionHeader}>
                      <View style={styles.positionLeft}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="time" size={20} color={colors.textPrimary} />
                        </View>
                        <View>
                          <Text style={styles.positionSymbol}>{order.instrument?.symbol || order.symbol || 'Unknown'}</Text>
                          <Text style={styles.positionAction}>
                            <Text style={order.side === 'BUY' ? styles.buyText : styles.sellText}>
                              {order.side} {order.quantity}
                            </Text>
                            <Text style={styles.atText}> at {(order.price || 0).toFixed(2)}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderStatusContainer}>
                        <Text style={styles.orderStatusText}>{order.status}</Text>
                        <Text style={styles.orderDateText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  </View>
                ));
              })()}
            </>
          )}

          {/* Closed Positions */}
          {positionFilter === 'Closed' && (
            <>
              {(() => {
                // Include closed positions and filled/cancelled orders
                const closedOrders = orders.filter(o => o.status === 'FILLED' || o.status === 'CANCELLED' || o.status === 'REJECTED');
                const allClosed = [...closedPositions, ...closedOrders];
                
                if (allClosed.length === 0) {
                  return (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
                      <Text style={styles.emptyText}>No closed positions</Text>
                    </View>
                  );
                }
                return allClosed.map((item, index) => (
                  <View key={item.id || `closed-${index}`} style={styles.positionCard}>
                    <View style={styles.positionHeader}>
                      <View style={styles.positionLeft}>
                        <View style={styles.iconContainer}>
                          <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                        </View>
                        <View>
                          <Text style={styles.positionSymbol}>{item.instrument?.symbol || item.symbol || 'Unknown'}</Text>
                          <Text style={styles.positionAction}>
                            <Text style={item.side === 'BUY' ? styles.buyText : styles.sellText}>
                              {item.side} {item.quantity}
                            </Text>
                            <Text style={styles.atText}> at {(item.avgPrice || item.price || 0).toFixed(2)}</Text>
                          </Text>
                        </View>
                      </View>
                      <View style={styles.orderStatusContainer}>
                        <Text style={[styles.positionAmountValue, (item.realizedPnl || item.pnl || 0) >= 0 ? styles.profitPositive : styles.profitNegative]}>
                          ${(item.realizedPnl || item.pnl || 0).toFixed(2)}
                        </Text>
                        <Text style={styles.orderDateText}>{item.status || 'CLOSED'}</Text>
                      </View>
                    </View>
                  </View>
                ));
              })()}
            </>
          )}
        </ScrollView>
      )}

      {activeTab === 'Order books' && (
        <View style={styles.orderBook}>
          <View style={styles.orderBookHeader}>
            <Text style={styles.orderBookHeaderText}>Bid</Text>
            <Text style={styles.orderBookHeaderText}>Ask</Text>
          </View>
          
          <View style={styles.orderBookContent}>
            <View style={styles.orderBookColumn}>
              {orderBookBids.map((order, index) => (
                <View key={`bid-${index}`} style={styles.orderBookRow}>
                  <Text style={styles.orderBookPriceBid}>{order.price}</Text>
                  <Text style={styles.orderBookAmount}>{order.amount}</Text>
                </View>
              ))}
            </View>
            <View style={styles.orderBookColumn}>
              {orderBookAsks.map((order, index) => (
                <View key={`ask-${index}`} style={styles.orderBookRow}>
                  <Text style={styles.orderBookPriceAsk}>{order.price}</Text>
                  <Text style={styles.orderBookAmount}>{order.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {activeTab === 'Market watch' && (
        <ScrollView style={styles.marketWatch} showsVerticalScrollIndicator={false}>
          {marketWatchData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="eye-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No instruments found</Text>
            </View>
          ) : (
            marketWatchData.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.marketWatchCard}
                onPress={() => setSearchModalVisible(true)}
              >
                <View style={styles.marketWatchLeft}>
                  <Text style={styles.marketWatchSymbol}>{item.symbol}</Text>
                  <Text style={styles.marketWatchVolume}>Vol {formatVolume(item.volume)}</Text>
                </View>
                <View style={styles.marketWatchRight}>
                  <Text style={styles.marketWatchPrice}>
                    {(item.price || item.lastPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </Text>
                  <Text style={[styles.marketWatchChange, (item.changePercent || 0) >= 0 ? styles.positiveChange : styles.negativeChange]}>
                    ${Math.abs(item.change || (item.price * (item.changePercent || 0) / 100) || 0).toFixed(2)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Trade Order Modal */}
      <TradeOrderModal 
        visible={tradeModalVisible} 
        onClose={() => {
          setTradeModalVisible(false);
          setSelectedPosition(null);
        }}
        position={selectedPosition}
        onSuccess={() => {
          fetchUserData(); // Refresh positions
        }}
      />

      {/* Search Coin Modal */}
      <SearchCoinModal 
        visible={searchModalVisible} 
        onClose={() => setSearchModalVisible(false)}
        onSelect={(item) => {
          // Navigate to the selected coin's chart
          navigation.navigate('Chart', { 
            symbol: item.symbol, 
            instrumentId: item.instrumentId || item.id,
            isLoggedIn 
          });
        }}
      />

      {/* Create Order Modal */}
      <CreateOrderModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        navigation={navigation}
        isLoggedIn={isLoggedIn}
        instrument={instrumentData}
        currentPrice={livePrice?.ltp || currentPrice}
      />

      {/* Bottom Navbar */}
      {isLoggedIn ? (
        <RegisteredNavbar navigation={navigation} activeScreen="Chart" />
      ) : (
        <UnregisteredNavbar navigation={navigation} activeScreen="Chart" />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  segmentTabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
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
  priceContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  changePercent: {
    color: colors.green,
    fontSize: 14,
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  chartWithLabels: {
    flexDirection: 'row',
    gap: 8,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    height: 200,
    width: 50,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  candlestickContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 16,
  },
  candlestick: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  candlestickWick: {
    width: 8,
    borderRadius: 2,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  timeframeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  timeframeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  timeframeTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: colors.red,
  },
  buyButton: {
    backgroundColor: colors.green,
  },
  actionButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 32,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  orderBook: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderBookHeaderText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  orderBookContent: {
    flexDirection: 'row',
    gap: 16,
  },
  orderBookColumn: {
    flex: 1,
  },
  orderBookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderBookPrice: {
    color: colors.green,
    fontSize: 12,
  },
  orderBookPriceBid: {
    color: colors.green,
    fontSize: 12,
  },
  orderBookPriceAsk: {
    color: colors.red,
    fontSize: 12,
  },
  orderBookAmount: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  positionFilters: {
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
  positionAmount: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  positionAmountText: {
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D4262',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
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
  marketWatch: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  marketWatchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  marketWatchLeft: {
    flex: 1,
  },
  marketWatchSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  marketWatchVolume: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  marketWatchRight: {
    alignItems: 'flex-end',
  },
  marketWatchPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  marketWatchChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  positiveChange: {
    color: colors.green,
  },
  negativeChange: {
    color: colors.red,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  profitPositive: {
    color: colors.green,
  },
  profitNegative: {
    color: colors.red,
  },
  orderStatusContainer: {
    alignItems: 'flex-end',
  },
  orderStatusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  orderDateText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  positionAmountValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
