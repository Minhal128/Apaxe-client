import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import CreateOrderModal from '../components/CreateOrderModal';
import TradeOrderModal from '../components/TradeOrderModal';
import SearchCoinModal from '../components/SearchCoinModal';

const { width } = Dimensions.get('window');

const candlestickData = [
  { high: 64500, low: 63800, positive: true },
  { high: 64200, low: 63500, positive: false },
  { high: 64800, low: 64000, positive: true },
  { high: 64600, low: 63900, positive: false },
  { high: 65000, low: 64200, positive: true },
  { high: 64900, low: 64100, positive: true },
  { high: 64700, low: 64000, positive: false },
  { high: 65200, low: 64500, positive: true },
  { high: 65100, low: 64400, positive: false },
  { high: 64800, low: 64200, positive: false },
  { high: 65300, low: 64600, positive: true },
  { high: 64900, low: 64300, positive: false },
];

const orderBookBids = [
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
];

const orderBookAsks = [
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
  { price: '27,486.39', amount: '2485.27' },
];

const timeframes = ['1m', '5m', '15m', '15m', '1d', 'More'];

const marketWatchData = [
  { id: 1, symbol: 'SBIN', option: '4325.90 USDT', price: '11,0263.8', change: '+1.24%', isPositive: true, amount: '$345.90' },
  { id: 2, symbol: 'SBIN', option: '4325.90 USDT', price: '11,0263.8', change: '-1.24%', isPositive: false, amount: '$345.90' },
  { id: 3, symbol: 'SBIN', option: '4325.90 USDT', price: '11,0263.8', change: '-1.24%', isPositive: false, amount: '$345.90' },
  { id: 4, symbol: 'SBIN', option: '4325.90 USDT', price: '11,0263.8', change: '-1.24%', isPositive: false, amount: '$345.90' },
  { id: 5, symbol: 'SBIN', option: '4325.90 USDT', price: '11,0263.8', change: '+1.24%', isPositive: true, amount: '$345.90' },
];

const categories = ['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Community'];

export default function ChartScreen({ route, navigation }) {
  const { symbol = 'Nifty 500' } = route?.params || {};
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [activeTab, setActiveTab] = useState('Positions');
  const [modalVisible, setModalVisible] = useState(false);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('NSE');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{symbol}</Text>
          <Ionicons name="flash" size={16} color={colors.textSecondary} />
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Price Info */}
      <View style={styles.priceContainer}>
        <Text style={styles.changePercent}>+0.81%</Text>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chartWithLabels}>
          {/* Y-axis labels */}
          <View style={styles.yAxisLabels}>
            {[64000, 64250, 64500, 64750, 65000].map((price) => (
              <Text key={price} style={styles.yAxisLabel}>
                {price}
              </Text>
            ))}
          </View>
          
          {/* Candlestick chart */}
          <View style={styles.candlestickContainer}>
            {candlestickData.map((candle, index) => {
              const maxHigh = Math.max(...candlestickData.map(c => c.high));
              const minLow = Math.min(...candlestickData.map(c => c.low));
              const range = maxHigh - minLow;
              const wickHeight = ((candle.high - candle.low) / range) * 150;
              
              return (
                <View key={`candle-${index}`} style={styles.candlestick}>
                  <View
                    style={[
                      styles.candlestickWick,
                      {
                        height: wickHeight,
                        backgroundColor: candle.positive ? colors.green : colors.red,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
        
        {/* Timeframe selector */}
        <View style={styles.timeframeContainer}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.timeframeButton,
                selectedTimeframe === tf && styles.timeframeButtonActive,
              ]}
              onPress={() => setSelectedTimeframe(tf)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  selectedTimeframe === tf && styles.timeframeTextActive,
                ]}
              >
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Buy/Sell Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.sellButton]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Sell</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Buy</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Positions' && styles.tabActive]}
          onPress={() => setActiveTab('Positions')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Positions' && styles.tabTextActive,
            ]}
          >
            Positions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Order books' && styles.tabActive]}
          onPress={() => setActiveTab('Order books')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Order books' && styles.tabTextActive,
            ]}
          >
            Order books
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Market watch' && styles.tabActive]}
          onPress={() => setActiveTab('Market watch')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Market watch' && styles.tabTextActive,
            ]}
          >
            Market watch
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'Positions' && (
        <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Balance</Text>
              <Text style={styles.balanceValue}>$40,000.98</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Equity</Text>
              <Text style={styles.balanceValue}>$40,000.98</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Free Margin</Text>
              <Text style={styles.balanceValue}>$40,000.98</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.positionFilters}
          >
            <TouchableOpacity style={[styles.filterButton, styles.filterButtonActive]}>
              <Text style={styles.filterTextActive}>Open</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Pending</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Text style={styles.filterText}>Closed</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.positionAmount}>
            <Text style={styles.positionAmountText}>$1,500</Text>
          </View>

          <TouchableOpacity 
            style={styles.positionCard}
            onPress={() => setTradeModalVisible(true)}
          >
            <View style={styles.positionHeader}>
              <View style={styles.positionLeft}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>S</Text>
                </View>
                <View>
                  <Text style={styles.positionSymbol}>SBIN</Text>
                  <Text style={styles.positionAction}>
                    <Text style={styles.buyText}>Buy 0.01</Text>
                    <Text style={styles.atText}> at 4325.90</Text>
                  </Text>
                </View>
              </View>
              <Text style={styles.positionAmount}>$1,200</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.positionCard}
            onPress={() => setTradeModalVisible(true)}
          >
            <View style={styles.positionHeader}>
              <View style={styles.positionLeft}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>N</Text>
                </View>
                <View>
                  <Text style={styles.positionSymbol}>NIFTY500</Text>
                  <Text style={styles.positionAction}>
                    <Text style={styles.sellText}>Sell 0.01</Text>
                    <Text style={styles.atText}> at 4325.90</Text>
                  </Text>
                </View>
              </View>
              <Text style={styles.positionAmount}>$300</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === 'Order books' && (
        <View style={styles.orderBook}>
          <View style={styles.orderBookHeader}>
            <Text style={styles.orderBookHeaderText}>Bid</Text>
            <Text style={styles.orderBookHeaderText}>Ask</Text>
          </View>
          
          <View style={styles.orderBookContent}>
            <View style={styles.orderBookColumn}>
              {orderBookBids.map((order, index) => (
                <View key={`bid-${index}`} style={styles.orderBookRow}>
                  <Text style={styles.orderBookPriceBid}>{order.price}</Text>
                  <Text style={styles.orderBookAmount}>{order.amount}</Text>
                </View>
              ))}
            </View>
            <View style={styles.orderBookColumn}>
              {orderBookAsks.map((order, index) => (
                <View key={`ask-${index}`} style={styles.orderBookRow}>
                  <Text style={styles.orderBookPriceAsk}>{order.price}</Text>
                  <Text style={styles.orderBookAmount}>{order.amount}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {activeTab === 'Market watch' && (
        <ScrollView style={styles.marketWatch} showsVerticalScrollIndicator={false}>
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

          {marketWatchData.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.marketWatchCard}
              onPress={() => setSearchModalVisible(true)}
            >
              <View style={styles.marketWatchLeft}>
                <Text style={styles.marketWatchSymbol}>{item.symbol}</Text>
                <Text style={styles.marketWatchOption}>Option . {item.option}</Text>
              </View>
              <View style={styles.marketWatchRight}>
                <Text style={styles.marketWatchPrice}>{item.price}</Text>
                <Text style={[styles.marketWatchChange, item.isPositive ? styles.positiveChange : styles.negativeChange]}>
                  {item.amount}
                </Text>
              </View>
              <Text style={[styles.marketWatchPercentage, item.isPositive ? styles.positiveChange : styles.negativeChange]}>
                {item.change}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Trade Order Modal */}
      <TradeOrderModal 
        visible={tradeModalVisible} 
        onClose={() => setTradeModalVisible(false)}
      />

      {/* Search Coin Modal */}
      <SearchCoinModal 
        visible={searchModalVisible} 
        onClose={() => setSearchModalVisible(false)}
      />

      {/* Create Order Modal */}
      <CreateOrderModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        navigation={navigation}
      />

      {/* Bottom Navbar */}
      <View style={styles.bottomNavbar}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home" size={24} color={colors.textSecondary} />
          <Text style={[styles.navLabel, { color: colors.textSecondary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart" size={24} color={colors.textPrimary} />
          <Text style={styles.navLabel}>Trade</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  priceContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  changePercent: {
    color: colors.green,
    fontSize: 14,
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  chartWithLabels: {
    flexDirection: 'row',
    gap: 8,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    height: 200,
    width: 50,
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  candlestickContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 16,
  },
  candlestick: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  candlestickWick: {
    width: 8,
    borderRadius: 2,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeframeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  timeframeButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  timeframeText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  timeframeTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
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
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 32,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  orderBook: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orderBookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderBookHeaderText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  orderBookContent: {
    flexDirection: 'row',
    gap: 16,
  },
  orderBookColumn: {
    flex: 1,
  },
  orderBookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderBookPrice: {
    color: colors.green,
    fontSize: 12,
  },
  orderBookPriceBid: {
    color: colors.green,
    fontSize: 12,
  },
  orderBookPriceAsk: {
    color: colors.red,
    fontSize: 12,
  },
  orderBookAmount: {
    color: colors.textPrimary,
    fontSize: 12,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  balanceSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  positionFilters: {
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
  positionAmount: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  positionAmountText: {
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
  marketWatch: {
    flex: 1,
    paddingHorizontal: 16,
  },
  categoriesContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: colors.cardBackground,
  },
  categoryButtonActive: {
    backgroundColor: colors.textPrimary,
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
  marketWatchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  marketWatchLeft: {
    flex: 1,
  },
  marketWatchSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  marketWatchOption: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  marketWatchRight: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  marketWatchPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  marketWatchChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  marketWatchPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChange: {
    color: colors.green,
  },
  negativeChange: {
    color: colors.red,
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
