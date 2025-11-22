import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function TwoFactorAuthScreen({ navigation }) {
  const [code, setCode] = useState('');

  const copyToClipboard = () => {
    // Copy functionality would go here
  };

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
        <Text style={styles.headerTitle}>Two Factor Authentication</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color={colors.textSecondary} />
          </View>
        </View>

        {/* Key Section */}
        <View style={styles.keySection}>
          <Text style={styles.keyLabel}>Key</Text>
          <View style={styles.keyContainer}>
            <Text style={styles.keyText}>BKLAHSG2727HGAYWE8</Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={copyToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Code Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Enter code to enable</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter code"
              placeholderTextColor={colors.textSecondary}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
            />
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity 
          style={styles.updateButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
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
  qrSection: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keySection: {
    marginBottom: 24,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  keyContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  keyText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  copyButton: {
    padding: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  updateButton: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  updateButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
