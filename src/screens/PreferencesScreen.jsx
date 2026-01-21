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
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function PreferencesScreen({ navigation }) {
  const { themeMode, colors } = useTheme();
  const { language } = useLanguage();

  const menuItems = [
    {
      id: 1,
      label: 'Market segment',
      value: 'NSE, MCX, FOREX',
      icon: 'briefcase',
      iconBg: '#FF9800',
      screen: 'MarketSegment',
    },
    {
      id: 2,
      label: 'Default Order type',
      value: 'Market',
      icon: 'swap-horizontal',
      iconBg: '#2196F3',
      screen: 'DefaultOrder',
    },
    {
      id: 3,
      label: 'Theme',
      value: 'Dark',
      icon: 'moon',
      iconBg: '#9C27B0',
      screen: 'ThemeMode',
    },
    {
      id: 4,
      label: 'Language',
      value: language,
      icon: 'language',
      iconBg: '#4CAF50',
      screen: 'Language',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Preferences</Text>
        <TouchableOpacity style={[styles.notificationIcon, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={20} color="#FFFFFF" />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={[styles.menuItemLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                  <Text style={[styles.menuItemValue, { color: colors.textSecondary }]}>{item.value}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
    flex: 1,
    marginLeft: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  menuItemText: {
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuItemValue: {
    fontSize: 14,
  },
});
