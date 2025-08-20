import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../../constants/theme';
import {
  clearSampleIncidents,
  generateSampleIncidents,
} from '../../utils/generate-sample-incidents';

export default function DeveloperToolsScreen() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleGenerateSamples = async () => {
    try {
      setIsGenerating(true);
      setLastAction(null);

      const result = await generateSampleIncidents(5);

      if (result.success) {
        setLastAction(
          `Successfully generated ${result.count} sample incidents`
        );
        Alert.alert('Success', `Generated ${result.count} sample incidents`);
      } else {
        setLastAction(`Error: ${result.error}`);
        Alert.alert(
          'Error',
          result.error || 'Failed to generate sample incidents'
        );
      }
    } catch (error) {
      console.error('Error generating samples:', error);
      setLastAction('Error: An unexpected error occurred');
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSamples = async () => {
    Alert.alert(
      'Clear All Incidents',
      'Are you sure you want to delete all sample incidents? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsClearing(true);
              setLastAction(null);

              const result = await clearSampleIncidents();

              if (result.success) {
                setLastAction('Successfully cleared all sample incidents');
                Alert.alert(
                  'Success',
                  'All sample incidents have been cleared'
                );
              } else {
                setLastAction(`Error: ${result.error}`);
                Alert.alert(
                  'Error',
                  result.error || 'Failed to clear sample incidents'
                );
              }
            } catch (error) {
              console.error('Error clearing samples:', error);
              setLastAction('Error: An unexpected error occurred');
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

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
        <Text style={styles.title}>Developer Tools</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.warningBanner}>
          <MaterialIcons
            name="warning"
            size={20}
            color={colors.status.warning}
          />
          <Text style={styles.warningText}>
            These tools are for development and testing purposes only.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sample Data</Text>
          <Text style={styles.sectionDescription}>
            Generate or clear sample incidents for testing the app.
          </Text>

          <View style={styles.toolsContainer}>
            <TouchableOpacity
              style={[
                styles.toolButton,
                isGenerating && styles.toolButtonDisabled,
              ]}
              onPress={handleGenerateSamples}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <MaterialIcons
                  name="add"
                  size={20}
                  color={colors.text.primary}
                />
              )}
              <Text style={styles.toolButtonText}>
                {isGenerating ? 'Generating...' : 'Generate Samples'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toolButton,
                styles.dangerButton,
                isClearing && styles.toolButtonDisabled,
              ]}
              onPress={handleClearSamples}
              disabled={isClearing}
            >
              {isClearing ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <MaterialIcons
                  name="delete"
                  size={20}
                  color={colors.text.primary}
                />
              )}
              <Text style={styles.toolButtonText}>
                {isClearing ? 'Clearing...' : 'Clear All Samples'}
              </Text>
            </TouchableOpacity>
          </View>

          {lastAction && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>{lastAction}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Tools</Text>
          <Text style={styles.sectionDescription}>
            Tools for managing local database and storage.
          </Text>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionItemContent}>
              <MaterialIcons name="storage" size={20} color={colors.accent} />
              <View>
                <Text style={styles.actionItemTitle}>Reset Local Storage</Text>
                <Text style={styles.actionItemDescription}>
                  Clear all locally stored data and preferences
                </Text>
              </View>
            </View>
            <MaterialIcons name="refresh" size={16} color={colors.text.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <View style={styles.actionItemContent}>
              <MaterialIcons name="build" size={20} color={colors.accent} />
              <View>
                <Text style={styles.actionItemTitle}>Repair Database</Text>
                <Text style={styles.actionItemDescription}>
                  Fix common database issues and inconsistencies
                </Text>
              </View>
            </View>
            <MaterialIcons name="refresh" size={16} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Developer Information</Text>
          <Text style={styles.infoText}>App Version: 1.0.0</Text>
          <Text style={styles.infoText}>Build: Development</Text>
          <Text style={styles.infoText}>Platform: {Platform.OS}</Text>
          <Text style={styles.infoText}>OS Version: {Platform.Version}</Text>
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
    fontSize: 24,
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
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.warning}20`,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 10,
  },
  warningText: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  section: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  toolsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  toolButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: radius.lg,
    gap: 8,
    ...shadows.sm,
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  dangerButton: {
    backgroundColor: colors.status.error,
  },
  toolButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  statusContainer: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: radius.lg,
    marginTop: 5,
  },
  statusText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.text.muted}20`,
  },
  actionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
  },
  actionItemTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter-Medium',
  },
  actionItemDescription: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  infoSection: {
    marginTop: 10,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.muted,
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
  },
  infoText: {
    color: colors.text.muted,
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Inter-Regular',
  },
});
