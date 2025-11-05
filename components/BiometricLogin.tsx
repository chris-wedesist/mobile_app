import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Platform, TouchableOpacity, ScrollView, TextInput, Alert, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { colors, shadows, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

interface BiometricLoginProps {
  visible: boolean;
  onSuccess: () => void;
  onFail?: () => void;
}

export default function BiometricLogin({ visible, onSuccess, onFail }: BiometricLoginProps) {
  const { signIn, user, userProfile } = useAuth();
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'biometric' | 'password'>('biometric');
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Get user email from auth context
  const userEmail = user?.email || userProfile?.email || '';

  useEffect(() => {
    if (visible) {
      const initialize = async () => {
        await checkBiometricType();
        await checkBiometricAvailability();
        setError(null);
        // Auto-trigger biometric if available
        const hasHardware = Platform.OS !== 'web' && await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = Platform.OS !== 'web' && await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          authenticate();
        }
      };
      initialize();
    } else {
      setError(null);
      setIsAuthenticating(false);
      setLoginMethod('biometric');
      setPassword('');
    }
  }, [visible]);

  const checkBiometricAvailability = async () => {
    try {
      if (Platform.OS === 'web') {
        setBiometricAvailable(false);
        return;
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setBiometricAvailable(false);
    }
  };

  const checkBiometricType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType(LocalAuthentication.AuthenticationType.FINGERPRINT);
      }
    } catch (error) {
      console.error('Error checking biometric type:', error);
    }
  };

  const authenticate = async () => {
    if (Platform.OS === 'web') {
      // Skip biometric on web
      onSuccess();
      return;
    }

    try {
      setIsAuthenticating(true);
      setError(null);

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setLoginMethod('password');
        setIsAuthenticating(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock DESIST!',
        fallbackLabel: 'Enter Passcode',
      });
      
      if (result.success) {
        onSuccess();
      } else {
        // Don't show error if user cancelled - check for cancel-related errors
        const cancelErrors = ['app_cancel', 'system_cancel', 'user_cancel'];
        const isCancelled = result.error && cancelErrors.includes(result.error as string);
        
        if (isCancelled) {
          // User cancelled - don't show error, just reset state
          setError(null);
          setIsAuthenticating(false);
          return;
        }
        // Only show error for actual failures, not cancellations
        if (result.error && !cancelErrors.includes(result.error as string)) {
          setError('Authentication failed');
          // Switch to password login on failure
          setLoginMethod('password');
        }
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      // Don't show error if it's a cancellation
      if (error?.code !== 'ERR_USER_CANCEL' && error?.message !== 'UserCancel') {
        setError('Authentication failed');
        setLoginMethod('password');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (!userEmail) {
      setError('Unable to find your email. Please try again.');
      return;
    }

    setPasswordLoading(true);
    setError(null);

    const { error: signInError } = await signIn(userEmail, password);
    setPasswordLoading(false);

    if (signInError) {
      setError(signInError.message || 'Login failed');
    } else {
      onSuccess();
    }
  };

  const getBiometricIcon = () => {
    if (biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
      return <MaterialIcons name="face" size={64} color={colors.accent} />;
    }
    return <MaterialIcons name="fingerprint" size={64} color={colors.accent} />;
  };

  const getBiometricName = () => {
    if (biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) {
      return 'Face ID';
    }
    return 'Touch ID';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      hardwareAccelerated
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              {loginMethod === 'biometric' ? getBiometricIcon() : <MaterialIcons name="lock" size={64} color={colors.accent} />}
            </View>
            
            <Text style={styles.title}>Unlock DESIST!</Text>
            <Text style={styles.subtitle}>
              {loginMethod === 'biometric' 
                ? (isAuthenticating ? 'Authenticating...' : `Use ${getBiometricName()} to unlock`)
                : 'Enter your credentials to unlock'}
            </Text>

            {/* Method Toggle */}
            <View style={styles.methodToggle}>
              <TouchableOpacity
                style={[styles.methodButton, loginMethod === 'biometric' && styles.methodButtonActive]}
                onPress={() => setLoginMethod('biometric')}
                disabled={!biometricAvailable}
              >
                <MaterialIcons 
                  name={biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION ? "face" : "fingerprint"} 
                  size={20} 
                  color={loginMethod === 'biometric' ? colors.text.primary : colors.text.muted} 
                />
                <Text style={[styles.methodButtonText, loginMethod === 'biometric' && styles.methodButtonTextActive]}>
                  {getBiometricName()}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.methodButton, loginMethod === 'password' && styles.methodButtonActive]}
                onPress={() => setLoginMethod('password')}
              >
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={loginMethod === 'password' ? colors.text.primary : colors.text.muted} 
                />
                <Text style={[styles.methodButtonText, loginMethod === 'password' && styles.methodButtonTextActive]}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Biometric Login Section */}
            {loginMethod === 'biometric' && (
              <View style={styles.form}>
                <View style={styles.infoContainer}>
                  <View style={styles.infoItem}>
                    <MaterialIcons name="security" size={20} color={colors.accent} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoDescription}>
                        Protect your sensitive data with biometric authentication
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <MaterialIcons name="lock" size={20} color={colors.accent} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoDescription}>
                        Your app remains locked until you authenticate
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <MaterialIcons name="shield" size={20} color={colors.accent} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoDescription}>
                        Only you can access your account and personal information
                      </Text>
                    </View>
                  </View>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={20} color={colors.status.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={authenticate}
                  disabled={isAuthenticating}
                >
                  <MaterialIcons name="refresh" size={20} color={colors.text.primary} />
                  <Text style={styles.retryButtonText}>Unlock</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Password Login Section */}
            {loginMethod === 'password' && (
              <>
                <View style={styles.form}>
                  {/* Email Display (Read-only) */}
                  <View style={styles.emailDisplayContainer}>
                    <View style={styles.emailDisplay}>
                      <Text style={styles.emailLabel}>You're logging in with your email:</Text>
                      <Text style={styles.emailValue}>{userEmail || 'Loading...'}</Text>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <MaterialIcons name="lock" size={20} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor={colors.text.muted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!passwordLoading}
                      onSubmitEditing={handlePasswordLogin}
                      autoFocus
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

                  {error && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error-outline" size={20} color={colors.status.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.loginButton, passwordLoading && styles.loginButtonDisabled]}
                    onPress={handlePasswordLogin}
                    disabled={passwordLoading || !password}
                  >
                    <Text style={styles.loginButtonText}>
                      {passwordLoading ? 'Signing In...' : 'Unlock'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  methodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 4,
    marginBottom: 24,
    gap: 4,
    width: '100%',
    maxWidth: 400,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    gap: 8,
  },
  methodButtonActive: {
    backgroundColor: colors.accent,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.muted,
    fontFamily: 'Inter-SemiBold',
  },
  methodButtonTextActive: {
    color: colors.text.primary,
  },
  infoContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 32,
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: radius.lg,
    gap: 16,
    ...shadows.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  infoDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  form: {
    width: '100%',
    maxWidth: 400,
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.error}20`,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 24,
    gap: 8,
    maxWidth: 400,
    width: '100%',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    gap: 8,
    ...shadows.sm,
  },
  retryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loginButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
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
  emailDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.7,
    ...shadows.sm,
  },
  emailDisplay: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  emailValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'Inter-Medium',
  },
});

