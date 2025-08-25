import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { phase3 } from '../../lib/phase3Integration';

export default function Phase3Index() {
  const router = useRouter();

  // Initialize Phase 3 systems when the index page loads
  useEffect(() => {
    const initialize = async () => {
      try {
        await phase3.initialize();
        console.log('Phase 3 systems initialized');
      } catch (error) {
        console.error('Failed to initialize Phase 3:', error);
      }
    };

    initialize();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Phase 3 Security</Text>
      <Text style={styles.subtitle}>
        Advanced Threat Intelligence, Network Security, and Privacy
      </Text>

      <View style={styles.featureContainer}>
        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => {
            // Need to configure navigation properly
            // For now, let's just use an alert
            alert('This would navigate to the dashboard');
          }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="shield" size={32} color="#2196F3" />
          </View>
          <Text style={styles.featureTitle}>Security Dashboard</Text>
          <Text style={styles.featureDescription}>
            Complete overview of your security status and protections
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => {
            // Need to configure navigation properly
            // For now, let's just use an alert
            alert('This would navigate to the intelligence settings');
          }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="settings" size={32} color="#4CAF50" />
          </View>
          <Text style={styles.featureTitle}>Intelligence Settings</Text>
          <Text style={styles.featureDescription}>
            Configure advanced security and intelligence features
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => {
            // Need to configure navigation properly
            // For now, let's just use an alert
            alert('This would navigate to the demo features');
          }}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="rocket" size={32} color="#FF9800" />
          </View>
          <Text style={styles.featureTitle}>Demo Features</Text>
          <Text style={styles.featureDescription}>
            Try out blank screen stealth and PIN protection
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.featureCard, styles.featureScan]}
          onPress={async () => {
            const results = await phase3.securityScan();
            if (results.securityScore < 70) {
              alert(
                'Security issues detected. This would navigate to the dashboard.'
              );
            } else {
              alert('Security scan complete. Your system is secure!');
            }
          }}
        >
          <View style={styles.scanIconContainer}>
            <Ionicons name="scan-circle-outline" size={40} color="#fff" />
          </View>
          <Text style={styles.scanTitle}>Quick Security Scan</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
        <Text style={styles.backButtonText}>Back to Security</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  featureContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featureScan: {
    backgroundColor: '#2196F3',
    width: '100%',
    alignItems: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  scanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
