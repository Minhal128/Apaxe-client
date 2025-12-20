import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { orderService } from '../services';
import SearchCoinModal from './SearchCoinModal';

export default function CreateOrderModal({ 
  visible, 
  onClose, 
  navigation, 
  isLoggedIn = false,
  instrument = null,
  currentPrice = 0,
}) {
  const [orderType, setOrderType] = useState('MARKET');
  const [quantity, setQuantity] = useState(1); // Default to minimum quantity
  const [sl, setSl] = useState(0);
  const [tp, setTp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(instrument);
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    setSelectedInstrument(instrument);
  }, [instrument]);

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
      Alert.alert('Error', 'Please select an instrument');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        instrumentId,
        side, // 'BUY' or 'SELL'
        orderType: orderType, // Backend validation expects orderType
        quantity,
        price: orderType === 'LIMIT' ? (side === 'BUY' ? bidPrice : askPrice) : undefined,
        isIntraday: true, // Backend expects isIntraday instead of productType
      };

      console.log('Placing order:', orderData);
      
      const response = await orderService.placeOrder(orderData);
      
      if (response.success) {
        Alert.alert('Success', `${side} order placed successfully!`);
        onClose();
      } else {
        Alert.alert('Error', response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement error:', error);
      Alert.alert('Error', error.message || 'Failed to place order');
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
        <View style={styles.modalContent}>
          <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" />
          
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          <Text style={styles.title}>Create order</Text>

          {/* Order Type and Quantity */}
          <View style={styles.row}>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setOrderType(orderType === 'MARKET' ? 'LIMIT' : 'MARKET')}
            >
              <Text style={styles.dropdownText}>{orderType === 'MARKET' ? 'Market order' : 'Limit order'}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setSearchVisible(true)}
            >
              <Text style={styles.dropdownText}>{symbolName}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Prices - Bid and Ask */}
          <View style={styles.pricesContainer}>
            <Text style={styles.priceValue}>{formatPrice(bidPrice)}</Text>
            <Text style={[styles.priceValue, { color: colors.red }]}>{formatPrice(askPrice)}</Text>
          </View>

          {/* Price Adjustments */}
          <View style={styles.priceAdjustments}>
            {prices.map((price, index) => (
              <TouchableOpacity
                key={`price-${price}-${index}`}
                style={styles.priceButton}
              >
                <Text style={styles.priceButtonText}>
                  {price > 0 ? `+${price}` : price}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SL and TP Controls */}
          <View style={styles.controlsRow}>
            <View style={styles.control}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))} // Decrement by 1
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={styles.controlLabel}>Qty</Text>
                <Text style={styles.controlValue}>{quantity}</Text>
              </View>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setQuantity(quantity + 1)} // Increment by 1
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.control}>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setTp(Math.max(0, tp - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={styles.controlLabel}>TP</Text>
                <Text style={styles.controlValue}>{tp}</Text>
              </View>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setTp(tp + 1)}
              >
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          {isLoggedIn ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.sellButton, loading && styles.disabledButton]}
                onPress={() => placeOrder('SELL')}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Text style={styles.actionButtonText}>Sell</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.buyButton, loading && styles.disabledButton]}
                onPress={() => placeOrder('BUY')}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.textPrimary} />
                ) : (
                  <Text style={styles.actionButtonText}>Buy</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={() => {
                onClose();
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.signInButtonText}>Sign in/ Sign up</Text>
            </TouchableOpacity>
          )}
        </View>

        <SearchCoinModal 
          visible={searchVisible} 
          onClose={() => setSearchVisible(false)} 
          onSelect={handleInstrumentSelect}
        />
      </View>
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '70%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dropdown: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  pricesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceValue: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: '600',
  },
  priceAdjustments: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  priceButton: {
    backgroundColor: colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  priceButtonText: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  control: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlCenter: {
    alignItems: 'center',
  },
  controlLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  controlValue: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  signInButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInButtonText: {
    color: colors.textPrimary,
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
  disabledButton: {
    opacity: 0.6,
  },
});
