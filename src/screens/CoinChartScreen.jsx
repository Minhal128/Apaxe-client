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
import { Svg, Rect, Line, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { instrumentService, websocketService, userService, orderService, positionService, segmentService } from '../services';
import SearchCoinModal from '../components/SearchCoinModal';

const { width, height } = Dimensions.get('window');
const CHART_WIDTH = width - 80;
const CHART_HEIGHT = 280;

const timeframes = ['1m', '5m', '15m', '30m', '1h', '1d', 'More'];

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
  const interval = 5 * 60 * 1000; // 5 minute intervals as requested

  for (let i = 0; i < count; i++) {
    const changePct = (rnd() - 0.5) * 0.015;
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

const formatPrice = (price) => {
  if (!price) return '0.00';
  return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatTimeLabel = (timestamp) => {
  let ts = timestamp;
  if (typeof ts === 'string' && !isNaN(Number(ts))) ts = Number(ts);
  if (!ts) ts = Date.now();
  if (typeof ts === 'number' && ts < 10000000000) ts = ts * 1000;

  let date = new Date(ts);
  if (isNaN(date.getTime())) date = new Date();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function CoinChartScreen({ route, navigation }) {
  const { symbol = 'BTC/USDT', instrumentId = null, isLoggedIn = false, userId = null } = route?.params || {};
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [activeTab, setActiveTab] = useState('Positions');
  const [positionFilter, setPositionFilter] = useState('Open');
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [orderType, setOrderType] = useState('BUY');
  const [selectedOrderType, setSelectedOrderType] = useState('MARKET'); // MARKET, LIMIT, STOP, STOP_LIMIT
  const [orderTypeDropdownVisible, setOrderTypeDropdownVisible] = useState(false);
  const [instrumentDropdownVisible, setInstrumentDropdownVisible] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null); // For dropdown selection
  const [availableInstruments, setAvailableInstruments] = useState([]); // List of instruments for dropdown
  const [quantity, setQuantity] = useState('0.49');
  const [orderResult, setOrderResult] = useState(null);
  const [stopLoss, setStopLoss] = useState(0);
  const [takeProfit, setTakeProfit] = useState(0);
  const [selectedCandle, setSelectedCandle] = useState(null);

  // Order type options
  const ORDER_TYPES = [
    { value: 'MARKET', label: 'Market order' },
    { value: 'LIMIT', label: 'Limit order' },
    { value: 'STOP', label: 'Stop order' },
    { value: 'STOP_LIMIT', label: 'Stop-Limit order' },
  ];

  // Market watch data
  const [marketWatchData, setMarketWatchData] = useState([]);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketWatchSearch, setMarketWatchSearch] = useState('');
  const [searchSegment, setSearchSegment] = useState('NSE');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('NSE');
  const [categories, setCategories] = useState(['NSE', 'MCX', 'FOREX', 'CRYPTO', 'EQUITY', 'COMMUNITY']);
  const [rawSegments, setRawSegments] = useState({}); // To map display names back to raw names

  const [userBalance, setUserBalance] = useState({
    balance: 0,
    availableMargin: 0,
    lockedMargin: 0,
  }); // Balance from API
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]); // All orders for pending/closed
  const [closedPositions, setClosedPositions] = useState([]); // Closed positions history
  const [currentUserId, setCurrentUserId] = useState(userId);
  const [orderLoading, setOrderLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingOHLC, setLoadingOHLC] = useState(false);
  const [instrumentData, setInstrumentData] = useState(null);
  const [candlestickData, setCandlestickData] = useState([]);
  const [livePrice, setLivePrice] = useState(null);

  const successAnim = useRef(new Animated.Value(0)).current;
  const unsubscribeRef = useRef(null);

  // Fetch positions, orders and balance from API
  const fetchUserData = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const [balanceRes, positionsRes, ordersRes, orderHistoryRes, positionHistoryRes] = await Promise.all([
        userService.getBalance().catch(() => ({ success: false })),
        positionService.getPositions().catch(() => ({ success: false, data: [] })),
        orderService.getOrders().catch(() => ({ success: false, data: [] })),
        orderService.getOrderHistory().catch(() => ({ success: false, data: [] })),
        positionService.getPositionHistory().catch(() => ({ success: false, data: [] }))
      ]);

      if (balanceRes.success) {
        setUserBalance({
          balance: balanceRes.balance || 0,
          availableMargin: balanceRes.availableMargin || 0,
          lockedMargin: balanceRes.lockedMargin || 0,
        });
      }

      // Set open positions
      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      }

      // Combine orders for pending/filled filtering
      if (ordersRes.success || orderHistoryRes.success) {
        const allOrders = [...(ordersRes.data || []), ...(orderHistoryRes.data || [])];
        // Remove duplicates by id
        const uniqueOrders = allOrders.filter((order, index, self) =>
          index === self.findIndex(o => o.id === order.id)
        );
        setOrders(uniqueOrders);
      }

      // Set closed positions
      if (positionHistoryRes.success) {
        setClosedPositions(positionHistoryRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [isLoggedIn]);

  // Fetch user data (positions, orders) on mount
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn, fetchUserData]);

  // Fetch market watch data based on selected category
  useEffect(() => {
    const fetchMarketWatch = async () => {
      try {
        const apiSegment = rawSegments[selectedCategory] || selectedCategory;
        const response = await instrumentService.getMarketWatch(apiSegment);
        const instruments = response?.data?.instruments || [];
        setMarketWatchData(instruments.slice(0, 20));

        // Auto-load first instrument of segment if current symbol is not in this segment
        if (instruments.length > 0 && !instruments.some(i => i.symbol === symbol)) {
          console.log('Segment changed, loading first instrument:', instruments[0].symbol);
          // Don't auto-replace unless manually triggered or on first load within segment context
          // For now, let's keep it manual to avoid surprising the user, but we'll ensures sparklines work
        }
      } catch (e) {
        console.log('Error fetching market watch:', e);
      }
    };
    fetchMarketWatch();
  }, [selectedCategory, rawSegments]);

  // Search instruments by segment
  const searchInstruments = async (segment, query = '') => {
    try {
      const response = await instrumentService.getMarketWatch(segment);
      let instruments = response?.data?.instruments || [];
      if (query) {
        instruments = instruments.filter(i =>
          i.symbol?.toLowerCase().includes(query.toLowerCase()) ||
          i.name?.toLowerCase().includes(query.toLowerCase())
        );
      }
      setSearchResults(instruments.slice(0, 20));
    } catch (e) {
      console.log('Error searching instruments:', e);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (searchModalVisible) {
      searchInstruments(searchSegment, searchQuery);
    }
  }, [searchModalVisible, searchSegment, searchQuery]);

  // Display balance from API - use availableMargin for trading decisions
  const displayBalance = userBalance?.balance || 0;
  const displayAvailableMargin = userBalance?.availableMargin || 0;
  const displayLockedMargin = userBalance?.lockedMargin || 0;
  const displayEquity = userBalance?.balance || 0;
  const displayFreeMargin = userBalance?.availableMargin || 0;

  const adjustQuantity = (delta) => {
    const current = parseFloat(quantity) || 0;
    const newValue = Math.max(0.01, current + delta);
    setQuantity(newValue.toFixed(2));
  };

  const executeTrade = async (side) => {
    const tradeType = side || orderType;
    const qty = parseFloat(quantity) || 1;
    const price = currentPrice || 64000;
    const totalCost = qty * price;

    // Use selected instrument from dropdown if available, otherwise fall back to current instrument
    const tradeInstrument = selectedInstrument || instrumentData;
    const tradeSymbol = selectedInstrument?.symbol || symbol;
    const actualInstrumentId = tradeInstrument?.id || tradeInstrument?.instrumentId || instrumentId;

    if (!actualInstrumentId) {
      Alert.alert('Error', 'Instrument not found. Please try again.');
      return;
    }

    setOrderLoading(true);

    // Use availableMargin for balance check, not total balance
    if (tradeType === 'BUY') {
      if (totalCost > displayAvailableMargin) {
        Alert.alert(
          'Insufficient Margin',
          `You need ${formatPrice(totalCost)} but only have ${formatPrice(displayAvailableMargin)} available`,
          [{ text: 'OK' }]
        );
        setOrderLoading(false);
        return;
      }
    }

    try {
      // Place order through the orders API - this handles balance internally
      // Build order data based on order type (matching CreateOrderModal format)
      const orderData = {
        instrumentId: actualInstrumentId,
        side: tradeType, // 'BUY' or 'SELL'
        orderType: selectedOrderType || 'MARKET',
        quantity: qty,
        isIntraday: true,
      };

      // Add price only for LIMIT or STOP_LIMIT orders
      if (selectedOrderType === 'LIMIT' || selectedOrderType === 'STOP_LIMIT') {
        orderData.price = price;
      }

      // Add stop loss and take profit if set
      if (stopLoss > 0) {
        orderData.stopLoss = stopLoss;
      }
      if (takeProfit > 0) {
        orderData.takeProfit = takeProfit;
      }

      console.log('Placing order with data:', JSON.stringify(orderData));

      const orderResult = await orderService.placeOrder(orderData);

      if (orderResult.success) {
        // Fetch updated balance from API
        const newBalanceResult = await userService.getBalance();
        if (newBalanceResult.success) {
          setUserBalance({
            balance: newBalanceResult.balance || 0,
            availableMargin: newBalanceResult.availableMargin || 0,
            lockedMargin: newBalanceResult.lockedMargin || 0,
          });
        }

        setOrderResult({
          type: tradeType,
          symbol: tradeSymbol,
          quantity: qty,
          price: price,
          total: totalCost,
          newBalance: newBalanceResult.success ? newBalanceResult.availableMargin : displayAvailableMargin,
        });

        setOrderLoading(false);
        setOrderModalVisible(false);
        setSuccessModalVisible(true);

        Animated.sequence([
          Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setSuccessModalVisible(false));
      } else {
        Alert.alert('Error', orderResult.error?.message || orderResult.error || 'Order failed');
        setOrderLoading(false);
      }
    } catch (error) {
      console.error('Trade error:', error);
      Alert.alert('Error', error.message || 'Trade failed');
      setOrderLoading(false);
    }
  };

  const handlePriceUpdate = useCallback((data) => {
    // Normalize symbols: backend may send "GOLD/MCX" while the app stores "GOLD"
    const normWs  = (data.symbol  || '').split('/')[0].toUpperCase();
    const normApp = (symbol       || '').split('/')[0].toUpperCase();
    if (data.instrumentId !== instrumentId && normWs !== normApp) return;

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

    setCandlestickData(prevCandles => {
        if (prevCandles.length === 0) return prevCandles;

        const updatedCandles = [...prevCandles];
        const lastCandle = updatedCandles[updatedCandles.length - 1];
        const currentTime = Date.now();
        const timeframeMultipliers = {
          '1m': 1,
          '5m': 5,
          '15m': 15,
          '30m': 30,
          '1h': 60,
          '1d': 1440
        };
        const intervalInMinutes = timeframeMultipliers[selectedTimeframe] || 15;
        const candleInterval = intervalInMinutes * 60 * 1000;

        if (currentTime - lastCandle.time < candleInterval) {
          lastCandle.close = data.ltp;
          lastCandle.high = Math.max(lastCandle.high, data.ltp);
          lastCandle.low = Math.min(lastCandle.low, data.ltp);
          lastCandle.volume = (lastCandle.volume || 0) + (data.volume || 0);
          lastCandle.positive = lastCandle.close >= lastCandle.open;
        } else {
          const newCandle = {
            open: lastCandle.close,
            high: data.ltp,
            low: data.ltp,
            close: data.ltp,
            volume: data.volume || 0,
            time: currentTime,
            positive: data.ltp >= lastCandle.close
          };
          updatedCandles.push(newCandle);

          if (updatedCandles.length > 50) {
            updatedCandles.shift();
          }
        }

        return updatedCandles;
      });
  }, [instrumentId, symbol, selectedTimeframe]);

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

  const fetchSegments = useCallback(async () => {
    try {
      const response = await segmentService.getSegments();
      if (response.success) {
        let segs = response.data?.segments || response.data || [];
        if (!Array.isArray(segs)) segs = [];

        const nameMap = {
          'apex': 'NSE',
          'crypto': 'CRYPTO',
          'mcx2': 'MCX',
          'mcx': 'MCX',
          'test': 'EQUITY',
          'test1': 'COMMUNITY',
          'forex': 'FOREX',
          'nse': 'NSE',
          'equity': 'EQUITY',
          'community': 'COMMUNITY'
        };

        const mappedRaw = {};
        const displayNames = [];

        segs.forEach(s => {
          const raw = (s.name || s).toLowerCase();
          const display = nameMap[raw] || raw.toUpperCase();
          if (!displayNames.includes(display)) {
            displayNames.push(display);
            mappedRaw[display] = s.name || s;
          }
        });

        if (displayNames.length > 0) {
          setCategories(displayNames);
          setRawSegments(mappedRaw);
          if (!displayNames.includes(selectedCategory)) {
            setSelectedCategory(displayNames[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
      // Keep defaults on error
    }
  }, [selectedCategory]);

  const fetchInstrumentDetails = async () => {
    try {
      if (instrumentId) {
        const response = await instrumentService.getInstrument(instrumentId);
        if (response.success) {
          const data = response.data?.instrument || response.data;
          console.log('Fetched instrument data:', data);
          setInstrumentData(data);
        }
      } else if (symbol) {
        const response = await instrumentService.getBySymbol(symbol);
        if (response.success) {
          const data = response.data?.instrument || response.data;
          console.log('Fetched instrument by symbol:', data);
          setInstrumentData(data);
        }
      }

      if (!instrumentData) {
        setInstrumentData({
          id: instrumentId,
          instrumentId: instrumentId,
          symbol: symbol,
          name: symbol,
          lastPrice: 64000,
          changePercent: 0.81,
        });
      }
    } catch (error) {
      console.log('Error fetching instrument:', error.message);
      setInstrumentData({
        id: instrumentId,
        instrumentId: instrumentId,
        symbol: symbol,
        name: symbol,
        lastPrice: 64000,
        changePercent: 0.81,
      });
    }
  };

  const fetchOHLCData = async () => {
    if (!instrumentId) return;
    // Capture the current best-known price now (before the async request) so the
    // fallback dummy candles are anchored to the real market level.
    const fallbackBase = instrumentData?.currentPrice || instrumentData?.lastPrice || 64000;
    try {
      const timeframeMap = {
        '1m': '1m',
        '5m': '5m',
        '15m': '15m',
        '30m': '30m',
        '1h': '1h',
        '1d': '1d'
      };
      const apiTimeframe = timeframeMap[selectedTimeframe] || '15m';
      const ohlcResponse = await instrumentService.getOHLC(instrumentId, apiTimeframe);
      if (ohlcResponse.success && Array.isArray(ohlcResponse.data) && ohlcResponse.data.length > 0) {
        // Normalize field names and strictly enforce sequential timestamps
        const now = Date.now();
        const timeframeMultipliers = { '1m': 1, '5m': 5, '15m': 15, '30m': 30, '1h': 60, '1d': 1440 };
        const intervalMs = (timeframeMultipliers[selectedTimeframe] || 5) * 60 * 1000;

        const normalized = ohlcResponse.data.map((d, index) => {
          let candleTime = d.time || d.t || d.timestamp;
          if (typeof candleTime === 'number' && candleTime < 10000000000) candleTime *= 1000;

          // Generate strictly sequential fallback to ensure 5m difference if data is missing or broken
          const fallbackTime = now - (ohlcResponse.data.length - index) * intervalMs;

          return {
            ...d,
            time: (candleTime && !isNaN(new Date(candleTime).getTime())) ? candleTime : fallbackTime,
            open: d.open || d.o || 0,
            high: d.high || d.h || 0,
            low: d.low || d.l || 0,
            close: d.close || d.c || 0,
            volume: d.volume || d.v || 0,
            positive: (d.close || d.c || 0) >= (d.open || d.o || 0)
          };
        });
        setCandlestickData(normalized);
      } else {
        // OHLC endpoint returned no data (or a server error) — seed the chart
        // with dummy candles anchored to the real instrument price so
        // handlePriceUpdate can then animate the rightmost candle live.
        if (candlestickData.length === 0) {
          setCandlestickData(generateDummyOHLC(`${symbol}-${instrumentId}`, 50, fallbackBase));
        }
      }
    } catch (e) {
      console.log('OHLC not available');
      // Same fallback: seed once so live WebSocket updates can paint on top.
      if (candlestickData.length === 0) {
        setCandlestickData(generateDummyOHLC(`${symbol}-${instrumentId}`, 50, fallbackBase));
      }
    }
  };

  const fetchInstrumentData = async () => {
    await fetchInstrumentDetails();
    await fetchOHLCData();
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchInstrumentDetails(),
        fetchOHLCData(),
        fetchSegments()
      ]);
      setLoading(false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const updateOHLC = async () => {
      setLoadingOHLC(true);
      if (typeof fetchOHLCData === 'function') {
        await fetchOHLCData();
      } else {
        await fetchInstrumentData();
      }
      setLoadingOHLC(false);
    };
    if (!loading) {
      updateOHLC();
    }
  }, [selectedTimeframe]);

  const seed = `${symbol || ''}-${instrumentId || ''}`;
  const basePrice = instrumentData?.lastPrice || instrumentData?.currentPrice || 64000;
  const chartCandles = useMemo(() => {
    return candlestickData.length > 0 ? candlestickData : generateDummyOHLC(seed, 50, basePrice);
  }, [candlestickData, seed, basePrice]);

  const chartData = useMemo(() => {
    if (chartCandles.length === 0) return { candles: [], yMin: 0, yMax: 0, yLabels: [] };

    const highs = chartCandles.map(c => c.high);
    const lows = chartCandles.map(c => c.low);
    const volumes = chartCandles.map(c => c.volume);

    const yMin = Math.min(...lows) * 0.9995;
    const yMax = Math.max(...highs) * 1.0005;
    const maxVolume = Math.max(...volumes);

    const yRange = yMax - yMin;
    const yLabels = Array(7).fill(0).map((_, i) => {
      return yMax - (yRange * i / 6);
    });

    return { yMin, yMax, yLabels, maxVolume };
  }, [chartCandles]);

  const currentPrice = livePrice?.ltp || instrumentData?.currentPrice || instrumentData?.lastPrice || basePrice;
  const priceChange = instrumentData?.changePercent || 0.81;
  const bidPrice = (currentPrice * 0.99999).toFixed(5);
  const askPrice = (currentPrice * 1.00001).toFixed(5);

  const generateOrderBook = useCallback((price, count = 10) => {
    if (!price) return [];
    const orders = [];
    for (let i = 0; i < count; i++) {
      const bidP = price - (i * price * 0.00002);
      const askP = price + (i * price * 0.00002);
      const bidAmount = (2485 + Math.random() * 0.5).toFixed(2);
      const askAmount = (2485 + Math.random() * 0.5).toFixed(2);
      orders.push({
        bid: bidP.toFixed(2),
        bidAmount,
        ask: askP.toFixed(2),
        askAmount,
      });
    }
    return orders;
  }, []);

  const orderBook = useMemo(() => generateOrderBook(currentPrice), [currentPrice, generateOrderBook]);

  const renderCandlestickChart = () => {
    if (chartCandles.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.emptyChartText}>Loading chart data...</Text>
        </View>
      );
    }

    const candleWidth = Math.max(6, (CHART_WIDTH - 20) / chartCandles.length);
    const volumeHeight = 50;
    const priceChartHeight = CHART_HEIGHT - volumeHeight - 30;

    const { yMin, yMax, yLabels, maxVolume } = chartData;
    const yRange = yMax - yMin;

    const scaleY = (price) => {
      return priceChartHeight - ((price - yMin) / yRange) * priceChartHeight + 5;
    };

    const scaleVolume = (vol) => {
      return (vol / maxVolume) * volumeHeight;
    };

    const handleCandlePress = (candle, index) => {
      setSelectedCandle(selectedCandle?.index === index ? null : { ...candle, index });
    };

    return (
      <View style={styles.chartContainer}>
        {loadingOHLC && (
          <View style={styles.chartLoadingOverlay}>
            <ActivityIndicator size="small" color="#00D68F" />
          </View>
        )}
        {/* Selected candle info overlay */}
        {selectedCandle && (
          <View style={styles.candleInfoOverlay}>
            <View style={styles.candleInfoRow}>
              <Text style={styles.candleInfoLabel}>O:</Text>
              <Text style={[styles.candleInfoValue, { color: selectedCandle.positive ? '#00D68F' : '#FF4757' }]}>
                {formatPrice(selectedCandle.open)}
              </Text>
              <Text style={styles.candleInfoLabel}>H:</Text>
              <Text style={styles.candleInfoValue}>{formatPrice(selectedCandle.high)}</Text>
              <Text style={styles.candleInfoLabel}>L:</Text>
              <Text style={styles.candleInfoValue}>{formatPrice(selectedCandle.low)}</Text>
              <Text style={styles.candleInfoLabel}>C:</Text>
              <Text style={[styles.candleInfoValue, { color: selectedCandle.positive ? '#00D68F' : '#FF4757' }]}>
                {formatPrice(selectedCandle.close)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.chartRow}>
          <TouchableOpacity
            style={styles.chartSvgContainer}
            activeOpacity={1}
            onPress={() => setSelectedCandle(null)}
          >
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
              <G>
                {chartCandles.map((candle, i) => {
                  const x = i * candleWidth + candleWidth * 0.15;
                  const volHeight = scaleVolume(candle.volume);
                  const volY = CHART_HEIGHT - volHeight - 5;

                  return (
                    <Rect
                      key={`vol-${i}`}
                      x={x}
                      y={volY}
                      width={candleWidth * 0.7}
                      height={volHeight}
                      fill={candle.positive ? '#00D68F40' : '#8F92A140'}
                      rx={1}
                    />
                  );
                })}
              </G>

              <G>
                {chartCandles.map((candle, i) => {
                  const x = i * candleWidth + candleWidth / 2;
                  const isSelected = selectedCandle?.index === i;
                  const candleColor = isSelected ? '#FFB800' : (candle.positive ? '#00D68F' : '#FF4757');

                  const wickTop = scaleY(candle.high);
                  const wickBottom = scaleY(candle.low);
                  const bodyTop = scaleY(Math.max(candle.open, candle.close));
                  const bodyBottom = scaleY(Math.min(candle.open, candle.close));
                  const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
                  const bodyWidth = candleWidth * 0.6;

                  return (
                    <G key={`candle-${i}`} onPress={() => handleCandlePress(candle, i)}>
                      {/* Invisible touch area for better touch detection */}
                      <Rect
                        x={x - candleWidth / 2}
                        y={0}
                        width={candleWidth}
                        height={CHART_HEIGHT - volumeHeight}
                        fill="transparent"
                        onPress={() => handleCandlePress(candle, i)}
                      />
                      <Line
                        x1={x}
                        y1={wickTop}
                        x2={x}
                        y2={wickBottom}
                        stroke={candleColor}
                        strokeWidth={isSelected ? 2 : 1}
                      />
                      <Rect
                        x={x - bodyWidth / 2}
                        y={bodyTop}
                        width={bodyWidth}
                        height={bodyHeight}
                        fill={candleColor}
                        stroke={isSelected ? '#FFB800' : 'transparent'}
                        strokeWidth={isSelected ? 1 : 0}
                      />
                      {/* Selection indicator line */}
                      {isSelected && (
                        <Line
                          x1={x}
                          y1={0}
                          x2={x}
                          y2={CHART_HEIGHT - volumeHeight}
                          stroke="#FFB80050"
                          strokeWidth={1}
                          strokeDasharray="3,3"
                        />
                      )}
                    </G>
                  );
                })}
              </G>
            </Svg>

            <View style={styles.xAxisLabels}>
              {chartCandles.filter((_, i) => i % Math.ceil(chartCandles.length / 5) === 0).map((candle, i) => (
                <Text key={i} style={styles.xAxisLabel}>
                  {formatTimeLabel(candle.time)}
                </Text>
              ))}
            </View>
          </TouchableOpacity>

          <View style={styles.yAxisLabels}>
            {yLabels.map((label, i) => (
              <Text key={i} style={styles.yAxisLabel}>
                {formatPrice(label)}
              </Text>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshIcon}
          onPress={() => {
            setLoading(true);
            fetchInstrumentData().then(() => setLoading(false));
          }}
        >
          <Ionicons name="refresh-outline" size={20} color="#8F92A1" />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00D68F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1419" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.symbolContainer}>
          <Text style={styles.segmentHeadingText}>{selectedCategory} - </Text>
          <Text style={styles.symbolText}>{symbol}</Text>
          <Ionicons name="flash" size={16} color="#FFB800" style={styles.flashIcon} />
        </View>
        <TouchableOpacity onPress={() => setSearchModalVisible(true)}>
          <Ionicons name="search" size={24} color="#FFFFFF" />
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

      <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.priceChangeContainer}>
          <Text style={[styles.priceChange, { color: priceChange >= 0 ? '#00D68F' : '#FF4757' }]}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </Text>
        </View>

        {renderCandlestickChart()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeframeScrollView}
          contentContainerStyle={styles.timeframeContainer}
        >
          {timeframes.map((tf, index) => (
            <TouchableOpacity
              key={`${tf}-${index}`}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && index === timeframes.indexOf(selectedTimeframe) && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text style={[
                styles.timeframeText,
                selectedTimeframe === tf && index === timeframes.indexOf(selectedTimeframe) && styles.timeframeTextActive,
              ]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.sellButton]}
            onPress={() => {
              setOrderType('SELL');
              setQuantity('0.49');
              setOrderModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>{t.sell || 'Sell'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyButton]}
            onPress={() => {
              setOrderType('BUY');
              setQuantity('0.49');
              setOrderModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>{t.buy || 'Buy'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Positions' && styles.tabActive]}
            onPress={() => setActiveTab('Positions')}
          >
            <Text style={[styles.tabText, activeTab === 'Positions' && styles.tabTextActive]}>
              Positions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Order books' && styles.tabActive]}
            onPress={() => setActiveTab('Order books')}
          >
            <Text style={[styles.tabText, activeTab === 'Order books' && styles.tabTextActive]}>
              Order books
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Market watch' && styles.tabActive]}
            onPress={() => setActiveTab('Market watch')}
          >
            <Text style={[styles.tabText, activeTab === 'Market watch' && styles.tabTextActive]}>
              Market watch
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'Order books' && (
          <View style={styles.orderBookContainer}>
            <View style={styles.orderBookHeader}>
              <Text style={styles.orderBookHeaderText}>Bid</Text>
              <Text style={styles.orderBookHeaderText}>Ask</Text>
            </View>

            <ScrollView style={styles.orderBookTable} showsVerticalScrollIndicator={false}>
              {orderBook.map((order, index) => (
                <View key={index} style={styles.orderBookRow}>
                  <View style={styles.orderBookBidSide}>
                    <Text style={styles.orderBookPrice}>{formatPrice(parseFloat(order.bid))}</Text>
                    <View style={styles.bidBarContainer}>
                      <View style={[styles.bidBar, { width: `${60 + Math.random() * 40}%` }]} />
                      <Text style={styles.orderBookAmountBid}>{order.bidAmount}</Text>
                    </View>
                  </View>

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
            {/* Balance/Equity/Free Margin Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Balance</Text>
                <Text style={styles.statValue}>${formatPrice(displayBalance)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Equity</Text>
                <Text style={styles.statValue}>${formatPrice(displayEquity)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Free Margin</Text>
                <Text style={styles.statValue}>${formatPrice(displayFreeMargin)}</Text>
              </View>
            </View>

            {/* Position Filter Tabs */}
            <View style={styles.positionFilterRow}>
              <View style={styles.positionFilters}>
                {['Open', 'Pending', 'Closed'].map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[styles.positionFilterBtn, positionFilter === filter && styles.positionFilterBtnActive]}
                    onPress={() => setPositionFilter(filter)}
                  >
                    <Text style={[styles.positionFilterText, positionFilter === filter && styles.positionFilterTextActive]}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.totalPnlText}>
                ${(() => {
                  if (positionFilter === 'Open') {
                    return Array.isArray(positions) ? positions.reduce((sum, p) => sum + (p.unrealizedPnl || 0), 0).toFixed(2) : '0.00';
                  } else if (positionFilter === 'Pending') {
                    const pendingOrders = Array.isArray(orders) ? orders.filter(o => o.status === 'PENDING' || o.status === 'OPEN' || o.status === 'PARTIALLY_FILLED') : [];
                    return pendingOrders.reduce((sum, o) => sum + ((o.quantity || 0) * (o.price || 0)), 0).toFixed(2);
                  } else {
                    const closedOrders = Array.isArray(orders) ? orders.filter(o => o.status === 'FILLED' || o.status === 'CANCELLED' || o.status === 'REJECTED') : [];
                    const allClosed = [...(Array.isArray(closedPositions) ? closedPositions : []), ...closedOrders];
                    return allClosed.reduce((sum, p) => sum + (p.realizedPnl || p.pnl || 0), 0).toFixed(2);
                  }
                })()}
              </Text>
            </View>

            {/* Positions List - Open */}
            <ScrollView style={styles.positionsList} showsVerticalScrollIndicator={false}>
              {positionFilter === 'Open' && (
                <>
                  {!Array.isArray(positions) || positions.length === 0 ? (
                    <View style={styles.emptyPositionsContainer}>
                      <Ionicons name="layers-outline" size={48} color="#8F92A1" />
                      <Text style={styles.emptyPositionsText}>No open positions</Text>
                    </View>
                  ) : (
                    positions.map((position) => {
                      const pnl = position.unrealizedPnl ||
                        (position.side === 'BUY'
                          ? (currentPrice - (position.avgPrice || position.entryPrice)) * position.quantity
                          : ((position.avgPrice || position.entryPrice) - currentPrice) * position.quantity);
                      const isProfit = pnl >= 0;

                      return (
                        <View key={position.id} style={styles.positionItem}>
                          <View style={styles.positionItemLeft}>
                            <View style={styles.positionIconCircle}>
                              <Ionicons
                                name={position.side === 'BUY' ? 'trending-up' : 'trending-down'}
                                size={16}
                                color={position.side === 'BUY' ? '#00D68F' : '#FF4757'}
                              />
                            </View>
                            <View>
                              <Text style={styles.positionItemSymbol}>{position.instrument?.symbol || position.symbol || 'Unknown'}</Text>
                              <Text style={styles.positionItemDetails}>
                                {position.side} {position.quantity} at {formatPrice(position.avgPrice || position.entryPrice)}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.positionItemPnl, !isProfit && styles.lossText]}>
                            ${formatPrice(Math.abs(pnl))}
                          </Text>
                        </View>
                      );
                    })
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
                        <View style={styles.emptyPositionsContainer}>
                          <Ionicons name="time-outline" size={48} color="#8F92A1" />
                          <Text style={styles.emptyPositionsText}>No pending orders</Text>
                        </View>
                      );
                    }
                    return pendingOrders.map((order) => (
                      <View key={order.id} style={styles.positionItem}>
                        <View style={styles.positionItemLeft}>
                          <View style={styles.positionIconCircle}>
                            <Ionicons name="time" size={16} color="#FFB800" />
                          </View>
                          <View>
                            <Text style={styles.positionItemSymbol}>{order.instrument?.symbol || order.symbol || 'Unknown'}</Text>
                            <Text style={styles.positionItemDetails}>
                              {order.side} {order.quantity} at {formatPrice(order.price)}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.orderStatusRight}>
                          <Text style={styles.orderStatusText}>{order.status}</Text>
                          <Text style={styles.orderDateText}>{new Date(order.createdAt).toLocaleDateString()}</Text>
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
                    const closedOrders = orders.filter(o => o.status === 'FILLED' || o.status === 'CANCELLED' || o.status === 'REJECTED');
                    const allClosed = [...closedPositions, ...closedOrders];

                    if (allClosed.length === 0) {
                      return (
                        <View style={styles.emptyPositionsContainer}>
                          <Ionicons name="checkmark-circle-outline" size={48} color="#8F92A1" />
                          <Text style={styles.emptyPositionsText}>No closed positions</Text>
                        </View>
                      );
                    }
                    return allClosed.map((item, index) => {
                      const pnl = item.realizedPnl || item.pnl || 0;
                      const isProfit = pnl >= 0;

                      return (
                        <View key={item.id || `closed-${index}`} style={styles.positionItem}>
                          <View style={styles.positionItemLeft}>
                            <View style={styles.positionIconCircle}>
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color={isProfit ? '#00D68F' : '#FF4757'}
                              />
                            </View>
                            <View>
                              <Text style={styles.positionItemSymbol}>{item.instrument?.symbol || item.symbol || 'Unknown'}</Text>
                              <Text style={styles.positionItemDetails}>
                                {item.side} {item.quantity} at {formatPrice(item.avgPrice || item.price)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.orderStatusRight}>
                            <Text style={[styles.positionItemPnl, !isProfit && styles.lossText]}>
                              ${formatPrice(Math.abs(pnl))}
                            </Text>
                            <Text style={styles.orderDateText}>{item.status || 'CLOSED'}</Text>
                          </View>
                        </View>
                      );
                    });
                  })()}
                </>
              )}
            </ScrollView>
          </View>
        )}

        {/* Market Watch Tab */}
        {activeTab === 'Market watch' && (
          <View style={styles.marketWatchContainer}>
            <ScrollView style={styles.marketWatchList} showsVerticalScrollIndicator={false}>
              {marketWatchData.map((item, index) => {
                const price = item.currentPrice?.ltp || item.ltp || 0;
                const change = item.currentPrice?.changePercent || item.changePercent || 0;
                const isPositive = change >= 0;

                return (
                  <TouchableOpacity
                    key={item.instrumentId || index}
                    style={styles.marketWatchItem}
                    onPress={() => {
                      navigation.replace('CoinChart', {
                        symbol: item.symbol,
                        instrumentId: item.instrumentId || item.id,
                        isLoggedIn: isLoggedIn,
                      });
                    }}
                  >
                    <View style={styles.marketWatchLeft}>
                      <Text style={styles.marketWatchSymbol}>{item.symbol}</Text>
                      <Text style={styles.marketWatchSubtext}>
                        {selectedCategory} . {formatPrice(price)}
                      </Text>
                    </View>

                    {/* Sparkline "Market Candle" workaround */}
                    <View style={styles.sparklineContainer}>
                      <Svg width={60} height={30}>
                        <Line
                          x1="0" y1={15 + (Math.random() - 0.5) * 20}
                          x2="15" y2={15 + (Math.random() - 0.5) * 20}
                          stroke={isPositive ? '#00D68F' : '#FF4757'}
                          strokeWidth="2"
                        />
                        <Line
                          x1="15" y1={15 + (Math.random() - 0.5) * 20}
                          x2="30" y2={15 + (Math.random() - 0.5) * 20}
                          stroke={isPositive ? '#00D68F' : '#FF4757'}
                          strokeWidth="2"
                        />
                        <Line
                          x1="30" y1={15 + (Math.random() - 0.5) * 20}
                          x2="45" y2={15 + (Math.random() - 0.5) * 20}
                          stroke={isPositive ? '#00D68F' : '#FF4757'}
                          strokeWidth="2"
                        />
                        <Line
                          x1="45" y1={15 + (Math.random() - 0.5) * 20}
                          x2="60" y2={15 + (Math.random() - 0.5) * 20}
                          stroke={isPositive ? '#00D68F' : '#FF4757'}
                          strokeWidth="2"
                        />
                      </Svg>
                    </View>

                    <View style={styles.marketWatchRight}>
                      <Text style={styles.marketWatchPrice}>{formatPrice(price)}</Text>
                      <Text style={styles.marketWatchSubPrice}>${formatPrice(price * 0.005)}</Text>
                    </View>
                    <View style={[styles.marketWatchChange, isPositive ? styles.positiveChange : styles.negativeChange]}>
                      <Text style={[styles.marketWatchChangeText, isPositive ? styles.positiveText : styles.negativeText]}>
                        {isPositive ? '+' : ''}{change.toFixed(2)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Create Order Modal - New Design */}
      <Modal
        visible={orderModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOrderModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Title and Balance */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create order</Text>
              <View style={styles.modalBalanceContainer}>
                <Text style={styles.modalBalanceLabel}>Available:</Text>
                <Text style={styles.modalBalanceValue}>${formatPrice(displayAvailableMargin)}</Text>
              </View>
            </View>

            {/* Dropdowns Row */}
            <View style={styles.dropdownRow}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setOrderTypeDropdownVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {ORDER_TYPES.find(t => t.value === selectedOrderType)?.label || 'Market order'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8F92A1" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setInstrumentDropdownVisible(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedInstrument?.symbol?.split('/')[0] || symbol.split('/')[0] || 'Select'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#8F92A1" />
              </TouchableOpacity>
            </View>

            {/* Bid/Ask Prices */}
            <View style={styles.pricesRow}>
              <Text style={styles.bidPriceText}>{bidPrice}°</Text>
              <Text style={styles.askPriceText}>{askPrice}°</Text>
            </View>

            {/* Lot Size Adjusters */}
            <View style={styles.lotSizeRow}>
              <TouchableOpacity style={styles.lotButton} onPress={() => adjustQuantity(-0.5)}>
                <Text style={styles.lotButtonText}>-0.5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lotButton} onPress={() => adjustQuantity(-0.1)}>
                <Text style={styles.lotButtonText}>-0.1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lotButton} onPress={() => adjustQuantity(-0.01)}>
                <Text style={styles.lotButtonText}>-0.01</Text>
              </TouchableOpacity>
              <View style={styles.lotValueContainer}>
                <Text style={styles.lotValueText}>{quantity}</Text>
              </View>
              <TouchableOpacity style={styles.lotButton} onPress={() => adjustQuantity(0.01)}>
                <Text style={styles.lotButtonTextGreen}>+0.01</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lotButton} onPress={() => adjustQuantity(0.1)}>
                <Text style={styles.lotButtonTextGreen}>+0.1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.lotButton} onPress={() => adjustQuantity(0.5)}>
                <Text style={styles.lotButtonTextGreen}>+0.5</Text>
              </TouchableOpacity>
            </View>

            {/* SL and TP Controls */}
            <View style={styles.slTpRow}>
              <View style={styles.slTpContainer}>
                <TouchableOpacity style={styles.slTpButton} onPress={() => setStopLoss(Math.max(0, stopLoss - 1))}>
                  <Ionicons name="remove" size={20} color="#8F92A1" />
                </TouchableOpacity>
                <View style={styles.slTpLabelContainer}>
                  <Text style={styles.slTpLabel}>SL</Text>
                  <Text style={styles.slTpValue}>{stopLoss}</Text>
                </View>
                <TouchableOpacity style={styles.slTpButton} onPress={() => setStopLoss(stopLoss + 1)}>
                  <Ionicons name="add" size={20} color="#8F92A1" />
                </TouchableOpacity>
              </View>

              <View style={styles.slTpContainer}>
                <TouchableOpacity style={styles.slTpButton} onPress={() => setTakeProfit(Math.max(0, takeProfit - 1))}>
                  <Ionicons name="remove" size={20} color="#8F92A1" />
                </TouchableOpacity>
                <View style={styles.slTpLabelContainer}>
                  <Text style={styles.slTpLabel}>TP</Text>
                  <Text style={styles.slTpValue}>{takeProfit}</Text>
                </View>
                <TouchableOpacity style={styles.slTpButton} onPress={() => setTakeProfit(takeProfit + 1)}>
                  <Ionicons name="add" size={20} color="#8F92A1" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons - Both Buy and Sell */}
            {isLoggedIn ? (
              <View style={styles.orderActionButtonsRow}>
                <TouchableOpacity
                  style={[styles.orderActionButtonHalf, styles.sellActionButton, orderLoading && styles.disabledButton]}
                  onPress={() => executeTrade('SELL')}
                  disabled={orderLoading}
                  activeOpacity={0.7}
                >
                  {orderLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.orderActionButtonText}>Sell</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.orderActionButtonHalf, styles.buyActionButton, orderLoading && styles.disabledButton]}
                  onPress={() => executeTrade('BUY')}
                  disabled={orderLoading}
                  activeOpacity={0.7}
                >
                  {orderLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.orderActionButtonText}>Buy</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => {
                  setOrderModalVisible(false);
                  navigation.navigate('Login');
                }}
              >
                <Text style={styles.signInButtonText}>Sign in/ Sign up</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
                color={orderResult?.type === 'BUY' ? '#00D68F' : '#FF4757'}
              />
            </View>
            <Text style={styles.successTitle}>{t.success || 'Order Executed!'}</Text>
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

      {/* Order Type Dropdown Modal */}
      <Modal
        visible={orderTypeDropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOrderTypeDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setOrderTypeDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Select Order Type</Text>
              <TouchableOpacity onPress={() => setOrderTypeDropdownVisible(false)}>
                <Ionicons name="close" size={24} color="#8F92A1" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.dropdownList}>
              {ORDER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.dropdownItem,
                    selectedOrderType === type.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    setSelectedOrderType(type.value);
                    setOrderTypeDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    selectedOrderType === type.value && styles.dropdownItemTextSelected
                  ]}>
                    {type.label}
                  </Text>
                  {selectedOrderType === type.value && (
                    <Ionicons name="checkmark" size={20} color="#00C853" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Instrument Selection Dropdown Modal */}
      <Modal
        visible={instrumentDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInstrumentDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setInstrumentDropdownVisible(false)}
        >
          <View style={styles.instrumentDropdownModal}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>Select Instrument</Text>
              <TouchableOpacity onPress={() => setInstrumentDropdownVisible(false)}>
                <Ionicons name="close" size={24} color="#8F92A1" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.instrumentDropdownList}>
              {marketWatchData.map((instrument, index) => {
                const price = instrument.price || instrument.lastPrice || 0;
                const change = instrument.change || instrument.changePercent || 0;
                const isPositive = change >= 0;

                return (
                  <TouchableOpacity
                    key={instrument.id || index}
                    style={[
                      styles.instrumentDropdownItem,
                      (selectedInstrument?.symbol === instrument.symbol ||
                        (!selectedInstrument && symbol === instrument.symbol)) &&
                      styles.instrumentDropdownItemSelected
                    ]}
                    onPress={() => {
                      setSelectedInstrument(instrument);
                      setInstrumentDropdownVisible(false);
                    }}
                  >
                    <View style={styles.instrumentDropdownLeft}>
                      <Text style={styles.instrumentDropdownSymbol}>
                        {instrument.symbol?.split('/')[0] || instrument.name}
                      </Text>
                      <Text style={styles.instrumentDropdownPair}>
                        {instrument.symbol || `${instrument.name}/USD`}
                      </Text>
                    </View>
                    <View style={styles.instrumentDropdownRight}>
                      <Text style={styles.instrumentDropdownPrice}>
                        ${formatPrice(price)}
                      </Text>
                      <Text style={[
                        styles.instrumentDropdownChange,
                        isPositive ? styles.positiveText : styles.negativeText
                      ]}>
                        {isPositive ? '+' : ''}{typeof change === 'number' ? change.toFixed(2) : change}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Search Coin Modal */}
      <SearchCoinModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSelect={(item) => {
          navigation.replace('CoinChart', {
            symbol: item.symbol,
            instrumentId: item.instrumentId || item.id,
            isLoggedIn: isLoggedIn,
          });
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1419',
  },
  mainScrollView: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 4,
  },
  backButton: {
    padding: 4,
  },
  symbolContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  symbolText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  segmentHeadingText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  flashIcon: {
    marginLeft: 6,
  },
  segmentTabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0f1419',
  },
  segmentTabsContent: {
    paddingRight: 16,
    gap: 8,
  },
  segmentTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: 'transparent',
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentTabText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  priceChangeContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    marginHorizontal: 8,
    marginBottom: 8,
    position: 'relative',
  },
  chartLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 20, 25, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    borderRadius: 8,
  },
  candleInfoOverlay: {
    position: 'absolute',
    top: 0,
    left: 8,
    right: 80,
    backgroundColor: 'rgba(26, 29, 46, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#3A3D4E',
  },
  candleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  candleInfoLabel: {
    color: '#8F92A1',
    fontSize: 11,
    fontWeight: '500',
  },
  candleInfoValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  chartRow: {
    flexDirection: 'row',
  },
  chartSvgContainer: {
    flex: 1,
  },
  yAxisLabels: {
    width: 70,
    height: CHART_HEIGHT - 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
    paddingTop: 5,
  },
  yAxisLabel: {
    color: '#8F92A1',
    fontSize: 11,
    fontWeight: '400',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    color: '#8F92A1',
    fontSize: 11,
    fontWeight: '400',
  },
  emptyChartText: {
    color: '#8F92A1',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 40,
  },
  refreshIcon: {
    position: 'absolute',
    right: 80,
    bottom: 10,
    padding: 8,
  },
  timeframeScrollView: {
    flexGrow: 0,
  },
  timeframeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A3040',
  },
  timeframeButtonActive: {
    backgroundColor: '#2A3040',
    borderColor: '#3A4050',
  },
  timeframeText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sellButton: {
    backgroundColor: '#FF4757',
  },
  buyButton: {
    backgroundColor: '#00D68F',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#3A3D4E',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  orderBookContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  orderBookHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3D4E',
  },
  orderBookHeaderText: {
    flex: 1,
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  orderBookTable: {
    flex: 1,
  },
  orderBookRow: {
    flexDirection: 'row',
    paddingVertical: 6,
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
    color: '#FFFFFF',
    fontSize: 13,
    width: 80,
  },
  bidBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  askBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  bidBar: {
    height: 24,
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(0, 214, 143, 0.2)',
  },
  askBar: {
    height: 24,
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  orderBookAmountBid: {
    color: '#00D68F',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  orderBookAmountAsk: {
    color: '#FF4757',
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 8,
    zIndex: 1,
  },
  positionsContainer: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#252838',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#8F92A1',
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    color: '#00D68F',
    fontSize: 28,
    fontWeight: '700',
  },
  emptyPositions: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#8F92A1',
    fontSize: 14,
    marginTop: 12,
  },
  positionsList: {
    flex: 1,
  },
  positionCard: {
    backgroundColor: '#252838',
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
    backgroundColor: 'rgba(0, 214, 143, 0.2)',
  },
  sellBadge: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  positionTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  positionSymbolText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closePositionBtn: {
    backgroundColor: '#FF4757',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closePositionText: {
    color: '#FFFFFF',
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
    color: '#8F92A1',
    fontSize: 13,
  },
  positionDetailValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  profitText: {
    color: '#00D68F',
  },
  lossText: {
    color: '#FF4757',
  },

  // Create Order Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E2235',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#8F92A1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalBalanceLabel: {
    color: '#8F92A1',
    fontSize: 12,
    marginRight: 4,
  },
  modalBalanceValue: {
    color: '#00D68F',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2F45',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  pricesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginBottom: 24,
  },
  bidPriceText: {
    color: '#4A90D9',
    fontSize: 24,
    fontWeight: '600',
  },
  askPriceText: {
    color: '#FF4757',
    fontSize: 24,
    fontWeight: '600',
  },
  lotSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  lotButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lotButtonText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  lotButtonTextGreen: {
    color: '#00D68F',
    fontSize: 14,
    fontWeight: '500',
  },
  lotValueContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  lotValueText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  slTpRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  slTpContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2F45',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3D4E',
  },
  slTpButton: {
    padding: 14,
    backgroundColor: '#252838',
    borderRadius: 6,
  },
  slTpLabelContainer: {
    flex: 1,
    alignItems: 'center',
  },
  slTpLabel: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  slTpValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  signInButton: {
    backgroundColor: '#00D68F',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  orderActionButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  orderActionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  orderActionButtonHalf: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buyActionButton: {
    backgroundColor: '#00D68F',
  },
  sellActionButton: {
    backgroundColor: '#FF4757',
  },
  orderActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Success Modal Styles
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContent: {
    backgroundColor: '#252838',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: width - 48,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    color: '#FFFFFF',
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
    color: '#8F92A1',
    fontSize: 16,
  },
  successTotal: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  successPnL: {
    fontSize: 18,
    fontWeight: '600',
  },
  successBalance: {
    color: '#00D68F',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  successDismiss: {
    backgroundColor: '#5B8DEE',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  successDismissText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // New Positions Tab Styles
  statsContainer: {
    backgroundColor: '#252838',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    color: '#8F92A1',
    fontSize: 14,
  },
  statValue: {
    color: '#00D68F',
    fontSize: 14,
    fontWeight: '600',
  },
  positionFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  positionFilters: {
    flexDirection: 'row',
    gap: 12,
  },
  positionFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  positionFilterBtnActive: {
    backgroundColor: '#3A3D4E',
  },
  positionFilterText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  positionFilterTextActive: {
    color: '#FFFFFF',
  },
  totalPnlText: {
    color: '#00D68F',
    fontSize: 14,
    fontWeight: '600',
  },
  positionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252838',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  positionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  positionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3A3D4E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionItemSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  positionItemDetails: {
    color: '#8F92A1',
    fontSize: 12,
    marginTop: 2,
  },
  positionItemPnl: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D68F',
  },
  lossText: {
    color: '#FF4757',
  },
  emptyPositionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyPositionsText: {
    color: '#8F92A1',
    fontSize: 16,
    marginTop: 16,
  },
  orderStatusRight: {
    alignItems: 'flex-end',
  },
  orderStatusText: {
    color: '#8F92A1',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  orderDateText: {
    color: '#8F92A1',
    fontSize: 11,
  },

  // Market Watch Styles
  marketWatchContainer: {
    flex: 1,
    padding: 16,
  },
  marketWatchSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252838',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  marketWatchSearchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  marketWatchList: {
    flex: 1,
  },
  marketWatchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#252838',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  marketWatchLeft: {
    flex: 1,
  },
  marketWatchSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  marketWatchSubtext: {
    color: '#8F92A1',
    fontSize: 12,
    marginTop: 2,
  },
  marketWatchRight: {
    alignItems: 'flex-end',
  },
  marketWatchPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  marketWatchSubPrice: {
    color: '#8F92A1',
    fontSize: 12,
    marginTop: 2,
  },
  marketWatchChange: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  positiveChange: {
    backgroundColor: 'rgba(0, 214, 143, 0.2)',
  },
  negativeChange: {
    backgroundColor: 'rgba(255, 71, 87, 0.2)',
  },
  sparklineContainer: {
    width: 60,
    height: 30,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketWatchChangeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positiveText: {
    color: '#00D68F',
  },
  negativeText: {
    color: '#FF4757',
  },

  // Search Modal Styles
  searchModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  searchModalContent: {
    backgroundColor: '#1E2235',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '80%',
  },
  searchDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#8F92A1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  searchModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  segmentTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    maxHeight: 40,
  },
  segmentTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#252838',
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentTabText: {
    color: '#8F92A1',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTabTextActive: {
    color: '#000000',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252838',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3D4E',
  },
  searchResultLeft: {
    flex: 1,
  },
  searchResultSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultVolume: {
    color: '#8F92A1',
    fontSize: 12,
    marginTop: 2,
  },
  searchResultRight: {
    alignItems: 'flex-end',
  },
  searchResultPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResultSubPrice: {
    color: '#8F92A1',
    fontSize: 12,
    marginTop: 2,
  },
  // Dropdown Modal Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#1E2130',
    borderRadius: 16,
    width: '85%',
    maxHeight: '50%',
    overflow: 'hidden',
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3D4E',
  },
  dropdownModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownList: {
    maxHeight: 250,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3D4E',
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdownItemTextSelected: {
    color: '#00C853',
    fontWeight: '600',
  },
  // Instrument Dropdown Styles
  instrumentDropdownModal: {
    backgroundColor: '#1E2130',
    borderRadius: 16,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  instrumentDropdownList: {
    maxHeight: 450,
  },
  instrumentDropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3D4E',
  },
  instrumentDropdownItemSelected: {
    backgroundColor: 'rgba(91, 141, 238, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#5B8DEE',
  },
  instrumentDropdownLeft: {
    flex: 1,
  },
  instrumentDropdownSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instrumentDropdownPair: {
    color: '#8F92A1',
    fontSize: 12,
    marginTop: 2,
  },
  instrumentDropdownRight: {
    alignItems: 'flex-end',
  },
  instrumentDropdownPrice: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  instrumentDropdownChange: {
    fontSize: 12,
    marginTop: 2,
  },
});
