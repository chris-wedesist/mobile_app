import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../../constants/theme';

export default function SettingsIndexScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons
            name="chevron-left"
            size={24}
            color={colors.text.primary}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="person" size={20} color={colors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Profile</Text>
              <Text style={styles.settingDescription}>
                Manage your account information
              </Text>
            </View>
            <Text style={styles.settingAction}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/notification-settings')}
          >
            <View style={styles.settingIcon}>
              <MaterialIcons
                name="notifications"
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Configure alert preferences
              </Text>
            </View>
            <Text style={styles.settingAction}>Configure</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/stealth-mode')}
          >
            <View style={styles.settingIcon}>
              <MaterialIcons
                name="visibility"
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Stealth Mode</Text>
              <Text style={styles.settingDescription}>
                Configure app disguise options
              </Text>
            </View>
            <Text style={styles.settingAction}>Configure</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialIcons name="lock" size={20} color={colors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy & Security</Text>
              <Text style={styles.settingDescription}>
                Manage security settings
              </Text>
            </View>
            <Text style={styles.settingAction}>View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/emergency-setup')}
          >
            <View style={styles.settingIcon}>
              <MaterialIcons
                name="notifications"
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Emergency Contacts</Text>
              <Text style={styles.settingDescription}>
                Manage emergency contacts and alerts
              </Text>
            </View>
            <Text style={styles.settingAction}>Configure</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/incident-management')}
          >
            <View style={styles.settingIcon}>
              <MaterialIcons
                name="video-label"
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Incident Management</Text>
              <Text style={styles.settingDescription}>
                Manage cloud-stored incidents
              </Text>
            </View>
            <Text style={styles.settingAction}>View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/settings/developer-tools')}
          >
            <View style={styles.settingIcon}>
              <MaterialIcons name="build" size={20} color={colors.accent} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Developer Tools</Text>
              <Text style={styles.settingDescription}>
                Testing and development options
              </Text>
            </View>
            <Text style={styles.settingAction}>View</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About DESIST!</Text>
          <Text style={styles.infoText}>Version 1.0.0</Text>
          <Text style={styles.infoText}>
            © 2024 DESIST!. All rights reserved.
          </Text>
        </View>
      </ScrollView>
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  sectionTitle: {
    color: colors.text.muted,
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: 15,
    fontFamily: 'Inter-Medium',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  settingDescription: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  settingAction: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  infoSection: {
    marginTop: 10,
    marginBottom: 40,
    alignItems: 'center',
  },
  infoTitle: {
    color: colors.text.muted,
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Inter-Medium',
  },
  infoText: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Inter-Regular',
  },
});
