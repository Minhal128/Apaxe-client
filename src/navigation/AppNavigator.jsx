import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import HomeScreenLoggedIn from '../screens/HomeScreenLoggedIn';
// import ChartScreen from '../screens/ChartScreen';
import TradeScreen from '../screens/TradeScreen';
import WalletScreen from '../screens/WalletScreen';
import PositionScreen from '../screens/PositionScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import SetNewPasswordScreen from '../screens/SetNewPasswordScreen';
import NotificationScreen from '../screens/NotificationScreen';
import AlertScreen from '../screens/AlertScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletLoggedIn from '../screens/WalletLoggedIn';
import PositionLoggedIn from '../screens/PositionLoggedIn';
import ProfileLoggedIn from '../screens/ProfileLoggedIn';
import ModifyPositionScreen from '../screens/ModifyPositionScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileInfoScreen from '../screens/ProfileInfoScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import MarketSegmentScreen from '../screens/MarketSegmentScreen';
import DefaultOrderScreen from '../screens/DefaultOrderScreen';
import LanguageScreen from '../screens/LanguageScreen';
import SecurityScreen from '../screens/SecurityScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TwoFactorAuthScreen from '../screens/TwoFactorAuthScreen';
import AppInfoScreen from '../screens/AppInfoScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import CustomerSupportScreen from '../screens/CustomerSupportScreen';
import ThemeModeScreen from '../screens/ThemeModeScreen';
import SessionTimeoutScreen from '../screens/SessionTimeoutScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import RateUsScreen from '../screens/RateUsScreen';
import TradeOriginalScreen from '../screens/TradeOriginalScreen';
import CoinChartScreen from '../screens/CoinChartScreen';
import MarketWatchScreen from '../screens/MarketWatchScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreenLoggedIn}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Home',
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Market"
        component={TradeOriginalScreen}
        initialParams={{ isLoggedIn: true }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
          tabBarLabel: 'Trade',
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen
        name="Position"
        component={PositionScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoaded } = useAppAuth();

  if (!isLoaded) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="InitialHome"
              component={HomeScreen}
            />
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
            />
            <Stack.Screen
              name="OtpVerification"
              component={OtpVerificationScreen}
            />
            <Stack.Screen
              name="SetNewPassword"
              component={SetNewPasswordScreen}
            />
            <Stack.Screen
              name="CoinChart"
              component={CoinChartScreen}
            />
            <Stack.Screen
              name="Chart"
              component={CoinChartScreen}
            />
            <Stack.Screen
              name="TradeOriginal"
              component={TradeOriginalScreen}
            />
            <Stack.Screen
              name="Wallet"
              component={WalletScreen}
            />
            <Stack.Screen
              name="MarketWatch"
              component={MarketWatchScreen}
            />
            <Stack.Screen
              name="Position"
              component={PositionScreen}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
            />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="TradeOriginal" component={TradeOriginalScreen} initialParams={{ isLoggedIn: true }} />
            <Stack.Screen name="Trade" component={TradeOriginalScreen} initialParams={{ isLoggedIn: true }} />
            <Stack.Screen name="CoinChart" component={CoinChartScreen} initialParams={{ isLoggedIn: true }} />
            <Stack.Screen name="Chart" component={CoinChartScreen} initialParams={{ isLoggedIn: true }} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="MarketWatch" component={MarketWatchScreen} initialParams={{ isLoggedIn: true }} />
            <Stack.Screen name="Position" component={PositionScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="WalletLoggedIn" component={WalletLoggedIn} />
            <Stack.Screen name="PositionLoggedIn" component={PositionLoggedIn} />
            <Stack.Screen name="ProfileLoggedIn" component={ProfileLoggedIn} />
            <Stack.Screen name="ModifyPosition" component={ModifyPositionScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="ProfileInfo" component={ProfileInfoScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Preferences" component={PreferencesScreen} />
            <Stack.Screen name="MarketSegment" component={MarketSegmentScreen} />
            <Stack.Screen name="DefaultOrder" component={DefaultOrderScreen} />
            <Stack.Screen name="Language" component={LanguageScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="TwoFactorAuth" component={TwoFactorAuthScreen} />
            <Stack.Screen name="AppInfo" component={AppInfoScreen} />
            <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsScreen} />
            <Stack.Screen name="CustomerSupport" component={CustomerSupportScreen} />
            <Stack.Screen name="ThemeMode" component={ThemeModeScreen} />
            <Stack.Screen name="SessionTimeout" component={SessionTimeoutScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="RateUs" component={RateUsScreen} />
            <Stack.Screen name="Notification" component={NotificationScreen} />
            <Stack.Screen name="Alert" component={AlertScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
