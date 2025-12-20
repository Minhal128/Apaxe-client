import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import RegisteredNavbar from '../components/RegisteredNavbar';
import { positionService, orderService } from '../services';

export default function OrdersPositionsScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Positions');
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [positionsRes, ordersRes] = await Promise.all([
        positionService.getPositions(),
        orderService.getOrders()
      ]);
      
      if (positionsRes.success) {
        setPositions(positionsRes.data || []);
      }
      if (ordersRes.success) {
        setOrders(ordersRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleClosePosition = async (positionId) => {
    try {
      const response = await positionService.squareOff(positionId);
      if (response.success) {
        Alert.alert('Success', 'Position closed successfully');
        fetchData();
      } else {
        Alert.alert('Error', response.message || 'Failed to close position');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to close position');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} | ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders and positions</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
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
          style={[styles.tab, activeTab === 'Orders' && styles.tabActive]}
          onPress={() => setActiveTab('Orders')}
        >
          <Text style={[styles.tabText, activeTab === 'Orders' && styles.tabTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activeTab === 'Positions' ? (
          <>
            {!Array.isArray(positions) || positions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="layers-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No open positions</Text>
              </View>
            ) : (
              positions.map((position) => (
                <View key={position.id} style={styles.positionCard}>
                  <View style={styles.positionHeader}>
                    <View style={[styles.typeBadge, position.side === 'BUY' ? styles.buyBadge : styles.shortBadge]}>
                      <Text style={styles.typeBadgeText}>{position.side}</Text>
                    </View>
                    <Text style={styles.positionPrice}>{position.currentPrice?.toFixed(2) || '0.00'}</Text>
                  </View>
                  
                  <View style={styles.positionBody}>
                    <Text style={styles.positionSymbol}>{position.instrument?.symbol || 'Unknown'}</Text>
                    <Text style={[styles.positionProfit, position.unrealizedPnl >= 0 ? styles.profitPositive : styles.profitNegative]}>
                      ${position.unrealizedPnl?.toFixed(2) || '0.00'} ({position.unrealizedPnlPercent?.toFixed(2) || '0'}%)
                    </Text>
                  </View>
                  
                  <Text style={styles.positionOption}>{position.instrument?.segment?.name || position.instrument?.segment || 'N/A'}</Text>
                  
                  <View style={styles.positionDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Qty: {position.quantity}</Text>
                      <Text style={styles.detailLabel}>P&L</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Avg: {position.avgPrice?.toFixed(2) || '0.00'}</Text>
                      <Text style={[styles.detailValue, position.unrealizedPnl >= 0 ? styles.profitPositive : styles.profitNegative]}>
                        {position.unrealizedPnl >= 0 ? '+' : ''}{position.unrealizedPnl?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.positionActions}>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => handleClosePosition(position.id)}
                    >
                      <Text style={styles.actionBtnText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => navigation.navigate('ModifyPosition', { position })}
                    >
                      <Text style={styles.actionBtnText}>Modify</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {orders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>No orders</Text>
              </View>
            ) : (
              orders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderLeft}>
                    <View style={styles.orderIcon}>
                      <Ionicons name="swap-horizontal" size={20} color={colors.textPrimary} />
                    </View>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderSymbol}>{order.instrument?.symbol || order.symbol}</Text>
                      <Text style={styles.orderType}>{order.side} {order.quantity} at {order.price?.toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={[styles.orderStatus, 
                      order.status === 'FILLED' ? styles.statusFilled : 
                      order.status === 'PENDING' ? styles.statusPending : styles.statusCancelled
                    ]}>
                      {order.status}
                    </Text>
                    <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('Chart', { isLoggedIn: true })}
      >
        <Ionicons name="add" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Bottom Navbar */}
      <RegisteredNavbar navigation={navigation} activeScreen="PositionLoggedIn" />
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
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  positionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  buyBadge: {
    backgroundColor: '#1E88E5',
  },
  shortBadge: {
    backgroundColor: colors.red,
  },
  typeBadgeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  positionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  positionBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  positionProfit: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitPositive: {
    color: colors.green,
  },
  profitNegative: {
    color: colors.red,
  },
  positionOption: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  positionDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  positionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.inputBackground,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderType: {
    fontSize: 13,
    color: '#1E88E5',
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  statusFilled: {
    color: colors.green,
  },
  statusPending: {
    color: colors.yellow || '#FFC107',
  },
  statusCancelled: {
    color: colors.red,
  },
});
