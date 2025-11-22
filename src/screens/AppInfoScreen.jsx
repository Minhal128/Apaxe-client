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

export default function AppInfoScreen({ navigation }) {
  const menuItems = [
    {
      id: 1,
      label: 'Terms and conditions',
      icon: 'document-text',
      iconBg: '#FF9800',
      screen: 'TermsAndConditions',
    },
    {
      id: 2,
      label: 'App Version',
      value: '1.0.0',
      icon: 'information-circle',
      iconBg: '#2196F3',
      screen: null,
    },
    {
      id: 3,
      label: 'Privacy Policy',
      icon: 'shield',
      iconBg: '#4CAF50',
      screen: 'PrivacyPolicy',
    },
    {
      id: 4,
      label: 'Rate Us',
      icon: 'star',
      iconBg: '#FFC107',
      screen: 'RateUs',
    },
    {
      id: 5,
      label: 'Customer Support',
      icon: 'chatbubbles',
      iconBg: '#9C27B0',
      screen: 'CustomerSupport',
    },
  ];

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
        <Text style={styles.headerTitle}>App Info</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.screen && navigation.navigate(item.screen)}
              disabled={!item.screen}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color={colors.textPrimary} />
                </View>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
              </View>
              {item.value ? (
                <Text style={styles.versionText}>{item.value}</Text>
              ) : (
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
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
    paddingBottom: 20,
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
  notificationIcon: {
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
  menuSection: {
    marginTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
