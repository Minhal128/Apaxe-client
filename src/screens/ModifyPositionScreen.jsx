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

const priceAdjustments = [-0.5, -0.1, -0.01, 0.49, +0.01, +0.1, +0.5];

export default function ModifyPositionScreen({ visible, onClose }) {
  const [sl, setSl] = useState(0);
  const [tp, setTp] = useState(0);

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

          {/* Order ID */}
          <Text style={styles.orderId}>#12037465935</Text>

          {/* Position Info */}
          <View style={styles.positionInfo}>
            <View style={styles.positionLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="swap-horizontal" size={20} color={colors.textPrimary} />
              </View>
              <View>
                <Text style={styles.symbolText}>SBIN</Text>
                <Text style={styles.orderType}>Buy 0.01 at 4325.90</Text>
              </View>
            </View>
            <Text style={styles.priceValue}>$1,200</Text>
          </View>

          {/* Price Adjustments */}
          <View style={styles.priceAdjustments}>
            {priceAdjustments.map((price, index) => (
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
                onPress={() => setSl(Math.max(0, sl - 1))}
              >
                <Ionicons name="remove" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.controlCenter}>
                <Text style={styles.controlLabel}>SL</Text>
                <Text style={styles.controlValue}>{sl}</Text>
              </View>
              <TouchableOpacity 
                style={styles.controlButton}
                onPress={() => setSl(sl + 1)}
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
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
              <Ionicons name="checkmark" size={20} color={colors.textPrimary} style={{ marginRight: 4 }} />
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
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
    minHeight: '60%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  positionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderType: {
    fontSize: 13,
    color: '#1E88E5',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  priceAdjustments: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    fontWeight: '500',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: colors.green,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
