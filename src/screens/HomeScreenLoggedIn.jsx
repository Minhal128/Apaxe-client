import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { Svg, Path, Polyline } from 'react-native-svg';
import RegisteredNavbar from '../components/RegisteredNavbar';
import { userService, instrumentService, positionService, authService } from '../services';

const categories = ['Crypto', 'MCX', 'MCX2', 'Forex', 'NSE', 'Equity', 'Commodity'];

// Mini chart component
const MiniChart = ({ isPositive }) => {
  const points = isPositive 
    ? "0,20 10,18 20,15 30,12 40,10 50,8"
    : "0,10 10,12 20,15 30,13 40,16 50,20";
  
  return (
    <Svg height="30" width="60" style={{ marginTop: 8 }}>
      <Polyline
        points={points}
        fill="none"
        stroke={isPositive ? colors.green : colors.red}
        strokeWidth="2"
      />
    </Svg>
  );
};

export default function HomeScreenLoggedIn({ navigation }) {
  const [activeTab, setActiveTab] = useState('Top gainers');
  const [selectedCategory, setSelectedCategory] = useState('Crypto');
  const [positionFilter, setPositionFilter] = useState('Open'); // Add position filter state
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [topMovers, setTopMovers] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [userData, dashboardData, moversData, positionsData] = await Promise.all([
        authService.getUser(),
        userService.getDashboard().catch(() => null),
        instrumentService.getTopMovers().catch(() => ({ data: [] })),
        positionService.getPositions().catch(() => ({ data: [] })),
      ]);
      
      setUser(userData);
      setDashboard(dashboardData?.data);
      // Handle response: { data: [...] }
      setTopMovers(Array.isArray(moversData?.data) ? moversData.data : []);
      setPositions(Array.isArray(positionsData?.data) ? positionsData.data : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const balance = dashboard?.balance || 0;
  const pnl = dashboard?.todayPnl || 0;
  const pnlPercent = dashboard?.todayPnlPercent || 0;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <Text style={styles.profileText}>{user?.firstName?.[0] || 'U'}</Text>
            </View>
            <View>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            </View>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Notification')}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => navigation.navigate('Alert')}
            >
              <Ionicons name="notifications" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Your balance</Text>
            <Ionicons name="help-circle-outline" size={16} color={colors.textPrimary} />
          </View>
          <View style={styles.balanceMainRow}>
            <View>
              <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
              <View style={styles.balanceFooter}>
                <Text style={styles.pnlLabel}>Today's PNL</Text>
                <Text style={[styles.pnlValue, { color: pnlPercent >= 0 ? colors.green : colors.red }]}>
                  {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.addFundButton}
              onPress={() => navigation.navigate('WalletLoggedIn')}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.addFundText}>Add fund</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Top gainers' && styles.tabActive]}
          onPress={() => setActiveTab('Top gainers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Top gainers' && styles.tabTextActive,
            ]}
          >
            Top gainers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Top losers' && styles.tabActive]}
          onPress={() => setActiveTab('Top losers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Top losers' && styles.tabTextActive,
            ]}
          >
            Top losers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Most active' && styles.tabActive]}
          onPress={() => setActiveTab('Most active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Most active' && styles.tabTextActive,
            ]}
          >
            Most active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Favorites' && styles.tabActive]}
          onPress={() => setActiveTab('Favorites')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Favorites' && styles.tabTextActive,
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gainers Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.gainersScrollView}
          contentContainerStyle={styles.gainersListContainer}
        >
          {topMovers.length > 0 ? topMovers.map((item) => (
            <TouchableOpacity
              key={item.id || item.symbol}
              style={styles.gainerCard}
              onPress={() => navigation.navigate('Chart', { symbol: item.symbol, instrumentId: item.id, isLoggedIn: true })}
            >
              <View style={styles.gainerHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{item.symbol?.[0] || 'X'}</Text>
                </View>
                <View style={styles.gainerHeaderRight}>
                  <Text style={styles.gainerName}>{item.symbol || item.name}</Text>
                  <Text style={[styles.gainerChange, { color: (item.changePercent || 0) >= 0 ? colors.green : colors.red }]}>
                    {(item.changePercent || 0) >= 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.gainerPrice}>{(item.lastPrice || item.price || 0).toLocaleString()}</Text>
              <MiniChart isPositive={(item.changePercent || 0) >= 0} />
            </TouchableOpacity>
          )) : (
            <Text style={{ color: colors.textSecondary, padding: 20 }}>No data available</Text>
          )}
        </ScrollView>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Positions Section */}
        <View style={styles.positionsSection}>
          <View style={styles.positionFilters}>
            <TouchableOpacity 
              style={[styles.filterButton, positionFilter === 'Open' && styles.filterButtonActive]}
              onPress={() => setPositionFilter('Open')}
            >
              <Text style={positionFilter === 'Open' ? styles.filterTextActive : styles.filterText}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, positionFilter === 'Pending' && styles.filterButtonActive]}
              onPress={() => setPositionFilter('Pending')}
            >
              <Text style={positionFilter === 'Pending' ? styles.filterTextActive : styles.filterText}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterButton, positionFilter === 'Closed' && styles.filterButtonActive]}
              onPress={() => setPositionFilter('Closed')}
            >
              <Text style={positionFilter === 'Closed' ? styles.filterTextActive : styles.filterText}>Closed</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <Text style={styles.totalAmount}>
              ${Array.isArray(positions) ? positions.reduce((sum, p) => sum + (p.currentValue || 0), 0).toLocaleString() : '0'}
            </Text>
          </View>

          {(() => {
            // Filter positions based on selected filter
            let filteredPositions = [];
            if (Array.isArray(positions)) {
              if (positionFilter === 'Open') {
                filteredPositions = positions.filter(p => p.status === 'OPEN' || !p.status);
              } else if (positionFilter === 'Pending') {
                filteredPositions = positions.filter(p => p.status === 'PENDING');
              } else if (positionFilter === 'Closed') {
                filteredPositions = positions.filter(p => p.status === 'CLOSED' || p.status === 'FILLED');
              }
            }

            return filteredPositions.length > 0 ? filteredPositions.slice(0, 3).map((position) => (
              <TouchableOpacity key={position.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <View style={styles.positionLeft}>
                    <View style={styles.positionIcon}>
                      <Text style={styles.positionIconText}>{position.instrument?.symbol?.[0] || 'P'}</Text>
                    </View>
                    <View>
                      <Text style={styles.positionSymbol}>{position.instrument?.symbol || 'Unknown'}</Text>
                      <Text style={styles.positionAction}>
                        <Text style={position.side === 'BUY' ? styles.buyText : styles.sellText}>
                          {position.side} {position.quantity}
                        </Text>
                        <Text style={styles.atText}> at {position.avgPrice?.toFixed(2)}</Text>
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.positionAmount, { color: (position.unrealizedPnl || 0) >= 0 ? colors.green : colors.red }]}>
                    ${(position.currentValue || 0).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            )) : (
              <Text style={{ color: colors.textSecondary, padding: 20, textAlign: 'center' }}>
                No {positionFilter.toLowerCase()} positions
              </Text>
            );
          })()}
        </View>
      </ScrollView>

      <RegisteredNavbar navigation={navigation} activeScreen="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8C4A8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C2F3E',
  },
  welcomeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
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
  balanceCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 4,
  },
  balanceMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pnlLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 8,
  },
  pnlValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.green,
  },
  addFundButton: {
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addFundText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  gainersScrollView: {
    marginTop: 16,
    marginBottom: 16,
  },
  gainersListContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gainerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: 140,
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gainerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gainerHeaderRight: {
    marginLeft: 8,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3D4262',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  gainerName: {
    color: '#2C2F3E',
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  gainerChange: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '500',
  },
  gainerPrice: {
    color: '#2C2F3E',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    maxHeight: 50,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  categoryText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  positionsSection: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  positionFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: colors.textPrimary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  filterTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.blue,
  },
  positionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3D4262',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  positionIconText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  positionSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  positionAction: {
    fontSize: 13,
  },
  buyText: {
    color: colors.blue,
    fontWeight: '500',
  },
  sellText: {
    color: colors.red,
    fontWeight: '500',
  },
  atText: {
    color: colors.textSecondary,
  },
  positionAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.blue,
  },
});
