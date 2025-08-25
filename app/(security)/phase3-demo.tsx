import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlankScreenStealthComponent } from '../../components/stealth/BlankScreenStealth';
import { useVideoAccessAuth } from '../../components/security/VideoAccessPin';
import { 
  activateBlankScreen, 
  isBlankScreenActive,
  enableBlankScreenStealth,
} from '../../lib/stealth';
import { setNewRecordingDetected } from '../../lib/security/biometricAuth';

export default function Phase3DemoScreen() {
  const [isBlankActive, setIsBlankActive] = useState(false);
  const [videoAccessEnabled, setVideoAccessEnabled] = useState(false);

  const { requestVideoAccess, VideoAccessPinModal } = useVideoAccessAuth();

  useEffect(() => {
    // Initialize features
    enableBlankScreenStealth();
    
    // Check blank screen status
    const interval = setInterval(() => {
      setIsBlankActive(isBlankScreenActive());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleActivateBlankScreen = async () => {
    Alert.alert(
      'Activate Blank Screen',
      'Your screen will appear completely off. Use triple tap or long press (3 seconds) to deactivate.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            const success = await activateBlankScreen();
            if (!success) {
              Alert.alert('Error', 'Failed to activate blank screen mode.');
            }
          },
        },
      ]
    );
  };

  const handleVideoAccess = () => {
    requestVideoAccess(() => {
      Alert.alert(
        'Video Access Granted',
        'You now have access to video recordings. This simulates accessing video files.',
        [{ text: 'OK' }]
      );
    });
  };

  const simulateNewRecording = async () => {
    await setNewRecordingDetected(true);
    Alert.alert(
      'New Recording Detected',
      'A new recording has been simulated. The next video access will require PIN authentication.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <BlankScreenStealthComponent />
      <VideoAccessPinModal />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Ionicons name="shield-checkmark" size={48} color="#007AFF" />
          <Text style={styles.title}>Phase 3 Demo</Text>
          <Text style={styles.subtitle}>Advanced Stealth Features</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={24} color="#333" />
            <Text style={styles.sectionTitle}>Blank Screen Stealth</Text>
          </View>
          
          <Text style={styles.description}>
            This feature makes your device appear completely off while the app continues running in stealth mode.
          </Text>
          
          <View style={styles.featureBox}>
            <View style={styles.featureRow}>
              <Ionicons name="eye-off" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Completely black screen</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="hand-left" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Triple tap to deactivate</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="time" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Long press (3s) alternative</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.demoButton,
              isBlankActive ? styles.demoButtonDisabled : styles.demoButtonActive
            ]}
            onPress={handleActivateBlankScreen}
            disabled={isBlankActive}
          >
            <Ionicons 
              name={isBlankActive ? "checkmark-circle" : "power"} 
              size={20} 
              color={isBlankActive ? "#28a745" : "#fff"} 
            />
            <Text style={[
              styles.demoButtonText,
              isBlankActive ? styles.demoButtonTextDisabled : {}
            ]}>
              {isBlankActive ? 'Blank Screen Active' : 'Try Blank Screen'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="videocam" size={24} color="#333" />
            <Text style={styles.sectionTitle}>Video Access PIN</Text>
          </View>
          
          <Text style={styles.description}>
            Enhanced security requires PIN authentication when accessing videos after new recordings are detected.
          </Text>
          
          <View style={styles.featureBox}>
            <View style={styles.featureRow}>
              <Ionicons name="shield" size={20} color="#007AFF" />
              <Text style={styles.featureText}>PIN protection for videos</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="recording" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Triggered by new recordings</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons name="key" size={20} color="#007AFF" />
              <Text style={styles.featureText}>Secure PIN storage</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleVideoAccess}
          >
            <Ionicons name="play-circle" size={20} color="#fff" />
            <Text style={styles.demoButtonText}>Test Video Access</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={simulateNewRecording}
          >
            <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Simulate New Recording</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#6c757d" />
            <Text style={styles.infoTitle}>How to Use</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>1</Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Blank Screen:</Text> Tap "Try Blank Screen" above. Screen will go completely black. Triple tap or long press to return.
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoNumber}>2</Text>
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Video PIN:</Text> First access will prompt you to set a PIN. After simulating a new recording, PIN will be required again.
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            These Phase 3 features provide maximum stealth and security for sensitive situations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  featureBox: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginBottom: 10,
  },
  demoButtonActive: {
    backgroundColor: '#007AFF',
  },
  demoButtonDisabled: {
    backgroundColor: '#e8f5e8',
    borderWidth: 1,
    borderColor: '#28a745',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  demoButtonTextDisabled: {
    color: '#28a745',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 10,
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 15,
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#333',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  infoNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    backgroundColor: '#e7f3ff',
    width: 28,
    height: 28,
    textAlign: 'center',
    lineHeight: 28,
    borderRadius: 14,
    marginRight: 15,
    marginTop: 2,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    flex: 1,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
