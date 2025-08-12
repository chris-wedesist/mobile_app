import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, shadows, radius } from '../constants/theme';

type AlertStatus = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'sending' | 'sent' | 'error';
};

export default function EmergencyAlertScreen() {
  const [contactName, setContactName] = useState<string>('');
  const [alertStatuses, setAlertStatuses] = useState<AlertStatus[]>([
    {
      id: 'sms',
      title: 'Emergency SMS',
      description: 'Sending alert message',
      icon: <MaterialIcons name="message" size={24} color={colors.accent} />,
      status: 'pending'
    },
    {
      id: 'location',
      title: 'Location Sharing',
      description: 'Sending current location',
      icon: <MaterialIcons name="location-pin" size={24} color={colors.accent} />,
      status: 'pending'
    },
    {
      id: 'notification',
      title: 'Push Notification',
      description: 'Sending emergency notification',
      icon: <MaterialIcons name="notifications" size={24} color={colors.accent} />,
      status: 'pending'
    }
  ]);

  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadContactName();
    startPulseAnimation();
    simulateAlerts();
  }, []);

  const loadContactName = async () => {
    try {
      const name = await AsyncStorage.getItem('emergencyContactName');
      if (name) setContactName(name);
    } catch (error) {
      console.error('Error loading contact name:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const updateAlertStatus = (alertId: string, status: AlertStatus['status']) => {
    setAlertStatuses(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, status } : alert
    ));
  };

  const simulateAlerts = async () => {
    try {
      // Simulate SMS alert
      updateAlertStatus('sms', 'sending');
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateAlertStatus('sms', 'sent');

      // Simulate location sharing
      updateAlertStatus('location', 'sending');
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateAlertStatus('location', 'sent');

      // Simulate push notification
      updateAlertStatus('notification', 'sending');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateAlertStatus('notification', 'sent');

      setIsComplete(true);
    } catch (error) {
      console.error('Error simulating alerts:', error);
      setError('Failed to send some alerts');
    }
  };

  const getStatusColor = (status: AlertStatus['status']) => {
    switch (status) {
      case 'sent':
        return colors.status.success;
      case 'sending':
        return colors.accent;
      case 'error':
        return colors.status.error;
      default:
        return colors.text.muted;
    }
  };

  const handleContinue = () => {
    router.push('/cover-story-activation');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.alertIndicator,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}>
          <MaterialIcons name="message" color={colors.accent} size={32} />
        </Animated.View>
        <Text style={styles.headerText}>Sending Alerts</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.contactCard}>
          <MaterialIcons name="shield" size={24} color={colors.accent} />
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>Emergency Contact</Text>
            <Text style={styles.contactName}>
              {contactName || 'Your emergency contact'}
            </Text>
          </View>
        </View>

        <View style={styles.alertsList}>
          {alertStatuses.map(alert => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIcon}>
                  {alert.icon}
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDescription}>
                    {alert.description}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(alert.status) }
                  ]}
                />
              </View>
              
              <View style={styles.statusBar}>
                <View
                  style={[
                    styles.statusProgress,
                    {
                      width: alert.status === 'sent' ? '100%' : 
                             alert.status === 'sending' ? '60%' : '0%',
                      backgroundColor: getStatusColor(alert.status)
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {isComplete && (
          <View style={styles.completeContainer}>
            <MaterialIcons name="shield" size={48} color={colors.status.success} />
            <Text style={styles.completeTitle}>Alerts Sent</Text>
            <Text style={styles.completeDescription}>
              Your emergency contact has been notified and will receive your location updates
            </Text>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue to Cover Story</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    gap: 15,
  },
  alertIndicator: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 20,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 15,
    ...shadows.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    color: colors.text.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  contactName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  alertsList: {
    gap: 15,
  },
  alertCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    ...shadows.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertDescription: {
    color: colors.text.muted,
    fontSize: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusBar: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.round,
    overflow: 'hidden',
  },
  statusProgress: {
    height: '100%',
    borderRadius: radius.round,
  },
  completeContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  completeTitle: {
    color: colors.status.success,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  completeDescription: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: radius.lg,
    gap: 8,
    ...shadows.sm,
  },
  continueButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});