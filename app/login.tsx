import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('doxoje4562@fergetic.com');
  const [password, setPassword] = useState('12345678');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, resendConfirmation } = useAuth();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t.errors.error, t.auth.fillAllFields);
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      // Check if error is about email not being confirmed
      if (error.message && error.message.includes('verify your email')) {
        // Store password temporarily for auto-login after confirmation
        try {
          await AsyncStorage.setItem('pending_signup_password', password);
        } catch (storageError) {
          console.error('Error storing password:', storageError);
        }
        
        // Navigate to confirmation code screen
        Alert.alert(
          t.auth.emailVerificationRequired,
          t.auth.emailVerificationMessage,
          [
            {
              text: t.common.cancel,
              style: 'cancel',
            },
            {
              text: t.auth.sendCode,
              onPress: async () => {
                // Resend confirmation code
                const resendResult = await resendConfirmation(email);
                if (resendResult.error) {
                  Alert.alert(t.errors.error, resendResult.error.message || t.errors.failedToLoad);
                } else {
                  // Navigate to confirmation code screen
                  router.push(`/confirm-code?email=${encodeURIComponent(email)}` as any);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(t.auth.loginFailed, error.message);
        console.log('Login failed:', error.message);
      }
    } else {
      console.log('Login successful, auth state will update automatically');
      console.log('Login successful');
    }
  };

  const navigateToSignup = () => {
    router.push('/signup');
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      Alert.alert(t.errors.error, t.auth.enterEmailFirst);
      return;
    }

    try {
      const resendResult = await resendConfirmation(email);
      if (resendResult.error) {
        Alert.alert(t.errors.error, resendResult.error.message || t.errors.failedToLoad);
      } else {
        Alert.alert(
          t.auth.codeSent,
          t.auth.codeSentMessage,
          [
            {
              text: t.common.ok,
              onPress: () => {
                router.push(`/confirm-code?email=${encodeURIComponent(email)}` as any);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Resend confirmation error:', error);
      Alert.alert(t.errors.error, t.errors.failedToLoad);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image 
            source={require('@/assets/images/splash.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>{t.auth.signIn}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t.auth.email}
              placeholderTextColor={colors.text.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={colors.text.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t.auth.password}
              placeholderTextColor={colors.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons 
                name={showPassword ? "visibility" : "visibility-off"} 
                size={20} 
                color={colors.text.muted} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? t.common.loading : t.auth.signIn}
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>{t.auth.dontHaveAccount} </Text>
            <TouchableOpacity onPress={navigateToSignup}>
              <Text style={styles.signupLink}>{t.auth.signup}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: 12,
    color: colors.text.muted,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'Inter-Regular',
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
    ...shadows.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'Inter-SemiBold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  signupLink: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  confirmLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  confirmLinkText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});