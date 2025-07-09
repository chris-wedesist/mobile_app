import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function LegalRightsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" color="#fff" size={24} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Know Your Rights</Text>
        <Text style={styles.subtitle}>What to do if detained</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="error" color="#ff4757" size={24} />
            <Text style={styles.sectionTitle}>Stay Calm & Assert Your Rights</Text>
          </View>
          <Text style={styles.text}>
            • Remain calm and composed{'\n'}
            • State clearly: "I am exercising my right to remain silent"{'\n'}
            • Ask: "Am I free to go?" If yes, calmly leave{'\n'}
            • Say: "I do not consent to any searches"{'\n'}
            • Request to speak to an attorney immediately
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="message" color="#ff4757" size={24} />
            <Text style={styles.sectionTitle}>What to Say</Text>
          </View>
          <Text style={styles.text}>
            • "I wish to remain silent"{'\n'}
            • "I want to speak to an attorney"{'\n'}
            • "I do not consent to this search"{'\n'}
            • "I want to make a phone call"{'\n'}
            • Document badge numbers and names if possible
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="camera" color="#ff4757" size={24} />
            <Text style={styles.sectionTitle}>Documentation</Text>
          </View>
          <Text style={styles.text}>
            • If safe, record the interaction{'\n'}
            • Note time, location, and officer details{'\n'}
            • Remember or write down badge numbers{'\n'}
            • Document any witnesses present{'\n'}
            • Save any evidence or injuries with photos
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="phone" color="#ff4757" size={24} />
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          </View>
          <Text style={styles.text}>
            • Legal Aid Hotline: 1-800-LEGAL-AID{'\n'}
            • National Lawyers Guild: 1-212-679-5100{'\n'}
            • ACLU National: 1-212-549-2500{'\n'}
            • Local Police Complaints: File within 24 hours
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="volume-up" color="#ff4757" size={24} />
            <Text style={styles.sectionTitle}>After the Incident</Text>
          </View>
          <Text style={styles.text}>
            • Write down everything you remember{'\n'}
            • File a complaint if rights were violated{'\n'}
            • Contact a civil rights attorney{'\n'}
            • Seek medical attention if needed{'\n'}
            • Keep all documentation and evidence
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => router.push('/report-incident')}>
          <Text style={styles.emergencyButtonText}>Report an Incident</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    fontFamily: 'Inter-Bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#ff4757',
    marginBottom: 30,
    fontFamily: 'Inter-Medium',
  },
  section: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
  },
  text: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  emergencyButton: {
    backgroundColor: '#ff4757',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});