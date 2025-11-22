import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import HomeScreenLoggedIn from '../screens/HomeScreenLoggedIn';
import ChartScreen from '../screens/ChartScreen';
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
        component={TradeScreen}
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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="InitialHome"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen 
          name="InitialHome" 
          component={HomeScreen}
        />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Chart" component={ChartScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Alert" component={AlertScreen} />
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
