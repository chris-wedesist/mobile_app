import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface LegalHubProps {
  onPrivacyPolicyPress: () => void;
  onTermsOfServicePress: () => void;
  onContactSupport?: () => void;
}

export default function LegalHubScreen({ 
  onPrivacyPolicyPress, 
  onTermsOfServicePress, 
  onContactSupport 
}: LegalHubProps) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Legal & Privacy</Text>
        <Text style={styles.subtitle}>
          Your rights and our commitments to protecting your privacy and security
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem} onPress={onPrivacyPolicyPress}>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Privacy Policy</Text>
            <Text style={styles.menuItemDescription}>
              How we collect, use, and protect your personal information
            </Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={onTermsOfServicePress}>
          <View style={styles.menuItemContent}>
            <Text style={styles.menuItemTitle}>Terms of Service</Text>
            <Text style={styles.menuItemDescription}>
              Your rights and responsibilities when using DESIST!
            </Text>
          </View>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>

        {onContactSupport && (
          <TouchableOpacity style={styles.menuItem} onPress={onContactSupport}>
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Contact Support</Text>
              <Text style={styles.menuItemDescription}>
                Get help with privacy or legal questions
              </Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Your Privacy Rights</Text>
        <Text style={styles.infoText}>
          • Request access to your personal data{'\n'}
          • Request deletion of your information{'\n'}
          • Opt-out of data sharing (we don't sell your data){'\n'}
          • Update your privacy preferences
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Data Security</Text>
        <Text style={styles.infoText}>
          DESIST! uses enterprise-grade security measures including encryption, 
          rate limiting, and human verification to protect your information and 
          prevent abuse of our platform.
        </Text>
      </View>

      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Contact Information</Text>
        <Text style={styles.contactItem}>Privacy: privacy@wedesist.com</Text>
        <Text style={styles.contactItem}>Legal: legal@wedesist.com</Text>
        <Text style={styles.contactItem}>Security: security@wedesist.com</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Last updated: August 28, 2025
        </Text>
        <Text style={styles.footerText}>
          © 2025 DESIST! - All rights reserved
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  menuItemArrow: {
    fontSize: 24,
    color: '#007bff',
    fontWeight: '300',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  contactSection: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  contactItem: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
});
