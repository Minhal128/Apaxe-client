import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function CreateOrderModal({ visible, onClose, navigation }) {
  const [orderType, setOrderType] = useState('Market order');
  const [quantity, setQuantity] = useState('NIFTY 500');
  const [sl, setSl] = useState(0);
  const [tp, setTp] = useState(0);

  const prices = [-0.5, -0.1, -0.01, 0.49, +0.01, +0.1, +0.5];

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
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>{orderType}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </View>
            <View style={styles.dropdown}>
              <Text style={styles.dropdownText}>{quantity}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.textPrimary} />
            </View>
          </View>

          {/* Prices */}
          <View style={styles.pricesContainer}>
            <Text style={styles.priceValue}>0.93545°</Text>
            <Text style={styles.priceValue}>0.93545°</Text>
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
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={styles.controlLabel}>SL</Text>
                <Text style={styles.controlValue}>{sl}</Text>
              </View>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.control}>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={styles.controlLabel}>TP</Text>
                <Text style={styles.controlValue}>{tp}</Text>
              </View>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="add" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity 
            style={styles.signInButton}
            onPress={() => {
              onClose();
              navigation.navigate('Login');
            }}
          >
            <Text style={styles.signInButtonText}>Sign in/ Sign up</Text>
          </TouchableOpacity>
        </View>
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
});
