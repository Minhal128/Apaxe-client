import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const transactions = [
  { id: 1, type: 'Withdraw', date: '12-10-25', amount: '$50,000', status: 'Paid', statusColor: colors.green },
  { id: 2, type: 'Deposit', date: '12-10-25', amount: '$50,000', status: 'success', statusColor: colors.green },
  { id: 3, type: 'Deposit', date: '12-10-25', amount: '$50,000', status: 'success', statusColor: colors.green },
  { id: 4, type: 'Deposit', date: '12-10-25', amount: '$50,000', status: 'success', statusColor: colors.green },
];

export default function WalletScreen({ navigation }) {
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add funds</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <Text style={styles.balanceAmount}>$2,610.50</Text>
          <Text style={styles.balanceChange}>Today's PNL   +0.81%</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setDepositModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>Deposit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setWithdrawModalVisible(true)}
          >
            <Text style={styles.actionButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Transaction history</Text>

        {transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionIcon}>
              <Ionicons 
                name={transaction.type === 'Deposit' ? 'arrow-down' : 'arrow-up'} 
                size={20} 
                color={colors.textPrimary} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionType}>{transaction.type}</Text>
              <Text style={styles.transactionDate}>{transaction.date}</Text>
            </View>
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>{transaction.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: transaction.statusColor + '20' }]}>
                <Text style={[styles.statusText, { color: transaction.statusColor }]}>
                  {transaction.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Deposit Modal */}
      {depositModalVisible && (
        <DepositModal 
          visible={depositModalVisible}
          onClose={() => setDepositModalVisible(false)}
        />
      )}

      {/* Withdraw Modal */}
      {withdrawModalVisible && (
        <WithdrawModal 
          visible={withdrawModalVisible}
          onClose={() => setWithdrawModalVisible(false)}
        />
      )}

      {/* Bottom Navbar */}
      <View style={styles.bottomNavbar}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={24} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Chart', { symbol: 'BTC/USDT' })}
        >
          <Ionicons name="bar-chart" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Trade</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.walletButton}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Ionicons name="wallet" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Position')}
        >
          <Ionicons name="settings" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>More</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Deposit Modal Component
function DepositModal({ visible, onClose }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Deposit</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount to deposit</Text>
          <View style={styles.input} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks</Text>
          <View style={styles.input} />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={onClose}>
          <Text style={styles.submitButtonText}>Deposit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Withdraw Modal Component
function WithdrawModal({ visible, onClose }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Withdraw</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount to withdraw</Text>
          <View style={styles.input} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks</Text>
          <View style={styles.input} />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={onClose}>
          <Text style={styles.submitButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  balanceCard: {
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  balanceChange: {
    fontSize: 14,
    color: colors.green,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 100,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: colors.textPrimary,
    fontSize: 16,
    minHeight: 50,
  },
  submitButton: {
    backgroundColor: colors.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bottomNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navLabel: {
    fontSize: 11,
    color: colors.textPrimary,
    marginTop: 4,
    fontWeight: '500',
  },
  walletButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
