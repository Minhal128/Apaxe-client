# Apex Trading - React Native Mobile App

A professional cryptocurrency trading mobile application built with React Native and Expo SDK 54.

## Features

- 📱 **Home Screen** - Browse crypto markets with real-time prices and percentage changes
- 📊 **Trading Chart** - View candlestick charts with order book and trading pairs
- 💹 **Trade Screen** - Top gainers, losers, and most active trading pairs
- 💰 **Wallet Screen** - Manage your funds (authentication required)
- 📋 **Position Screen** - Track your open orders and positions
- 🔐 **Authentication Flow**:
  - Login with email/password
  - Sign up with email
  - Social authentication (Google, Apple, Facebook)
  - Password reset with OTP verification
  - Set new password

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Navigation**: React Navigation v7
- **UI Components**: Custom components with native styling
- **Icons**: Expo Vector Icons
- **Theme**: Dark mode with custom color palette

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on device:
   - **Android**: `npm run android`
   - **iOS**: `npm run ios` (requires macOS)
   - **Expo Go**: Scan QR code from the terminal

## Project Structure

```
client/
├── App.jsx                          # Main app entry point
├── src/
│   ├── components/
│   │   └── CreateOrderModal.jsx    # Order creation modal
│   ├── constants/
│   │   ├── colors.jsx              # Color palette
│   │   └── theme.jsx               # Theme configuration
│   ├── navigation/
│   │   └── AppNavigator.jsx        # Navigation setup
│   └── screens/
│       ├── HomeScreen.jsx          # Main home screen
│       ├── ChartScreen.jsx         # Trading chart view
│       ├── TradeScreen.jsx         # Trade listings
│       ├── WalletScreen.jsx        # Wallet management
│       ├── PositionScreen.jsx      # Position tracking
│       ├── LoginScreen.jsx         # User login
│       ├── SignUpScreen.jsx        # User registration
│       ├── ResetPasswordScreen.jsx # Password reset
│       ├── OtpVerificationScreen.jsx # OTP entry
│       └── SetNewPasswordScreen.jsx # New password setup
```

## Color Palette

- **Primary**: #00D68F (Green)
- **Danger**: #FF4757 (Red)
- **Background**: #1A1D2E (Dark Navy)
- **Card Background**: #252838
- **Input Background**: #2F3347
- **Text Primary**: #FFFFFF
- **Text Secondary**: #8F92A1

## Screens Overview

### Unauthenticated Flow
1. **Home Screen** - Market overview with sign-in prompt
2. **Trade Screen** - Browse trading pairs and top movers
3. **Wallet Screen** - Login required to manage funds
4. **Position Screen** - Login required to view positions
5. **Chart Screen** - View charts, requires login to trade

### Authentication Screens
1. **Login** - Email/password or social login
2. **Sign Up** - Create account with email
3. **Reset Password** - Enter email for password reset
4. **OTP Verification** - Enter 6-digit code
5. **Set New Password** - Create new password

## Navigation Structure

```
MainTabs (Bottom Navigation)
├── Home
├── Trade
├── Position
└── Wallet

Stack Navigator
├── MainTabs
├── Chart (Modal)
├── Login (Modal)
├── SignUp (Modal)
├── ResetPassword
├── OtpVerification
└── SetNewPassword
```

## Running with Expo Go

1. Install Expo Go app on your device
2. Run `npm start`
3. Scan QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app

## Development

- **Expo SDK**: 54
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Node**: v14+ recommended

## Notes

- All screens are designed for unauthenticated users
- Authentication is required to access trading features
- Dark theme optimized for OLED displays
- Responsive design for various screen sizes

## License

MIT
