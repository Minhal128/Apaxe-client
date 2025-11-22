import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Svg, Path, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const gainersData = [
  { name: 'AxisBank', price: '40,059.83', change: '+0.81%', isPositive: true, icon: 'A' },
  { name: 'SBIN', price: '40,059.83', change: '+0.81%', isPositive: true, icon: 'S' },
  { name: 'NIFTY50', price: '40,059', change: '+0.81%', isPositive: true, icon: 'N' },
];

const categories = ['Crypto', 'MCX', 'Forex', 'NSE', 'Equity', 'Commodity'];

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

export default function TradeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Top gainers');
  const [selectedCategory, setSelectedCategory] = useState('Crypto');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trade</Text>
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

      {/* Gainers List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.gainersScrollView}
          contentContainerStyle={styles.gainersListContainer}
        >
          {gainersData.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.gainerCard}
              onPress={() => navigation.navigate('Chart', { symbol: item.name })}
            >
              <View style={styles.gainerHeader}>
                <View style={styles.iconContainer}>
                  <Text style={styles.iconText}>{item.icon}</Text>
                </View>
                <View style={styles.gainerHeaderRight}>
                  <Text style={styles.gainerName}>{item.name}</Text>
                  <Text style={styles.gainerChange}>{item.change}</Text>
                </View>
              </View>
              <Text style={styles.gainerPrice}>{item.price}</Text>
              <MiniChart isPositive={item.isPositive} />
            </TouchableOpacity>
          ))}
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

        {/* Crypto List */}
        <View style={styles.cryptoList}>
          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'BTC/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>BTC/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changeNegative]}>
                <Text style={styles.changeText}>-1.67%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'SOL/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>SOL/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changePositive]}>
                <Text style={styles.changeText}>1.27%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'ETH/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>ETH/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changePositive]}>
                <Text style={styles.changeText}>1.27%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'TRON/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>TRON/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changePositive]}>
                <Text style={styles.changeText}>1.27%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'XRP/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>XRP/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changeNegative]}>
                <Text style={styles.changeText}>-1.67%</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cryptoCard}
            onPress={() => navigation.navigate('Chart', { symbol: 'BNB/USDT' })}
          >
            <View style={styles.cryptoLeft}>
              <Text style={styles.cryptoSymbol}>BNB/USDT</Text>
              <Text style={styles.cryptoVolume}>770M USDT</Text>
            </View>
            <View style={styles.cryptoRight}>
              <Text style={styles.cryptoPrice}>11,0263.8</Text>
              <View style={[styles.changeContainer, styles.changeNegative]}>
                <Text style={styles.changeText}>-1.67%</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    padding: 16,
    paddingTop: 60,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
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
  gainersList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
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
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue,
  },
  gainerInfo: {
    alignItems: 'center',
    marginBottom: 4,
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
  cryptoList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cryptoCard: {
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cryptoLeft: {
    flex: 1,
  },
  cryptoSymbol: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  cryptoVolume: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cryptoRight: {
    alignItems: 'flex-end',
  },
  cryptoPrice: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  changeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  changePositive: {
    backgroundColor: colors.green,
  },
  changeNegative: {
    backgroundColor: colors.red,
  },
  changeText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonText: {
    fontSize: 24,
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
