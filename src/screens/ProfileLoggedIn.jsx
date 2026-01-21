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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo';
import { useAppAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import RegisteredNavbar from '../components/RegisteredNavbar';
import LogoutModal from '../components/LogoutModal';
import ConnectionTest from '../components/ConnectionTest';
import { authService } from '../services';

export default function ProfileLoggedIn({ navigation }) {
  const { logout } = useAppAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  // Get Clerk user for Google OAuth
  const clerkUserData = useUser();
  const clerkUser = clerkUserData?.user;
  const clerkLoaded = clerkUserData?.isLoaded ?? false;
  
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [testVisible, setTestVisible] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clerkLoaded) {
      fetchUser();
    }
  }, [clerkLoaded]);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchUser();
    }, [])
  );

  const fetchUser = async () => {
    try {
      // First try cached user
      let userData = await authService.getUser();
      if (userData) {
        setUser(userData);
        setLoading(false);
        return;
      }
      
      // Then fetch fresh data from API
      try {
        const freshData = await authService.getProfile();
        if (freshData) {
          setUser(freshData);
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
      console.error('Error fetching user:', error);
      // On error, try Clerk user
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          firstName: clerkUser.firstName || clerkUser.username || 'User',
          lastName: clerkUser.lastName || '',
          email: clerkUser.primaryEmailAddress?.emailAddress,
          imageUrl: clerkUser.imageUrl,
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Update when Clerk user changes
  useEffect(() => {
    if (clerkUser && !user) {
      fetchUser();
    }
  }, [clerkUser]);

  const handleLogout = async () => {
    setLogoutVisible(false);
    try {
      // Use AuthContext's logout which handles both backend and Clerk logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.account}</Text>
        <TouchableOpacity style={[styles.notificationIcon, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.avatar}>
            {user?.imageUrl ? (
              <Image 
                source={{ uri: user.imageUrl }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={{ color: colors.textPrimary, fontSize: 24, fontWeight: 'bold' }}>
                  {user?.firstName?.[0] || 'U'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.firstName || user?.email?.split('@')[0] || 'User'} {user?.lastName || ''}
            </Text>
            <Text style={[styles.userId, { color: colors.textSecondary }]}>
              {user?.email || `user #${user?.id?.slice(-6) || '000000'}`}
            </Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={[styles.menuSection, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('ProfileInfo')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{t.profileInformation}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t.profileInfoDesc}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Preferences')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{t.preference}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t.preferenceDesc}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('Security')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{t.security}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t.securityDesc}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => setTestVisible(true)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="wifi-outline" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{t.connectionTest}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t.connectionTestDesc}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('AppInfo')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#3F51B5' }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textPrimary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{t.appInfo}</Text>
                <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{t.appInfoDesc}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => setLogoutVisible(true)}
        >
          <View style={styles.logoutIcon}>
            <Ionicons name="log-out-outline" size={20} color="#FF5252" />
          </View>
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Connection Test Modal */}
      <Modal
        visible={testVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalHeader, { backgroundColor: colors.background }]}>
          <TouchableOpacity onPress={() => setTestVisible(false)}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <ConnectionTest />
      </Modal>

      {/* Logout Modal */}
      <LogoutModal 
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
      />

      {/* Bottom Navbar */}
      <RegisteredNavbar navigation={navigation} activeScreen="ProfileLoggedIn" />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
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
  scrollContent: {
    paddingBottom: 100,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  avatar: {
    marginRight: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5C8FDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
  },
  menuSection: {
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 13,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 82, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5252',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 50,
  },
});
