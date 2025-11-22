import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function ProfileInfoScreen({ navigation }) {
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
        <Text style={styles.headerTitle}>Profile info</Text>
        <TouchableOpacity style={styles.notificationIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage} />
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>Amir Shamzad</Text>
            <Text style={styles.detailLabel}>Full name</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>#16375607</Text>
            <Text style={styles.detailLabel}>Client ID</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>amir@gmail.com</Text>
            <Text style={styles.detailLabel}>Email Address</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>+13234537596</Text>
            <Text style={styles.detailLabel}>Phone number</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>Peter Simon</Text>
            <Text style={styles.detailLabel}>Linked Manager</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit profile</Text>
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
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5C8FDB',
  },
  detailsSection: {
    marginBottom: 32,
  },
  detailCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  editButton: {
    backgroundColor: colors.green,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  editButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});
