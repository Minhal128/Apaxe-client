import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/colors';
import { positionService } from '../services';

export default function TradeOrderModal({ visible, onClose, position, onSuccess }) {
  const [selectedLeverage, setSelectedLeverage] = useState(null);
  const [loading, setLoading] = useState(false);
  const leverageOptions = [-0.5, -0.1, -0.01, 0.49, +0.01, +0.1, +0.5];

  if (!position) return null;

  const handleConfirm = async () => {
    // For now, we assume "Confirm" means Square Off / Close Position
    // since we don't have modify API yet
    try {
      setLoading(true);
      const response = await positionService.squareOff(position.id);
      
      if (response.success) {
        Alert.alert('Success', 'Position closed successfully');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        Alert.alert('Error', response.message || 'Failed to close position');
      }
    } catch (error) {
      console.error('Error closing position:', error);
      Alert.alert('Error', error.message || 'Failed to close position');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Order ID */}
          <Text style={styles.orderId}>#{position.orderNumber || position.id?.substring(0, 8)}</Text>

          {/* Symbol Info */}
          <View style={styles.symbolSection}>
            <View style={styles.symbolLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.iconText}>{position.instrument?.symbol?.[0] || '?'}</Text>
              </View>
              <View>
                <Text style={styles.symbol}>{position.instrument?.symbol || 'Unknown'}</Text>
                <Text style={styles.action}>
                  <Text style={position.side === 'BUY' ? styles.buyText : styles.sellText}>
                    {position.side} {position.quantity}
                  </Text>
                  <Text style={styles.atText}> at {position.avgPrice?.toFixed(2)}</Text>
                </Text>
              </View>
            </View>
            <Text style={styles.amount}>
              ${(position.quantity * position.avgPrice)?.toFixed(2)}
            </Text>
          </View>

          {/* Leverage Options - Visual only for now */}
          <View style={styles.leverageContainer}>
            {leverageOptions.map((value, index) => (
              <TouchableOpacity
                key={`leverage-${value}-${index}`}
                style={[
                  styles.leverageButton,
                  selectedLeverage === value && styles.leverageButtonActive,
                ]}
                onPress={() => setSelectedLeverage(value)}
              >
                <Text
                  style={[
                    styles.leverageText,
                    value > 0 ? styles.leveragePositive : styles.leverageNegative,
                  ]}
                >
                  {value > 0 ? '+' : ''}{value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* SL/TP Controls - Visual only for now */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlGroup}>
              <TouchableOpacity style={styles.controlButton}>
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.controlLabel}>SL</Text>
              <TouchableOpacity style={styles.controlButton}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.controlGroup}>
              <TouchableOpacity style={styles.controlButton}>
                <Text style={styles.controlButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.controlLabel}>TP</Text>
              <TouchableOpacity style={styles.controlButton}>
                <Text style={styles.controlButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, loading && styles.disabledButton]} 
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.confirmButtonText}>Close Position</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  symbolSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  symbolLeft: {
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
  symbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  action: {
    fontSize: 13,
  },
  buyText: {
    color: colors.green,
    fontWeight: '500',
  },
  sellText: {
    color: colors.red,
    fontWeight: '500',
  },
  atText: {
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.blue,
  },
  leverageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  leverageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.background,
    minWidth: 45,
    alignItems: 'center',
  },
  leverageButtonActive: {
    backgroundColor: colors.blue,
  },
  leverageText: {
    fontSize: 13,
    fontWeight: '600',
  },
  leveragePositive: {
    color: colors.blue,
  },
  leverageNegative: {
    color: colors.textSecondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 16,
  },
  controlGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
