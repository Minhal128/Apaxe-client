import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useOAuth, useAuth } from '@clerk/clerk-expo';
import { useAppAuth } from '../contexts/AuthContext';
import { colors } from '../constants/colors';

// Warm up the browser for faster OAuth
const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Required for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen({ navigation }) {
  // Warm up browser on mount
  useWarmUpBrowser();
  
  const clerkAuth = useAuth();
  const isSignedIn = clerkAuth?.isSignedIn || false;
  const { register } = useAppAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigate away if already signed in (Google OAuth)
  useEffect(() => {
    if (isSignedIn) {
      console.log('User is signed in via Google OAuth!');
      setLoading(false);
    }
  }, [isSignedIn]);

  const onGoogleLogin = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Starting Google OAuth flow for sign up...');
      
      // Dismiss any existing browser sessions first
      try {
        await WebBrowser.dismissBrowser();
      } catch (e) {
        // Ignore dismiss errors
      }

      // Get the redirect URL using the app scheme
      const redirectUrl = Linking.createURL('oauth-callback');
      console.log('Redirect URL:', redirectUrl);

      // Start OAuth flow with explicit redirect URL
      const result = await startOAuthFlow({
        redirectUrl,
      });
      
      console.log('OAuth flow result:', {
        createdSessionId: result.createdSessionId,
        hasSignIn: !!result.signIn,
        hasSignUp: !!result.signUp,
        signInStatus: result.signIn?.status,
        signUpStatus: result.signUp?.status,
        missingFields: result.signUp?.missingFields,
      });

      const { createdSessionId, signIn, signUp: oauthSignUp, setActive: oauthSetActive } = result;

      // If we have a created session, activate it
      if (createdSessionId) {
        console.log('Setting active session:', createdSessionId);
        await oauthSetActive({ session: createdSessionId });
        console.log('✅ GOOGLE SIGN UP SUCCESSFUL! Session ID:', createdSessionId);
        Alert.alert('Success', 'Successfully signed up with Google!');
        return;
      }
      
      if (oauthSignUp?.createdSessionId) {
        console.log('Setting session from signup:', oauthSignUp.createdSessionId);
        await oauthSetActive({ session: oauthSignUp.createdSessionId });
        console.log('✅ GOOGLE SIGNUP SUCCESSFUL! Session ID:', oauthSignUp.createdSessionId);
        Alert.alert('Success', 'Successfully signed up with Google!');
        return;
      }
      
      if (signIn?.createdSessionId) {
        console.log('Setting session from signin:', signIn.createdSessionId);
        await oauthSetActive({ session: signIn.createdSessionId });
        console.log('✅ GOOGLE SIGNIN SUCCESSFUL! Session ID:', signIn.createdSessionId);
        Alert.alert('Success', 'Successfully signed in with Google!');
        return;
      }
      
      // Handle missing requirements - auto-fill and complete signup
      if (oauthSignUp?.status === 'missing_requirements') {
        console.log('Sign up missing requirements:', oauthSignUp.missingFields);
        console.log('Email from Google:', oauthSignUp.emailAddress);
        
        const missingFields = oauthSignUp.missingFields || [];
        const updateData = {};
        
        // Auto-generate username if required
        if (missingFields.includes('username')) {
          const emailPrefix = oauthSignUp.emailAddress?.split('@')[0] || 'user';
          updateData.username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '') + Math.floor(Math.random() * 1000);
        }
        
        // Add any other missing fields with defaults
        if (missingFields.includes('first_name')) {
          updateData.firstName = oauthSignUp.firstName || oauthSignUp.emailAddress?.split('@')[0] || 'User';
        }
        if (missingFields.includes('last_name')) {
          updateData.lastName = oauthSignUp.lastName || '';
        }
        
        console.log('Updating signup with:', updateData);
        
        try {
          // Update the SignUp object with missing fields
          if (Object.keys(updateData).length > 0) {
            const updatedSignUp = await oauthSignUp.update(updateData);
            console.log('Updated signUp status:', updatedSignUp.status, 'sessionId:', updatedSignUp.createdSessionId);
            
            // Check if signup is now complete
            if (updatedSignUp.status === 'complete' && updatedSignUp.createdSessionId) {
              await oauthSetActive({ session: updatedSignUp.createdSessionId });
              console.log('Signup completed after auto-fill!');
              return;
            }
          }
          
          // If still not complete, reload and check
          const reloaded = await oauthSignUp.reload();
          console.log('Reloaded status:', reloaded.status, 'sessionId:', reloaded.createdSessionId);
          
          if (reloaded.status === 'complete' && reloaded.createdSessionId) {
            await oauthSetActive({ session: reloaded.createdSessionId });
            console.log('Google signup successful after reload!');
            return;
          }
          
          // Still missing something
          console.log('Still missing requirements:', reloaded.missingFields);
          Alert.alert(
            'Additional Info Needed',
            `Please provide: ${reloaded.missingFields?.join(', ') || 'additional information'}`
          );
        } catch (updateErr) {
          console.error('Update error:', updateErr);
          if (oauthSignUp.createdSessionId) {
            await oauthSetActive({ session: oauthSignUp.createdSessionId });
            return;
          }
          throw updateErr;
        }
      } else {
        console.log('OAuth flow completed but no session created');
        console.log('signIn status:', signIn?.status);
        console.log('signUp status:', oauthSignUp?.status);
      }
    } catch (err) {
      console.error('Google sign up error:', err);
      console.error('Error code:', err?.errors?.[0]?.code);
      console.error('Error message:', err?.message);
      
      // Don't show alert for user cancellation or timeout during dismissal
      if (err?.message?.includes('cancel') || 
          err?.message?.includes('dismiss') ||
          err?.message?.includes('timeout') && loading === false) {
        console.log('User cancelled or browser was dismissed');
        return;
      }
      
      // Check if it's a timeout but user might have succeeded
      if (err?.message?.includes('timeout')) {
        // Wait a moment and check if signed in
        setTimeout(() => {
          if (!isSignedIn) {
            Alert.alert(
              'Sign Up Timeout',
              'The sign up took too long. Please try again.'
            );
          }
        }, 1000);
        return;
      }
      
      Alert.alert(
        'Sign Up Error',
        err.errors?.[0]?.longMessage || err.message || 'Failed to sign up with Google'
      );
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow, isSignedIn]);

  const onAppleLogin = () => {
    Alert.alert('Coming Soon', 'Apple sign up will be available soon');
  };

  const onFacebookLogin = () => {
    Alert.alert('Coming Soon', 'Facebook sign up will be available soon');
  };

  // Use backend API for email/password registration
  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password validation
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      const trimmedEmail = email.trim().toLowerCase();
      console.log('Starting backend signup with:', { email: trimmedEmail, firstName: firstName.trim(), lastName: lastName.trim() });
      
      // Use AuthContext's register method
      const response = await register({
        email: trimmedEmail,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });

      console.log('Backend signup response:', response);

      if (response.success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Please login to continue.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Sign Up Failed', response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Sign Up Error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      
      if (errorMessage.includes('exists') || errorMessage.includes('already')) {
        Alert.alert(
          'Account Exists', 
          'An account with this email already exists. Please login instead.'
        );
      } else if (errorMessage.includes('password')) {
        Alert.alert(
          'Password Error', 
          errorMessage
        );
      } else {
        Alert.alert('Sign Up Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Hello there,</Text>
        <Text style={styles.title}>Welcome to Apex trading</Text>
        <Text style={styles.subtitle}>Sign up to start trading</Text>

        {/* First Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor={colors.textSecondary}
            value={firstName}
            onChangeText={setFirstName}
          />
        </View>

        {/* Last Name Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            placeholderTextColor={colors.textSecondary}
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password (min 8 chars)"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, loading && { opacity: 0.7 }]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.continueButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <Text style={styles.divider}>Or sign up with</Text>

        {/* Social Login */}
        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton} onPress={onGoogleLogin} disabled={loading}>
            <Ionicons name="logo-google" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={onAppleLogin} disabled={loading}>
            <Ionicons name="logo-apple" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={onFacebookLogin} disabled={loading}>
            <Ionicons name="logo-facebook" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.signInLink}>Log in</Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <View style={styles.termsContainer}>
          <Text style={styles.termsText}>By signing up or continuing, you agree to our </Text>
          <TouchableOpacity>
            <Text style={styles.termsLink}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.termsText}> and acknowledge that you have read our </Text>
          <TouchableOpacity>
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingTop: 50,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  continueButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  signInLink: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
});
