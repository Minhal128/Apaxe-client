import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const historyData = [
  { id: 1, symbol: 'SBIN', type: 'Buy 0.01 at 4325.90', amount: '+$234.00', date: '12-10-25 | 13:01', isPositive: true },
  { id: 2, symbol: 'SBIN', type: 'Buy 0.01 at 4325.90', amount: '-$234.00', date: '12-10-25 | 13:01', isPositive: false },
  { id: 3, symbol: 'SBIN', type: 'Buy 0.01 at 4325.90', amount: '-$234.00', date: '12-10-25 | 13:01', isPositive: false },
  { id: 4, symbol: 'SBIN', type: 'Buy 0.01 at 4325.90', amount: '+$40,034.00', date: '12-10-25 | 13:01', isPositive: true },
];

export default function HistoryScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="calendar-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* History List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {historyData.map((item) => (
          <View key={item.id} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="swap-horizontal" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historySymbol}>{item.symbol}</Text>
                <Text style={styles.historyType}>{item.type}</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={[styles.historyAmount, item.isPositive ? styles.amountPositive : styles.amountNegative]}>
                {item.amount}
              </Text>
              <Text style={styles.historyDate}>{item.date}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    marginLeft: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyLeft: {
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
  historyInfo: {
    flex: 1,
  },
  historySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  historyType: {
    fontSize: 13,
    color: '#1E88E5',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountPositive: {
    color: colors.green,
  },
  amountNegative: {
    color: colors.red,
  },
  historyDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
