import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import UnregisteredNavbar from '../components/UnregisteredNavbar';

export default function PositionScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Position</Text>
        
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <Text style={styles.illustrationEmoji}>📋</Text>
        </View>
        
        <Text style={styles.message}>Log In to Manage Your orders</Text>
        
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.signInButtonText}>Sign in/ Sign up</Text>
        </TouchableOpacity>
      </View>

      <UnregisteredNavbar navigation={navigation} activeScreen="Position" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    position: 'absolute',
    top: 60,
    left: 20,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  illustrationContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.greenOpacity,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  illustrationEmoji: {
    fontSize: 60,
  },
  message: {
    color: colors.textPrimary,
    fontSize: 18,
    marginBottom: 32,
    textAlign: 'center',
  },
  signInButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  signInButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
