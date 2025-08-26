import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { phase3 } from '../../lib/phase3Integration';
import { LinearGradient } from 'expo-linear-gradient';

export default function Phase3DashboardScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [scanResults, setScanResults] = useState<any>(null);

  // Initialize and load security status
  useEffect(() => {
    async function initializePhase3() {
      try {
        // Initialize Phase 3 systems
        await phase3.initialize();

        // Get initial security status
        const status = await phase3.getSecurityStatus();
        setSecurityStatus(status);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Phase 3 dashboard:', error);
        setIsLoading(false);
      }
    }

    initializePhase3();
  }, []);

  // Run security scan
  const runSecurityScan = async () => {
    try {
      setIsLoading(true);
      const results = await phase3.securityScan();
      setScanResults(results);

      // Refresh security status
      const status = await phase3.getSecurityStatus();
      setSecurityStatus(status);

      setIsLoading(false);
    } catch (error) {
      console.error('Security scan failed:', error);
      setIsLoading(false);
    }
  };

  // Activate enhanced security
  const enhanceSecurityMode = async () => {
    try {
      setIsLoading(true);
      await phase3.activateEnhancedSecurity();

      // Refresh security status
      const status = await phase3.getSecurityStatus();
      setSecurityStatus(status);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to enhance security:', error);
      setIsLoading(false);
    }
  };

  // Activate privacy mode
  const activatePrivacyMode = async () => {
    try {
      setIsLoading(true);
      await phase3.activatePrivacyMode();

      // Refresh security status
      const status = await phase3.getSecurityStatus();
      setSecurityStatus(status);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to activate privacy mode:', error);
      setIsLoading(false);
    }
  };

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  // Get icon name based on threat level
  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'low':
        return 'shield-checkmark';
      case 'medium':
        return 'shield-half';
      case 'high':
        return 'warning';
      case 'critical':
        return 'alert-circle';
      default:
        return 'shield';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading Phase 3 dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#121212', '#1a1a1a']}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>Phase 3 Dashboard</Text>
        <Text style={styles.subtitle}>
          Advanced Security &amp; Intelligence
        </Text>
      </LinearGradient>

      {/* Security Status Section */}
      <View style={styles.statusSection}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={getThreatIcon(securityStatus?.threatLevel || 'medium')}
            size={24}
            color={getScoreColor(securityStatus?.securityScore || 50)}
          />
          <Text style={styles.statusTitle}>Security Status</Text>
          <Text
            style={[
              styles.threatLevel,
              { color: getScoreColor(securityStatus?.securityScore || 50) },
            ]}
          >
            {securityStatus?.threatLevel?.toUpperCase() || 'UNKNOWN'}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Security</Text>
            <View style={styles.scoreCircle}>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(securityStatus?.securityScore || 50) },
                ]}
              >
                {securityStatus?.securityScore || 0}
              </Text>
            </View>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Privacy</Text>
            <View style={styles.scoreCircle}>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(securityStatus?.privacyScore || 50) },
                ]}
              >
                {securityStatus?.privacyScore || 0}
              </Text>
            </View>
          </View>

          <View style={styles.scoreItem}>
            <Text style={styles.scoreLabel}>Stealth</Text>
            <View style={styles.scoreCircle}>
              <Text
                style={[
                  styles.scoreValue,
                  { color: getScoreColor(securityStatus?.stealthScore || 50) },
                ]}
              >
                {securityStatus?.stealthScore || 0}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Active Protections</Text>
        <View style={styles.protectionsList}>
          {securityStatus?.activeProtections.map(
            (protection: string, index: number) => (
              <View key={index} style={styles.protectionItem}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={styles.protectionText}>{protection}</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={runSecurityScan}>
          <Ionicons name="scan-circle-outline" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Security Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
          onPress={enhanceSecurityMode}
        >
          <Ionicons name="shield" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Enhance Security</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#9C27B0' }]}
          onPress={activatePrivacyMode}
        >
          <Ionicons name="eye-off" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Privacy Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Scan Results */}
      {scanResults && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Scan Results</Text>

          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Security Score:</Text>
            <Text
              style={[
                styles.resultValue,
                { color: getScoreColor(scanResults.securityScore) },
              ]}
            >
              {scanResults.securityScore}/100
            </Text>
          </View>

          {scanResults.findings.length > 0 && (
            <>
              <Text style={styles.resultSubtitle}>Findings:</Text>
              {scanResults.findings.map((finding: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="alert-circle" size={18} color="#FF9800" />
                  <Text style={styles.listItemText}>{finding}</Text>
                </View>
              ))}
            </>
          )}

          {scanResults.recommendations.length > 0 && (
            <>
              <Text style={styles.resultSubtitle}>Recommendations:</Text>
              {scanResults.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.listItem}>
                  <Ionicons name="bulb" size={18} color="#4CAF50" />
                  <Text style={styles.listItemText}>{rec}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}

      {/* Navigation */}
      <View style={styles.navigationSection}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => router.back()}
        >
          <Ionicons name="settings" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Back to Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: '#424242' }]}
          onPress={() => router.back()}
        >
          <Ionicons name="rocket" size={24} color="#fff" />
          <Text style={styles.navButtonText}>Exit Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  statusSection: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
    flex: 1,
  },
  threatLevel: {
    fontSize: 14,
    fontWeight: 'bold',
    padding: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 5,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
  },
  scoreValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 15,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  protectionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  protectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    margin: 3,
  },
  protectionText: {
    color: '#ccc',
    fontSize: 12,
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 5,
  },
  resultsSection: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    margin: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#ccc',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ddd',
    marginTop: 10,
    marginBottom: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 5,
  },
  listItemText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
    marginLeft: 10,
  },
  navigationSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginVertical: 15,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  navButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 5,
  },
});
