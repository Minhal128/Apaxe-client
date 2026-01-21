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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import RegisteredNavbar from '../components/RegisteredNavbar';
import ModifyPositionScreen from './ModifyPositionScreen';
import { positionService, orderService } from '../services';

export default function PositionLoggedIn({ navigation }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('Positions');
  const [orderTab, setOrderTab] = useState('Pending'); // Add order sub-tab state
  const [modifyVisible, setModifyVisible] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [positionsRes, ordersRes] = await Promise.all([
        positionService.getPositions().catch(() => ({ data: [] })),
        orderService.getOrderHistory().catch(() => ({ data: [] })),
      ]);
      setPositions(positionsRes?.data || []);
      setOrders(ordersRes?.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleClosePosition = async (positionId) => {
    try {
      await positionService.squareOff(positionId);
      fetchData();
    } catch (error) {
      console.error('Error closing position:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.ordersAndPositions}</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('History')}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Positions' && { ...styles.tabActive, borderBottomColor: colors.textPrimary }]}
          onPress={() => setActiveTab('Positions')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Positions' ? colors.textPrimary : colors.textSecondary }, activeTab === 'Positions' && styles.tabTextActive]}>
            {t.positions}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Orders' && { ...styles.tabActive, borderBottomColor: colors.textPrimary }]}
          onPress={() => setActiveTab('Orders')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'Orders' ? colors.textPrimary : colors.textSecondary }, activeTab === 'Orders' && styles.tabTextActive]}>
            {t.orders}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Order Sub-tabs (only show when Orders tab is active) */}
      {activeTab === 'Orders' && (
        <View style={[styles.subTabsContainer, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity 
            style={[styles.subTab, orderTab === 'Pending' && { backgroundColor: colors.textPrimary }]}
            onPress={() => setOrderTab('Pending')}
          >
            <Text style={[styles.subTabText, { color: orderTab === 'Pending' ? colors.background : colors.textSecondary }, orderTab === 'Pending' && styles.subTabTextActive]}>
              {t.pending}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.subTab, orderTab === 'Closed' && { backgroundColor: colors.textPrimary }]}
            onPress={() => setOrderTab('Closed')}
          >
            <Text style={[styles.subTabText, { color: orderTab === 'Closed' ? colors.background : colors.textSecondary }, orderTab === 'Closed' && styles.subTabTextActive]}>
              {t.closed}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.green} style={{ marginTop: 50 }} />
        ) : activeTab === 'Positions' ? (
          <>
            {Array.isArray(positions) && positions.length > 0 ? positions.map((position) => (
              <View key={position.id} style={[styles.positionCard, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.positionHeader}>
                  <View style={[styles.typeBadge, position.side === 'BUY' ? styles.buyBadge : styles.shortBadge]}>
                    <Text style={[styles.typeBadgeText, { color: colors.textPrimary }]}>{ position.side}</Text>
                  </View>
                  <Text style={[styles.positionPrice, { color: colors.textPrimary }]}>{(position.currentPrice || 0).toLocaleString()}</Text>
                </View>
                
                <View style={styles.positionBody}>
                  <Text style={[styles.positionSymbol, { color: colors.textPrimary }]}>{position.instrument?.symbol || 'Unknown'}</Text>
                  <Text style={[styles.positionProfit, (position.unrealizedPnl || 0) >= 0 ? { color: colors.green } : { color: colors.red }]}>
                    ${(position.unrealizedPnl || 0).toFixed(2)} ({((position.unrealizedPnlPercent || 0)).toFixed(2)}%)
                  </Text>
                </View>
                
                <Text style={[styles.positionOption, { color: colors.textSecondary }]}>Qty: {position.quantity} @ {(position.avgPrice || 0).toFixed(2)}</Text>
                
                <View style={styles.positionDetails}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Size: {position.quantity}</Text>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>P&L</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Avg: {(position.avgPrice || 0).toFixed(2)}</Text>
                    <Text style={[styles.detailValue, (position.unrealizedPnl || 0) >= 0 ? { color: colors.green } : { color: colors.red }]}>
                      {(position.unrealizedPnl || 0) >= 0 ? '+' : ''}{(position.unrealizedPnl || 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.positionActions}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]} onPress={() => handleClosePosition(position.id)}>
                    <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>{t.close}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.inputBackground }]}
                    onPress={() => { setSelectedPosition(position); setModifyVisible(true); }}
                  >
                    <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>{t.modify}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )) : (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 50 }}>{t.noOpenPositions}</Text>
            )}
          </>
        ) : (
          <>
            {/* Filter orders based on orderTab */}
            {(() => {
              const filteredOrders = orders.filter(order => {
                if (orderTab === 'Pending') {
                  return order.status === 'PENDING' || order.status === 'OPEN' || order.status === 'PARTIALLY_FILLED';
                } else {
                  return order.status === 'FILLED' || order.status === 'CANCELLED' || order.status === 'REJECTED';
                }
              });

              return filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.cardBackground }]}>
                  <View style={styles.orderLeft}>
                    <View style={[styles.orderIcon, { backgroundColor: colors.inputBackground }]}>
                      <Ionicons name="swap-horizontal" size={20} color={colors.textPrimary} />
                    </View>
                    <View style={styles.orderInfo}>
                      <Text style={[styles.orderSymbol, { color: colors.textPrimary }]}>{order.instrument?.symbol || 'Unknown'}</Text>
                      <Text style={styles.orderType}>{order.side} {order.quantity} at {(order.price || order.avgPrice || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={[styles.orderStatus, { color: order.status === 'FILLED' ? colors.green : colors.textSecondary }]}>{order.status}</Text>
                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              )) : (
                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 50 }}>
                  {t.noOrders.replace('{type}', orderTab.toLowerCase())}
                </Text>
              );
            })()}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.green }]}
        onPress={() => navigation.navigate('Chart', { isLoggedIn: true })}
      >
        <Ionicons name="add" size={28} color={colors.textPrimary} />
      </TouchableOpacity>

      {/* Modify Position Modal */}
      <ModifyPositionScreen 
        visible={modifyVisible}
        onClose={() => setModifyVisible(false)}
      />

      {/* Bottom Navbar */}
      <RegisteredNavbar navigation={navigation} activeScreen="PositionLoggedIn" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '600',
  },
  subTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 4,
  },
  subTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  subTabActive: {
  },
  subTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subTabTextActive: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  positionCard: {
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
    backgroundColor: '#FF4757',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positionPrice: {
    fontSize: 18,
    fontWeight: '700',
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
  },
  positionProfit: {
    fontSize: 14,
    fontWeight: '600',
  },
  profitPositive: {
  },
  profitNegative: {
  },
  positionOption: {
    fontSize: 13,
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
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
