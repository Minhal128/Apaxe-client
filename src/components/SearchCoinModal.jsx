import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

const searchResults = [
  { id: 1, symbol: 'SBIN', volume: 'Vol. 12.3M', price: '11,0263.8', change: '$345.90', isPositive: false },
  { id: 2, symbol: 'Nifty 500', volume: 'Vol. 12.3M', price: '11,0263.8', change: '$345.90', isPositive: false },
  { id: 3, symbol: 'Nifty 500', volume: 'Vol. 12.3M', price: '11,0263.8', change: '$345.90', isPositive: false },
  { id: 4, symbol: 'Nifty 500', volume: 'Vol. 12.3M', price: '11,0263.8', change: '$345.90', isPositive: false },
  { id: 5, symbol: 'SBIN', volume: 'Vol. 12.3M', price: '11,0263.8', change: '$345.90', isPositive: false },
  { id: 6, symbol: 'SBIN', volume: 'Vol. 12.3M', price: '11,0263.8', change: '$345.90', isPositive: false },
];

const categories = ['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Commodity'];

export default function SearchCoinModal({ visible, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('NSE');
  const [searchQuery, setSearchQuery] = useState('');

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

          {/* Title */}
          <Text style={styles.title}>Search coin</Text>

          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
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

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coin"
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {searchResults.map((item) => (
                <TouchableOpacity key={item.id} style={styles.resultCard} onPress={onClose}>
                  <View style={styles.resultLeft}>
                    <Text style={styles.resultSymbol}>{item.symbol}</Text>
                    <Text style={styles.resultVolume}>{item.volume}</Text>
                  </View>
                  <View style={styles.resultRight}>
                    <Text style={styles.resultPrice}>{item.price}</Text>
                    <Text style={[styles.resultChange, item.isPositive ? styles.positiveChange : styles.negativeChange]}>
                      {item.change}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.textSecondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  categoriesContainer: {
    marginBottom: 20,
    maxHeight: 50,
  },
  categoriesContent: {
    paddingRight: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: colors.textPrimary,
    fontSize: 14,
  },
  resultsContainer: {
    flex: 1,
  },
  results: {
    flex: 1,
    marginTop: 8,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultLeft: {
    flex: 1,
  },
  resultSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultVolume: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  resultRight: {
    alignItems: 'flex-end',
  },
  resultPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  resultChange: {
    fontSize: 13,
    fontWeight: '500',
  },
  positiveChange: {
    color: colors.green,
  },
  negativeChange: {
    color: colors.red,
  },
});
