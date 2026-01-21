import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { orderService, userService } from '../services';
import SearchCoinModal from './SearchCoinModal';

const { width } = Dimensions.get('window');

// Order type options
const ORDER_TYPES = [
  { value: 'MARKET', label: 'Market order' },
  { value: 'LIMIT', label: 'Limit order' },
  { value: 'STOP', label: 'Stop order' },
  { value: 'STOP_LIMIT', label: 'Stop-Limit order' },
];

export default function CreateOrderModal({ 
  visible, 
  onClose, 
  navigation, 
  isLoggedIn = false,
  instrument = null,
  currentPrice = 0,
  onOrderSuccess = null,
}) {
  const { colors } = useTheme();
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(1); // Default to minimum quantity
  const [sl, setSl] = useState(0);
  const [tp, setTp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(instrument);
  const [searchVisible, setSearchVisible] = useState(false);
  const [orderTypeDropdownVisible, setOrderTypeDropdownVisible] = useState(false);
  const [balance, setBalance] = useState(0);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const successAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelectedInstrument(instrument);
  }, [instrument]);

  // Fetch balance from API when modal opens
  useEffect(() => {
    const fetchBalance = async () => {
      if (visible && isLoggedIn) {
        try {
          const result = await userService.getBalance();
          if (result.success) {
            setBalance(result.balance);
          }
        } catch (e) {
          console.log('Error fetching balance:', e);
        }
      }
    };
    fetchBalance();
  }, [visible, isLoggedIn]);

  const activeInstrument = selectedInstrument || instrument;
  
  // Get bid/ask prices from instrument or use currentPrice
  // If we selected a new instrument from search, it might only have lastPrice
  const basePrice = activeInstrument?.lastPrice || activeInstrument?.currentPrice || currentPrice || 0;
  const bidPrice = activeInstrument?.bidPrice || basePrice || 0;
  const askPrice = activeInstrument?.askPrice || basePrice || 0;
  
  const symbolName = activeInstrument?.symbol || activeInstrument?.name || 'Select Instrument';
  const instrumentId = activeInstrument?.id;

  const prices = [-0.5, -0.1, -0.01, 0.49, +0.01, +0.1, +0.5];

  // Format price for display
  const formatPrice = (price) => {
    if (!price || price === 0) return '0.00';
    if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toFixed(5);
  };

  const handleInstrumentSelect = (item) => {
    setSelectedInstrument(item);
    setSearchVisible(false);
  };

  const placeOrder = async (side) => {
    if (!isLoggedIn) {
      onClose();
      navigation.navigate('Login');
      return;
    }

    if (!instrumentId) {
      Alert.alert('Error', 'Please select an instrument to trade');
      return;
    }

    if (quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    try {
      setLoading(true);
      
      // Build order data based on order type
      const orderData = {
        instrumentId,
        side, // 'BUY' or 'SELL'
        orderType: orderType, // 'MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'
        quantity: parseFloat(quantity),
        isIntraday: true,
      };

      // Add price for LIMIT orders
      if (orderType === 'LIMIT' || orderType === 'STOP_LIMIT') {
        orderData.price = parseFloat(side === 'BUY' ? askPrice : bidPrice);
      }

      // Add stop loss and take profit if set
      if (sl > 0) {
        orderData.stopLoss = sl;
      }
      if (tp > 0) {
        orderData.takeProfit = tp;
      }

      console.log('Placing order with data:', JSON.stringify(orderData));
      
      const response = await orderService.placeOrder(orderData);
      console.log('Order response:', JSON.stringify(response));
      
      if (response.success) {
        // Calculate trade values
        const tradePrice = side === 'BUY' ? askPrice : bidPrice;
        const totalValue = quantity * tradePrice;
        
        // Update balance in backend
        const balanceResult = await userService.updateBalanceAfterTrade(totalValue, side, symbolName);
        
        // Fetch updated balance from API
        let newBalance = balance;
        if (balanceResult.success) {
          const newBalanceResult = await userService.getBalance();
          if (newBalanceResult.success) {
            newBalance = newBalanceResult.balance;
          }
        }
        
        // Update local state
        setBalance(newBalance);
        
        // Set order result for success popup
        setOrderResult({
          type: side,
          symbol: symbolName,
          quantity,
          price: tradePrice,
          total: totalValue,
          newBalance: newBalance,
        });
        
        // Show success modal
        setSuccessModalVisible(true);
        Animated.sequence([
          Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setSuccessModalVisible(false);
          onClose();
        });
        
        // Call callback if provided
        if (onOrderSuccess) {
          onOrderSuccess({
            side,
            symbol: symbolName,
            quantity,
            price: tradePrice,
            instrumentId,
            newBalance,
          });
        }
      } else {
        // Show detailed error message
        const errorMessage = response.message || 'Order failed. Please check your connection and try again.';
        console.log('Order failed:', errorMessage);
        Alert.alert(
          'Order Failed', 
          errorMessage,
          [{ text: 'OK', onPress: () => console.log('Order error acknowledged') }]
        );
      }
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert(
        'Order Error', 
        error.message || 'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
          
          {/* Handle Bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.textSecondary }]} />

          {/* Title and Balance */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Create order</Text>
            {isLoggedIn && balance > 0 && (
              <View style={styles.balanceContainer}>
                <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance:</Text>
                <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>${balance.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {/* Order Type and Instrument Selection */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: colors.inputBackground }]}
              onPress={() => setOrderTypeDropdownVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                {ORDER_TYPES.find(t => t.value === orderType)?.label || 'Market order'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdown, { backgroundColor: colors.inputBackground }]}
              onPress={() => setSearchVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownText, { color: colors.textPrimary }]} numberOfLines={1}>{symbolName}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Prices - Bid and Ask */}
          <View style={styles.pricesContainer}>
            <Text style={[styles.priceValue, { color: colors.blue }]}>{formatPrice(bidPrice)}</Text>
            <Text style={[styles.priceValue, { color: colors.red }]}>{formatPrice(askPrice)}</Text>
          </View>

          {/* Price Adjustments */}
          <View style={styles.priceAdjustments}>
            {prices.map((price, index) => (
              <TouchableOpacity
                key={`price-${price}-${index}`}
                style={[styles.priceButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => setQuantity(Math.max(0.01, quantity + price))}
                activeOpacity={0.7}
              >
                <Text style={[styles.priceButtonText, { color: colors.textPrimary }]}>
                  {price > 0 ? `+${price}` : price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SL and TP Controls */}
          <View style={styles.controlsRow}>
            <View style={[styles.control, { backgroundColor: colors.inputBackground }]}>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setSl(Math.max(0, sl - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>SL</Text>
                <Text style={[styles.controlValue, { color: colors.textPrimary }]}>{sl}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setSl(sl + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.control, { backgroundColor: colors.inputBackground }]}>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setTp(Math.max(0, tp - 1))}
                activeOpacity={0.7}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>TP</Text>
                <Text style={[styles.controlValue, { color: colors.textPrimary }]}>{tp}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.controlButton, { backgroundColor: colors.cardBackground }]}
                onPress={() => setTp(tp + 1)}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          {isLoggedIn ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.red }, loading && styles.disabledButton]}
                onPress={() => placeOrder('SELL')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Sell</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.green }, loading && styles.disabledButton]}
                onPress={() => placeOrder('BUY')}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionButtonText}>Buy</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.signInButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                onClose();
                navigation.navigate('Login');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.signInButtonText}>Sign in/ Sign up</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

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
          <View style={[styles.dropdownModal, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.dropdownModalTitle, { color: colors.textPrimary }]}>Select Order Type</Text>
            <ScrollView style={styles.dropdownList}>
              {ORDER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.dropdownOption,
                    orderType === type.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setOrderType(type.value);
                    setOrderTypeDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText, 
                    { color: orderType === type.value ? colors.primary : colors.textPrimary }
                  ]}>
                    {type.label}
                  </Text>
                  {orderType === type.value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <SearchCoinModal 
        visible={searchVisible} 
        onClose={() => setSearchVisible(false)} 
        onSelect={handleInstrumentSelect}
      />

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
          onPress={() => {
            setSuccessModalVisible(false);
            onClose();
          }}
        >
          <Animated.View style={[styles.successContent, { opacity: successAnim }]}>
            <View style={styles.successIcon}>
              <Ionicons 
                name="checkmark-circle" 
                size={64} 
                color={orderResult?.type === 'BUY' ? '#00D68F' : '#FF4757'} 
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
                <Text style={styles.successBalance}>
                  New Balance: ${formatPrice(orderResult.newBalance)}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.successDismiss}
              onPress={() => {
                setSuccessModalVisible(false);
                onClose();
              }}
            >
              <Text style={styles.successDismissText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '70%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceLabel: {
    fontSize: 12,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dropdown: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
  },
  pricesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  priceAdjustments: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  priceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  priceButtonText: {
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  control: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlCenter: {
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  controlValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
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
    marginBottom: 24,
  },
  successText: {
    color: '#8F92A1',
    fontSize: 16,
    marginBottom: 4,
  },
  successTotal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  successBalance: {
    color: '#00D68F',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  successDismiss: {
    backgroundColor: '#3D4356',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
  },
  successDismissText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Dropdown Modal Styles
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    borderRadius: 16,
    padding: 20,
    width: width - 48,
    maxHeight: 300,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  dropdownOptionText: {
    fontSize: 16,
  },
});
