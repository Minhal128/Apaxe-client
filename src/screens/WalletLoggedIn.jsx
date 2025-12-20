import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import RegisteredNavbar from '../components/RegisteredNavbar';
import { userService } from '../services';

export default function WalletLoggedIn({ navigation }) {
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, balanceHistoryRes] = await Promise.all([
        userService.getDashboard().catch(() => ({ data: null })),
        userService.getBalanceHistory().catch(() => ({ data: [] })),
      ]);
      
      setDashboard(dashboardRes?.data);
      
      // Ensure transactions is always an array
      const transactionData = balanceHistoryRes?.data;
      if (Array.isArray(transactionData)) {
        setTransactions(transactionData);
      } else {
        console.log('Transaction data is not an array:', transactionData);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      // Ensure transactions is set to empty array on error
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const balance = dashboard?.balance || 0;
  const pnlPercent = dashboard?.todayPnlPercent || 0;

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

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.green} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Your balance</Text>
                <Ionicons name="help-circle-outline" size={16} color="#666" />
              </View>
              <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
              <Text style={[styles.balanceChange, { color: pnlPercent >= 0 ? colors.green : colors.red }]}>
                Today's PNL   {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
              </Text>
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

            {Array.isArray(transactions) && transactions.length > 0 ? transactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons 
                    name={transaction.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color={colors.textPrimary} 
                  />
                </View>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionType}>{transaction.type}</Text>
                  <Text style={styles.transactionDate}>{new Date(transaction.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>${(transaction.amount || 0).toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (transaction.status === 'COMPLETED' ? colors.green : colors.textSecondary) + '20' }]}>
                    <Text style={[styles.statusText, { color: transaction.status === 'COMPLETED' ? colors.green : colors.textSecondary }]}>
                      {transaction.status}
                    </Text>
                  </View>
                </View>
              </View>
            )) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No transactions yet</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Deposit Modal */}
      <Modal
        visible={depositModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <DepositModal onClose={() => setDepositModalVisible(false)} />
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={withdrawModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <WithdrawModal onClose={() => setWithdrawModalVisible(false)} />
      </Modal>

      <RegisteredNavbar navigation={navigation} activeScreen="wallet" />
    </View>
  );
}

// Deposit Modal Component
function DepositModal({ onClose }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const result = await userService.depositFunds(amount, remarks);
      if (result.success) {
        alert('Deposit successful!');
        onClose();
        // Refresh the page data
        window.location.reload();
      } else {
        alert(result.error || 'Deposit failed');
      }
    } catch (error) {
      alert('Deposit failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Deposit</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount to deposit</Text>
          <TextInput 
            style={styles.input} 
            placeholderTextColor={colors.textSecondary}
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks</Text>
          <TextInput 
            style={styles.input} 
            placeholderTextColor={colors.textSecondary}
            placeholder="Optional remarks"
            value={remarks}
            onChangeText={setRemarks}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && { opacity: 0.6 }]} 
          onPress={handleDeposit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Processing...' : 'Deposit'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Withdraw Modal Component
function WithdrawModal({ onClose }) {
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const result = await userService.withdrawFunds(amount, remarks);
      if (result.success) {
        alert('Withdrawal successful!');
        onClose();
        // Refresh the page data
        window.location.reload();
      } else {
        alert(result.error || 'Withdrawal failed');
      }
    } catch (error) {
      alert('Withdrawal failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.modalContent}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Withdraw</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount to withdraw</Text>
          <TextInput 
            style={styles.input} 
            placeholderTextColor={colors.textSecondary}
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Remarks</Text>
          <TextInput 
            style={styles.input} 
            placeholderTextColor={colors.textSecondary}
            placeholder="Optional remarks"
            value={remarks}
            onChangeText={setRemarks}
          />
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && { opacity: 0.6 }]} 
          onPress={handleWithdraw}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Processing...' : 'Confirm'}
          </Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
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
    paddingBottom: 40,
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
});
