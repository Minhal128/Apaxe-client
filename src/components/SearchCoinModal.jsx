import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { instrumentService } from '../services';

const categories = ['NSE', 'MCX', 'Forex', 'Crypto', 'Equity', 'Commodity'];

// Format volume to readable string
const formatVolume = (volume) => {
  if (!volume) return '0';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(0)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(0)}K`;
  return volume.toString();
};

export default function SearchCoinModal({ visible, onClose, onSelect }) {
  const [selectedCategory, setSelectedCategory] = useState('NSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      const delayDebounceFn = setTimeout(() => {
        fetchInstruments();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [visible, selectedCategory, searchQuery]);

  const fetchInstruments = async () => {
    setLoading(true);
    try {
      let response;
      if (searchQuery.length > 0) {
        response = await instrumentService.searchInstruments(searchQuery);
      } else {
        // Map category names to API segment names for backend
        const segmentMap = {
          'NSE': 'NSE',
          'MCX': 'MCX',
          'Forex': 'FOREX',
          'Crypto': 'CRYPTO',
          'Equity': 'EQUITY',
          'Commodity': 'COMMODITY'
        };
        
        const apiSegment = segmentMap[selectedCategory] || selectedCategory.toUpperCase();
        response = await instrumentService.getMarketWatch(apiSegment);
      }

      if (response.success) {
        // Response structure: { data: { instruments: [...] } } or { data: [...] } for search
        const instrumentsList = response.data?.instruments || (Array.isArray(response.data) ? response.data : []);
        // Transform market data to match expected format
        const results = instrumentsList.map(item => ({
          id: item.instrumentId || item.id,
          symbol: item.symbol,
          name: item.name || item.symbol,
          lastPrice: item.currentPrice?.ltp || item.ltp || 0,
          price: item.currentPrice?.ltp || item.ltp || 0,
          changePercent: item.currentPrice?.changePercent || item.changePercent || 0,
          volume: item.currentPrice?.volume || item.volume || 0,
          segment: item.segment
        }));
        setResults(results);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching instruments:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    if (onSelect) {
      // Pass complete item data for navigation
      onSelect({
        ...item,
        instrumentId: item.id,
        segment: item.segment || selectedCategory
      });
    }
    onClose();
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
                onPress={() => {
                  setSelectedCategory(category);
                  setSearchQuery(''); // Clear search when switching category
                }}
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
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {results.length > 0 ? (
                  results.map((item) => (
                    <TouchableOpacity 
                      key={item.id || item.symbol} 
                      style={styles.resultCard} 
                      onPress={() => handleSelect(item)}
                    >
                      <View style={styles.resultLeft}>
                        <Text style={styles.resultSymbol}>{item.symbol}</Text>
                        <Text style={styles.resultVolume}>Vol {formatVolume(item.volume)}</Text>
                      </View>
                      <View style={styles.resultRight}>
                        <Text style={styles.resultPrice}>
                          {(item.lastPrice || item.price || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        </Text>
                        <Text style={[
                          styles.resultChange, 
                          (item.changePercent || 0) >= 0 ? styles.positiveChange : styles.negativeChange
                        ]}>
                          ${Math.abs((item.lastPrice || item.price || 0) * (item.changePercent || 0) / 100).toFixed(2)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noResultsText}>No instruments found</Text>
                )}
              </ScrollView>
            )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '85%',
    height: '80%',
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
    minHeight: 50,
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
    justifyContent: 'center',
    height: 36,
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
  noResultsText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});
