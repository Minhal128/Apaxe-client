import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { Svg, Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { instrumentService, websocketService } from '../services';

const { width, height } = Dimensions.get('window');
const CHART_WIDTH = width - 70;
const CHART_HEIGHT = 220;

const timeframes = ['1m', '5m', '15m', '1h', '1d', 'More'];

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

function generateDummyOHLC(seedString, count = 50, basePrice = 64000) {
  const rnd = createSeededRNG(String(seedString || 'default'));
  const candles = [];
  let prevClose = basePrice + (rnd() - 0.5) * basePrice * 0.02;
  
  const now = Date.now();
  const interval = 5 * 60 * 1000; // 5 min intervals
  
  for (let i = 0; i < count; i++) {
    const changePct = (rnd() - 0.5) * 0.015; // +/-0.75%
    const close = Math.max(0.0001, prevClose * (1 + changePct));
    const bodySize = Math.abs(close - prevClose);
    const wickUp = rnd() * bodySize * 0.8;
    const wickDown = rnd() * bodySize * 0.8;
    const high = Math.max(close, prevClose) + wickUp;
    const low = Math.min(close, prevClose) - wickDown;
    const open = prevClose;
    const volume = Math.round(rnd() * 1000000 + 500000);
    const time = now - (count - i) * interval;
    
    candles.push({ 
      open: Number(open.toFixed(2)), 
      high: Number(high.toFixed(2)), 
      low: Number(low.toFixed(2)), 
      close: Number(close.toFixed(2)), 
      volume,
      time,
      positive: close >= open
    });
    prevClose = close;
  }
  return candles;
}

// Format price with commas
const formatPrice = (price) => {
  if (!price) return '0.00';
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Format time label
const formatTimeLabel = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function CoinChartScreen({ route, navigation }) {
  const { symbol = 'BTC/USDT', instrumentId = null, isLoggedIn = false, userId = null } = route?.params || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [activeTab, setActiveTab] = useState('Order books');
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [orderType, setOrderType] = useState('BUY');
  const [quantity, setQuantity] = useState('1');
  const [orderResult, setOrderResult] = useState(null);
  
  // User balance state
  const [userBalance, setUserBalance] = useState(10000);
  const [positions, setPositions] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(userId);
  
  // Real data states
  const [loading, setLoading] = useState(true);
  const [instrumentData, setInstrumentData] = useState(null);
  const [candlestickData, setCandlestickData] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  
  // Animation
  const successAnim = useRef(new Animated.Value(0)).current;
  
  // WebSocket subscription ref
  const unsubscribeRef = useRef(null);
  
  // Get user ID from cached user data
  useEffect(() => {
    const getUserId = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('cachedUser');
        if (cachedUser) {
          const user = JSON.parse(cachedUser);
          setCurrentUserId(user?.id || user?.email || 'default');
        }
      } catch (e) {
        console.log('Error getting user ID:', e);
      }
    };
    if (!userId) {
      getUserId();
    }
  }, [userId]);
  
  // Load saved balance and positions on mount
  useEffect(() => {
    if (currentUserId) {
      loadUserData(currentUserId);
    }
  }, [currentUserId]);
  
  const loadUserData = async (uid) => {
    try {
      const userKey = uid || 'default';
      const savedBalance = await AsyncStorage.getItem(`simulatedBalance_${userKey}`);
      const savedPositions = await AsyncStorage.getItem(`simulatedPositions_${userKey}`);
      if (savedBalance) setUserBalance(parseFloat(savedBalance));
      if (savedPositions) setPositions(JSON.parse(savedPositions));
    } catch (e) {
      console.log('Error loading user data:', e);
    }
  };
  
  const saveUserData = async (balance, newPositions) => {
    try {
      const userKey = currentUserId || 'default';
      await AsyncStorage.setItem(`simulatedBalance_${userKey}`, balance.toString());
      await AsyncStorage.setItem(`simulatedPositions_${userKey}`, JSON.stringify(newPositions));
    } catch (e) {
      console.log('Error saving user data:', e);
    }
  };

  // Execute simulated trade
  const executeTrade = () => {
    const qty = parseFloat(quantity) || 1;
    const price = currentPrice || 64000;
    const totalCost = qty * price;
    
    if (orderType === 'BUY') {
      // Check if user has enough balance
      if (totalCost > userBalance) {
        Alert.alert(
          'Insufficient Balance',
          `You need $${formatPrice(totalCost)} but only have $${formatPrice(userBalance)}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Deduct from balance and add position
      const newBalance = userBalance - totalCost;
      const newPosition = {
        id: Date.now(),
        symbol: symbol,
        type: 'BUY',
        quantity: qty,
        entryPrice: price,
        timestamp: new Date().toISOString(),
      };
      const updatedPositions = [...positions, newPosition];
      
      setUserBalance(newBalance);
      setPositions(updatedPositions);
      saveUserData(newBalance, updatedPositions);
      
      setOrderResult({
        type: 'BUY',
        symbol: symbol,
        quantity: qty,
        price: price,
        total: totalCost,
        newBalance: newBalance,
      });
      
      setOrderModalVisible(false);
      setSuccessModalVisible(true);
      
      // Animate success
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
      
    } else {
      // SELL - find position to close or add short
      const existingPosition = positions.find(p => p.symbol === symbol && p.type === 'BUY');
      
      if (existingPosition) {
        // Close existing position - credit profit/loss to balance
        const profitLoss = (price - existingPosition.entryPrice) * existingPosition.quantity;
        const saleValue = existingPosition.quantity * price;
        const newBalance = userBalance + saleValue;
        const updatedPositions = positions.filter(p => p.id !== existingPosition.id);
        
        setUserBalance(newBalance);
        setPositions(updatedPositions);
        saveUserData(newBalance, updatedPositions);
        
        setOrderResult({
          type: 'SELL',
          symbol: symbol,
          quantity: existingPosition.quantity,
          price: price,
          total: saleValue,
          profitLoss: profitLoss,
          newBalance: newBalance,
        });
      } else {
        // No position to sell - simulated short sell
        const newPosition = {
          id: Date.now(),
          symbol: symbol,
          type: 'SELL',
          quantity: qty,
          entryPrice: price,
          timestamp: new Date().toISOString(),
        };
        const updatedPositions = [...positions, newPosition];
        const newBalance = userBalance + totalCost; // Credit for short sale
        
        setUserBalance(newBalance);
        setPositions(updatedPositions);
        saveUserData(newBalance, updatedPositions);
        
        setOrderResult({
          type: 'SELL',
          symbol: symbol,
          quantity: qty,
          price: price,
          total: totalCost,
          newBalance: newBalance,
        });
      }
      
      setOrderModalVisible(false);
      setSuccessModalVisible(true);
      
      Animated.sequence([
        Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  };

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

  // Setup WebSocket connection
  useEffect(() => {
    if (isLoggedIn && instrumentId) {
      websocketService.connect().catch(console.error);
      unsubscribeRef.current = websocketService.subscribe('price', handlePriceUpdate);
      websocketService.subscribeToInstrument(instrumentId);
    }
    
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (instrumentId) websocketService.unsubscribeFromInstrument(instrumentId);
    };
  }, [isLoggedIn, instrumentId, handlePriceUpdate]);

  // Fetch instrument data
  const fetchInstrumentData = async () => {
    try {
      if (instrumentId) {
        const response = await instrumentService.getInstrument(instrumentId);
        if (response.success) {
          setInstrumentData(response.data?.instrument || response.data);
        }
      } else if (symbol) {
        const response = await instrumentService.getBySymbol(symbol);
        if (response.success) {
          setInstrumentData(response.data?.instrument || response.data);
        }
      }
      
      // Set placeholder if no data
      if (!instrumentData) {
        setInstrumentData({
          symbol: symbol,
          name: symbol,
          lastPrice: 64000,
          changePercent: 0.81,
        });
      }
      
      // Fetch OHLC data
      if (instrumentId) {
        try {
          const ohlcResponse = await instrumentService.getOHLC(instrumentId);
          if (ohlcResponse.success && Array.isArray(ohlcResponse.data)) {
            setCandlestickData(ohlcResponse.data);
          }
        } catch (e) {
          console.log('OHLC not available');
        }
      }
    } catch (error) {
      console.log('Error fetching instrument:', error.message);
      setInstrumentData({
        symbol: symbol,
        name: symbol,
        lastPrice: 64000,
        changePercent: 0.81,
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchInstrumentData();
      setLoading(false);
    };
    loadData();
  }, []);

  // Generate chart data
  const seed = `${symbol || ''}-${instrumentId || ''}`;
  const basePrice = instrumentData?.lastPrice || instrumentData?.currentPrice || 64000;
  const chartCandles = useMemo(() => {
    return candlestickData.length > 0 ? candlestickData : generateDummyOHLC(seed, 50, basePrice);
  }, [candlestickData, seed, basePrice]);

  // Calculate chart scales
  const chartData = useMemo(() => {
    if (chartCandles.length === 0) return { candles: [], yMin: 0, yMax: 0, yLabels: [] };
    
    const highs = chartCandles.map(c => c.high);
    const lows = chartCandles.map(c => c.low);
    const volumes = chartCandles.map(c => c.volume);
    
    const yMin = Math.min(...lows) * 0.9995;
    const yMax = Math.max(...highs) * 1.0005;
    const maxVolume = Math.max(...volumes);
    
    // Generate 5 y-axis labels
    const yRange = yMax - yMin;
    const yLabels = Array(5).fill(0).map((_, i) => {
      return yMax - (yRange * i / 4);
    });
    
    return { yMin, yMax, yLabels, maxVolume };
  }, [chartCandles]);

  // Current price info
  const currentPrice = livePrice?.ltp || instrumentData?.currentPrice || instrumentData?.lastPrice || basePrice;
  const priceChange = instrumentData?.changePercent || 0.81;
  
  // Generate order book data
  const generateOrderBook = useCallback((price, count = 8) => {
    if (!price) return [];
    const orders = [];
    for (let i = 0; i < count; i++) {
      const bidPrice = price - (i * price * 0.00002);
      const askPrice = price + (i * price * 0.00002);
      const bidAmount = (2485 + Math.random() * 10).toFixed(2);
      const askAmount = (2485 + Math.random() * 10).toFixed(2);
      orders.push({
        bid: bidPrice.toFixed(2),
        bidAmount,
        ask: askPrice.toFixed(2),
        askAmount,
      });
    }
    return orders;
  }, []);

  const orderBook = useMemo(() => generateOrderBook(currentPrice), [currentPrice, generateOrderBook]);

  // Render candlestick chart
  const renderCandlestickChart = () => {
    const candleWidth = (CHART_WIDTH - 20) / chartCandles.length;
    const volumeHeight = 40;
    const priceChartHeight = CHART_HEIGHT - volumeHeight - 20;
    
    const { yMin, yMax, yLabels, maxVolume } = chartData;
    const yRange = yMax - yMin;
    
    const scaleY = (price) => {
      return priceChartHeight - ((price - yMin) / yRange) * priceChartHeight;
    };
    
    const scaleVolume = (vol) => {
      return (vol / maxVolume) * volumeHeight;
    };

    return (
      <View style={styles.chartWrapper}>
        {/* Y-axis labels */}
        <View style={styles.yAxisLabels}>
          {yLabels.map((label, i) => (
            <Text key={i} style={styles.yAxisLabel}>
              {formatPrice(label)}
            </Text>
          ))}
        </View>
        
        {/* Chart area */}
        <View style={styles.chartArea}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            {/* Grid lines */}
            {yLabels.map((_, i) => (
              <Line
                key={`grid-${i}`}
                x1={0}
                y1={scaleY(yLabels[i])}
                x2={CHART_WIDTH}
                y2={scaleY(yLabels[i])}
                stroke={colors.border}
                strokeWidth={0.5}
                strokeDasharray="4,4"
              />
            ))}
            
            {/* Volume bars */}
            <G>
              {chartCandles.map((candle, i) => {
                const x = i * candleWidth + candleWidth * 0.2;
                const volHeight = scaleVolume(candle.volume);
                const volY = CHART_HEIGHT - volHeight;
                
                return (
                  <Rect
                    key={`vol-${i}`}
                    x={x}
                    y={volY}
                    width={candleWidth * 0.6}
                    height={volHeight}
                    fill={candle.positive ? colors.green + '40' : colors.red + '40'}
                  />
                );
              })}
            </G>
            
            {/* Candlesticks */}
            <G>
              {chartCandles.map((candle, i) => {
                const x = i * candleWidth + candleWidth / 2;
                const candleColor = candle.positive ? colors.green : colors.red;
                
                const wickTop = scaleY(candle.high);
                const wickBottom = scaleY(candle.low);
                const bodyTop = scaleY(Math.max(candle.open, candle.close));
                const bodyBottom = scaleY(Math.min(candle.open, candle.close));
                const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
                
                return (
                  <G key={`candle-${i}`}>
                    {/* Wick */}
                    <Line
                      x1={x}
                      y1={wickTop}
                      x2={x}
                      y2={wickBottom}
                      stroke={candleColor}
                      strokeWidth={1}
                    />
                    {/* Body */}
                    <Rect
                      x={x - candleWidth * 0.3}
                      y={bodyTop}
                      width={candleWidth * 0.6}
                      height={bodyHeight}
                      fill={candleColor}
                    />
                  </G>
                );
              })}
            </G>
          </Svg>
          
          {/* X-axis time labels */}
          <View style={styles.xAxisLabels}>
            {chartCandles.filter((_, i) => i % 10 === 0).map((candle, i) => (
              <Text key={i} style={styles.xAxisLabel}>
                {formatTimeLabel(candle.time)}
              </Text>
            ))}
          </View>
        </View>
        
        {/* Refresh icon */}
        <TouchableOpacity style={styles.refreshIcon}>
          <Ionicons name="refresh" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{symbol}</Text>
          <Ionicons name="flash" size={16} color={colors.textSecondary} style={styles.flashIcon} />
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Price Change */}
      <View style={styles.priceChangeContainer}>
        <Text style={[styles.priceChange, priceChange >= 0 ? styles.positiveChange : styles.negativeChange]}>
          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
        </Text>
      </View>

      {/* Candlestick Chart */}
      {renderCandlestickChart()}

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === tf && styles.timeframeTextActive,
              ]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Buy/Sell Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.sellButton]}
          onPress={() => {
            setOrderType('SELL');
            setQuantity('1');
            setOrderModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => {
            setOrderType('BUY');
            setQuantity('1');
            setOrderModalVisible(true);
          }}
        >
          <Text style={styles.actionButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Order books' && styles.tabActive]}
          onPress={() => setActiveTab('Order books')}
        >
          <Text style={[styles.tabText, activeTab === 'Order books' && styles.tabTextActive]}>
            Order books
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Positions' && styles.tabActive]}
          onPress={() => setActiveTab('Positions')}
        >
          <Text style={[styles.tabText, activeTab === 'Positions' && styles.tabTextActive]}>
            Positions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order Book Content */}
      {activeTab === 'Order books' && (
        <View style={styles.orderBookContainer}>
          {/* Header */}
          <View style={styles.orderBookHeader}>
            <Text style={styles.orderBookHeaderText}>Bid</Text>
            <Text style={styles.orderBookHeaderText}>Ask</Text>
          </View>
          
          {/* Order Book Table */}
          <ScrollView style={styles.orderBookTable} showsVerticalScrollIndicator={false}>
            {orderBook.map((order, index) => (
              <View key={index} style={styles.orderBookRow}>
                {/* Bid side */}
                <View style={styles.orderBookBidSide}>
                  <Text style={styles.orderBookPrice}>{formatPrice(parseFloat(order.bid))}</Text>
                  <View style={styles.bidBarContainer}>
                    <View style={[styles.bidBar, { width: `${60 + Math.random() * 40}%` }]} />
                    <Text style={styles.orderBookAmount}>{order.bidAmount}</Text>
                  </View>
                </View>
                
                {/* Ask side */}
                <View style={styles.orderBookAskSide}>
                  <Text style={styles.orderBookPrice}>{formatPrice(parseFloat(order.ask))}</Text>
                  <View style={styles.askBarContainer}>
                    <View style={[styles.askBar, { width: `${60 + Math.random() * 40}%` }]} />
                    <Text style={styles.orderBookAmountAsk}>{order.askAmount}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {activeTab === 'Positions' && (
        <View style={styles.positionsContainer}>
          {/* Balance Display */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>${formatPrice(userBalance)}</Text>
          </View>
          
          {positions.length === 0 ? (
            <View style={styles.emptyPositions}>
              <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No open positions</Text>
            </View>
          ) : (
            <ScrollView style={styles.positionsList}>
              {positions.map((position) => {
                const pnl = position.type === 'BUY' 
                  ? (currentPrice - position.entryPrice) * position.quantity
                  : (position.entryPrice - currentPrice) * position.quantity;
                const pnlPercent = ((pnl / (position.entryPrice * position.quantity)) * 100).toFixed(2);
                const isProfit = pnl >= 0;
                
                return (
                  <View key={position.id} style={styles.positionCard}>
                    <View style={styles.positionHeader}>
                      <View style={styles.positionSymbol}>
                        <View style={[styles.positionTypeBadge, position.type === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
                          <Text style={styles.positionTypeText}>{position.type}</Text>
                        </View>
                        <Text style={styles.positionSymbolText}>{position.symbol}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.closePositionBtn}
                        onPress={() => {
                          setOrderType('SELL');
                          setOrderModalVisible(true);
                        }}
                      >
                        <Text style={styles.closePositionText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.positionDetails}>
                      <View style={styles.positionDetailRow}>
                        <Text style={styles.positionDetailLabel}>Quantity</Text>
                        <Text style={styles.positionDetailValue}>{position.quantity}</Text>
                      </View>
                      <View style={styles.positionDetailRow}>
                        <Text style={styles.positionDetailLabel}>Entry Price</Text>
                        <Text style={styles.positionDetailValue}>${formatPrice(position.entryPrice)}</Text>
                      </View>
                      <View style={styles.positionDetailRow}>
                        <Text style={styles.positionDetailLabel}>Current Price</Text>
                        <Text style={styles.positionDetailValue}>${formatPrice(currentPrice)}</Text>
                      </View>
                      <View style={styles.positionDetailRow}>
                        <Text style={styles.positionDetailLabel}>P&L</Text>
                        <Text style={[styles.positionDetailValue, isProfit ? styles.profitText : styles.lossText]}>
                          {isProfit ? '+' : ''}{formatPrice(pnl)} ({isProfit ? '+' : ''}{pnlPercent}%)
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {/* Simulated Order Modal */}
      <Modal
        visible={orderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {orderType === 'BUY' ? '🟢 Buy' : '🔴 Sell'} {symbol}
              </Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.priceDisplay}>
                <Text style={styles.modalLabel}>Current Price</Text>
                <Text style={styles.modalPrice}>${formatPrice(currentPrice)}</Text>
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.modalLabel}>Quantity</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              
              <View style={styles.totalDisplay}>
                <Text style={styles.modalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${formatPrice((parseFloat(quantity) || 0) * currentPrice)}
                </Text>
              </View>
              
              <View style={styles.balanceDisplay}>
                <Text style={styles.balanceSmallLabel}>Available Balance</Text>
                <Text style={styles.balanceSmall}>${formatPrice(userBalance)}</Text>
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setOrderModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, orderType === 'BUY' ? styles.confirmBuy : styles.confirmSell]}
                onPress={executeTrade}
              >
                <Text style={styles.confirmButtonText}>
                  Confirm {orderType}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={successModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.successOverlay}
          activeOpacity={1}
          onPress={() => setSuccessModalVisible(false)}
        >
          <Animated.View style={[styles.successContent, { opacity: successAnim }]}>
            <View style={styles.successIcon}>
              <Ionicons 
                name="checkmark-circle" 
                size={64} 
                color={orderResult?.type === 'BUY' ? '#16a34a' : '#dc2626'} 
              />
            </View>
            <Text style={styles.successTitle}>Order Executed!</Text>
            {orderResult && (
              <View style={styles.successDetails}>
                <Text style={styles.successText}>
                  {orderResult.type === 'BUY' ? 'Bought' : 'Sold'} {orderResult.quantity} {orderResult.symbol}
                </Text>
                <Text style={styles.successText}>
                  @ ${formatPrice(orderResult.price)}
                </Text>
                <Text style={styles.successTotal}>
                  Total: ${formatPrice(orderResult.total)}
                </Text>
                {orderResult.profitLoss !== undefined && (
                  <Text style={[styles.successPnL, orderResult.profitLoss >= 0 ? styles.profitText : styles.lossText]}>
                    P&L: {orderResult.profitLoss >= 0 ? '+' : ''}${formatPrice(orderResult.profitLoss)}
                  </Text>
                )}
                <Text style={styles.successBalance}>
                  New Balance: ${formatPrice(orderResult.newBalance)}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.successDismiss}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successDismissText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  flashIcon: {
    marginLeft: 6,
  },
  // Price Change
  priceChangeContainer: {
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  positiveChange: {
    color: colors.green,
  },
  negativeChange: {
    color: colors.red,
  },
  // Chart
  chartWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  yAxisLabels: {
    width: 60,
    height: CHART_HEIGHT - 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  chartArea: {
    flex: 1,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  refreshIcon: {
    position: 'absolute',
    right: 16,
    top: CHART_HEIGHT / 2 - 20,
  },
  // Timeframe
  timeframeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
  },
  timeframeButtonActive: {
    backgroundColor: colors.border,
  },
  timeframeText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: colors.textPrimary,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
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
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
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
  // Order Book
  orderBookContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderBookHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderBookHeaderText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  orderBookTable: {
    flex: 1,
  },
  orderBookRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  orderBookBidSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderBookAskSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  orderBookPrice: {
    color: colors.textPrimary,
    fontSize: 13,
    width: 80,
  },
  bidBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  askBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidBar: {
    height: 20,
    backgroundColor: colors.green + '30',
    position: 'absolute',
    right: 0,
  },
  askBar: {
    height: 20,
    backgroundColor: colors.red + '30',
    position: 'absolute',
    left: 0,
  },
  orderBookAmount: {
    color: colors.green,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  orderBookAmountAsk: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  // Positions
  positionsContainer: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: colors.cardBg || '#1c1c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#16a34a',
    fontSize: 28,
    fontWeight: '700',
  },
  emptyPositions: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  positionsList: {
    flex: 1,
  },
  positionCard: {
    backgroundColor: colors.cardBg || '#1c1c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  positionSymbol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  positionTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buyBadge: {
    backgroundColor: '#16a34a30',
  },
  sellBadge: {
    backgroundColor: '#dc262630',
  },
  positionTypeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  positionSymbolText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  closePositionBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closePositionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  positionDetails: {
    gap: 8,
  },
  positionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionDetailLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  positionDetailValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  profitText: {
    color: '#16a34a',
  },
  lossText: {
    color: '#dc2626',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBg || '#1c1c2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    gap: 20,
  },
  priceDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  modalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  modalPrice: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  inputContainer: {
    gap: 8,
  },
  quantityInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  totalDisplay: {
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  balanceDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  balanceSmallLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  balanceSmall: {
    color: '#16a34a',
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBuy: {
    backgroundColor: '#16a34a',
  },
  confirmSell: {
    backgroundColor: '#dc2626',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Success Modal
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: colors.cardBg || '#1c1c2e',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width - 48,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  successDetails: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  successText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  successTotal: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  successPnL: {
    fontSize: 18,
    fontWeight: '600',
  },
  successBalance: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  successDismiss: {
    backgroundColor: colors.primary || '#6366f1',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  successDismissText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
