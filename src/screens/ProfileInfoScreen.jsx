import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import { colors } from '../constants/colors';
import { authService } from '../services';

export default function ProfileInfoScreen({ navigation }) {
  const clerkUserData = useUser();
  const clerkUser = clerkUserData?.user;
  const clerkLoaded = clerkUserData?.isLoaded ?? false;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // First try cached user data from backend login
      const cachedUser = await authService.getUser();
      if (cachedUser) {
        console.log('Using cached user data:', cachedUser);
        setUser(cachedUser);
        setLoading(false);
        return;
      }
      
      // Try to get fresh profile from backend API
      try {
        const userData = await authService.getProfile();
        console.log('Backend profile response:', userData);
        if (userData) {
          setUser(userData);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.log('Backend profile not available:', e.message);
      }
      
      // Fallback to Clerk user data (for Google OAuth users)
      if (clerkUser) {
        console.log('Using Clerk user data for profile:', clerkUser.firstName, clerkUser.lastName);
        setUser({
          id: clerkUser.id,
          firstName: clerkUser.firstName || clerkUser.username || 'User',
          lastName: clerkUser.lastName || '',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          imageUrl: clerkUser.imageUrl,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // On error, try Clerk user
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          firstName: clerkUser.firstName || clerkUser.username || 'User',
          lastName: clerkUser.lastName || '',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          phone: clerkUser.primaryPhoneNumber?.phoneNumber,
          imageUrl: clerkUser.imageUrl,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for Clerk to be loaded before fetching
    if (clerkLoaded) {
      fetchUserProfile();
    }
  }, [clerkLoaded]);
  
  // Update user when Clerk user changes
  useEffect(() => {
    if (clerkUser && !user) {
      fetchUserProfile();
    }
  }, [clerkUser]);

  // Refresh profile data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUserProfile();
    }, [])
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          <View style={styles.profileImage}>
            <Text style={styles.profileInitial}>
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}` 
                : user?.firstName || 'Not set'}
            </Text>
            <Text style={styles.detailLabel}>Full name</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>#{user?.id?.slice(-6) || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Client ID</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>{user?.email || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Email Address</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>{user?.phone || user?.phoneNumber || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Phone number</Text>
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailValue}>{user?.manager?.name || 'Not Assigned'}</Text>
            <Text style={styles.detailLabel}>Linked Manager</Text>
          </View>
        </View>

        {/* Edit Profile Button */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile', { user })}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
