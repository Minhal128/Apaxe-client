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
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Required for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  // Warm up browser on mount
  useWarmUpBrowser();
  
  const clerkAuth = useAuth();
  const isSignedIn = clerkAuth?.isSignedIn || false;
  const { login } = useAppAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      console.log('Starting Google OAuth flow...');
      
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

      const { createdSessionId, signIn: oauthSignIn, signUp, setActive: oauthSetActive } = result;

      // If we have a created session, activate it
      if (createdSessionId) {
        console.log('Setting active session:', createdSessionId);
        await oauthSetActive({ session: createdSessionId });
        console.log('✅ GOOGLE LOGIN SUCCESSFUL! Session ID:', createdSessionId);
        Alert.alert('Success', 'Successfully signed in with Google!');
        return;
      }
      
      if (signUp?.createdSessionId) {
        console.log('Setting session from signup:', signUp.createdSessionId);
        await oauthSetActive({ session: signUp.createdSessionId });
        console.log('✅ GOOGLE SIGNUP SUCCESSFUL! Session ID:', signUp.createdSessionId);
        Alert.alert('Success', 'Successfully signed up with Google!');
        return;
      }
      
      if (oauthSignIn?.createdSessionId) {
        console.log('Setting session from signin:', oauthSignIn.createdSessionId);
        await oauthSetActive({ session: oauthSignIn.createdSessionId });
        console.log('✅ GOOGLE SIGNIN SUCCESSFUL! Session ID:', oauthSignIn.createdSessionId);
        Alert.alert('Success', 'Successfully signed in with Google!');
        return;
      }
      
      // Handle missing requirements - auto-fill and complete signup
      if (signUp?.status === 'missing_requirements') {
        console.log('Sign up missing requirements:', signUp.missingFields);
        console.log('Email from Google:', signUp.emailAddress);
        
        const missingFields = signUp.missingFields || [];
        const updateData = {};
        
        // Auto-generate username if required
        if (missingFields.includes('username')) {
          const emailPrefix = signUp.emailAddress?.split('@')[0] || 'user';
          updateData.username = emailPrefix.replace(/[^a-zA-Z0-9_]/g, '') + Math.floor(Math.random() * 1000);
        }
        
        // Add any other missing fields with defaults
        if (missingFields.includes('first_name')) {
          updateData.firstName = signUp.firstName || signUp.emailAddress?.split('@')[0] || 'User';
        }
        if (missingFields.includes('last_name')) {
          updateData.lastName = signUp.lastName || '';
        }
        
        console.log('Updating signup with:', updateData);
        
        try {
          // Update the SignUp object with missing fields
          if (Object.keys(updateData).length > 0) {
            const updatedSignUp = await signUp.update(updateData);
            console.log('Updated signUp status:', updatedSignUp.status, 'sessionId:', updatedSignUp.createdSessionId);
            
            // Check if signup is now complete
            if (updatedSignUp.status === 'complete' && updatedSignUp.createdSessionId) {
              await oauthSetActive({ session: updatedSignUp.createdSessionId });
              console.log('Signup completed after auto-fill!');
              return;
            }
          }
          
          // If still not complete, reload and check
          const reloaded = await signUp.reload();
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
          // Try to see if we can still complete
          if (signUp.createdSessionId) {
            await oauthSetActive({ session: signUp.createdSessionId });
            return;
          }
          throw updateErr;
        }
      } else {
        console.log('OAuth flow completed but no session created');
        console.log('signIn status:', oauthSignIn?.status);
        console.log('signUp status:', signUp?.status);
      }
    } catch (err) {
      console.error('Google login error:', err);
      console.error('Error code:', err?.errors?.[0]?.code);
      console.error('Error message:', err?.message);
      
      // Don't show alert for user cancellation
      if (err?.message?.includes('cancel') || 
          err?.message?.includes('dismiss')) {
        console.log('User cancelled or browser was dismissed');
        return;
      }
      
      Alert.alert(
        'Login Error',
        err.errors?.[0]?.longMessage || err.message || 'Failed to login with Google'
      );
    } finally {
      setLoading(false);
    }
  }, [startOAuthFlow]);

  const onFacebookLogin = () => {
    Alert.alert('Coming Soon', 'Facebook login will be available soon');
  };

  const onAppleLogin = () => {
    Alert.alert('Coming Soon', 'Apple login will be available soon');
  };

  // Use backend API for email/password login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const trimmedEmail = email.trim().toLowerCase();
      console.log('Attempting backend login with email:', trimmedEmail);
      
      // Use AuthContext's login method which handles token storage and state update
      const response = await login(trimmedEmail, password);
      
      console.log('Backend login response:', response);

      if (response.success) {
        console.log('Login successful!');
        // The AuthContext will update isAuthenticated, which triggers navigation automatically
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      if (errorMessage.includes('not found') || errorMessage.includes('No user')) {
        Alert.alert(
          'Account Not Found', 
          'No account exists with this email. Please sign up first.'
        );
      } else if (errorMessage.includes('password') || errorMessage.includes('Invalid credentials')) {
        Alert.alert(
          'Incorrect Password', 
          'The password you entered is incorrect. Please try again.'
        );
      } else {
        Alert.alert('Login Failed', errorMessage);
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
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to start trading</Text>

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
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <Text style={styles.divider}>Or sign in with</Text>

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

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signUpLink}>Sign up</Text>
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
    marginBottom: 20,
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
  passwordContainer: {
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  forgotPassword: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 24,
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 32,
  },
  signUpText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  signUpLink: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
