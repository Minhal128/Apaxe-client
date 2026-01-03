import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../constants/colors';
import IntegrationSummary from './IntegrationSummary';
import { 
  instrumentService, 
  userService, 
  segmentService, 
  authService,
  positionService,
  orderService,
  notificationService,
  tradeService,
  watchlistService
} from '../services';

export default function ConnectionTest() {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('test');

  const testEndpoint = async (name, testFn) => {
    try {
      const result = await testFn();
      setResults(prev => ({
        ...prev,
        [name]: { success: true, data: result, error: null }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: { success: false, data: null, error: error.message }
      }));
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setResults({});

    // Test public endpoints (no auth required)
    await testEndpoint('Health Check', () => 
      fetch('http://192.168.1.5:5000/api/v1/health').then(r => r.json())
    );

    await testEndpoint('Segments', () => segmentService.getSegments());
    await testEndpoint('Live Market Data (CRYPTO)', () => instrumentService.getMarketWatch('CRYPTO'));
    await testEndpoint('Live Market Data (ALL)', () => instrumentService.getMarketWatch('ALL'));
    await testEndpoint('Search Instruments (Public)', () => instrumentService.searchInstruments('BTC'));

    // Test auth endpoints (if logged in)
    const isLoggedIn = await authService.isLoggedIn();
    
    if (isLoggedIn) {
      console.log('User is logged in, testing protected endpoints...');
      await testEndpoint('✅ User Profile', () => authService.getProfile());
      await testEndpoint('✅ Dashboard', () => userService.getDashboard());
      await testEndpoint('✅ Positions', () => positionService.getPositions());
      await testEndpoint('✅ Orders', () => orderService.getOrders());
      await testEndpoint('✅ Order History', () => orderService.getOrderHistory());
      await testEndpoint('✅ Notifications', () => notificationService.getNotifications());
      await testEndpoint('✅ Trades', () => tradeService.getTrades());
      await testEndpoint('✅ Watchlists', () => watchlistService.getWatchlists());
    } else {
      // Add info about protected endpoints
      setResults(prev => ({
        ...prev,
        'ℹ️ Protected Endpoints': { 
          success: true, 
          data: 'Login required to test authenticated endpoints', 
          error: null 
        }
      }));
    }

    setTesting(false);
  };

  const getStatusColor = (result) => {
    if (!result) return colors.textSecondary;
    return result.success ? colors.green : colors.red;
  };

  const getStatusText = (result) => {
    if (!result) return 'Not tested';
    return result.success ? 'Connected' : 'Failed';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Backend Integration</Text>
      
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'test' && styles.tabActive]}
          onPress={() => setActiveTab('test')}
        >
          <Text style={[styles.tabText, activeTab === 'test' && styles.tabTextActive]}>
            Connection Test
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Integration Summary
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'test' ? (
        <>
          <TouchableOpacity 
            style={[styles.testButton, testing && styles.testButtonDisabled]} 
            onPress={runAllTests}
            disabled={testing}
          >
            <Text style={styles.testButtonText}>
              {testing ? 'Testing...' : 'Run Connection Tests'}
            </Text>
          </TouchableOpacity>

          <ScrollView style={styles.resultsContainer}>
            {Object.entries(results).map(([name, result]) => (
              <View key={name} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{name}</Text>
                  <Text style={[styles.resultStatus, { color: getStatusColor(result) }]}>
                    {getStatusText(result)}
                  </Text>
                </View>
                
                {result && !result.success && (
                  <Text style={styles.errorText}>{result.error}</Text>
                )}
                
                {result && result.success && result.data && (
                  <Text style={styles.successText} numberOfLines={3}>
                    {typeof result.data === 'object' 
                      ? JSON.stringify(result.data).substring(0, 200) + '...'
                      : String(result.data).substring(0, 200)
                    }
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      ) : (
        <IntegrationSummary />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.green,
  },
  tabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: colors.green,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  testButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: colors.cardBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: colors.red,
    marginTop: 4,
  },
  successText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
});