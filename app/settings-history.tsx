import { MaterialIcons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows } from '../constants/theme';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

type SettingFilter =
  | 'all'
  | 'stealth_mode'
  | 'cover_story'
  | 'panic_gesture'
  | 'auto_upload'
  | 'auto_wipe'
  | 'emergency_sms';
type TimeRange = 7 | 30 | 90 | 365;

type AuditLogEntry = {
  id: string;
  setting_changed: string;
  old_value: any;
  new_value: any;
  changed_at: string;
  platform: string;
  change_source: string;
  metadata: any;
};

export default function SettingsHistoryScreen() {
  const [selectedFilter, setSelectedFilter] = useState<SettingFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    fetchAuditLog();
  }, [selectedFilter, timeRange]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('settings_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(100);

      if (selectedFilter !== 'all') {
        query = query.eq('setting_changed', selectedFilter);
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      query = query.gte('changed_at', cutoffDate.toISOString());

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setAuditLog(data || []);
    } catch (err) {
      console.error('Error fetching audit log:', err);
      setError('Failed to load settings history');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSettingName = (setting: string) => {
    return setting
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'web':
        return (
          <MaterialIcons name="public" size={16} color={colors.text.muted} />
        );
      case 'ios':
        return (
          <MaterialIcons
            name="phone-iphone"
            size={16}
            color={colors.text.muted}
          />
        );
      case 'android':
        return (
          <MaterialIcons
            name="phone-iphone"
            size={16}
            color={colors.text.muted}
          />
        );
      default:
        return (
          <MaterialIcons
            name="smartphone"
            size={16}
            color={colors.text.muted}
          />
        );
    }
  };

  const getFilterLabel = (filter: SettingFilter) => {
    switch (filter) {
      case 'all':
        return 'All Settings';
      default:
        return formatSettingName(filter);
    }
  };

  const getTimeRangeLabel = (days: TimeRange) => {
    switch (days) {
      case 7:
        return 'Last 7 days';
      case 30:
        return 'Last 30 days';
      case 90:
        return 'Last 3 months';
      case 365:
        return 'Last year';
    }
  };

  const renderValueChange = (oldValue: any, newValue: any, setting: string) => {
    // Handle boolean settings
    if (
      typeof oldValue?.enabled === 'boolean' &&
      typeof newValue?.enabled === 'boolean'
    ) {
      return (
        <Text style={styles.valueChangeText}>
          <Text style={styles.valueChangeLabel}>Changed from </Text>
          <Text
            style={{
              color: oldValue.enabled
                ? colors.status.success
                : colors.status.error,
              fontWeight: '600',
            }}
          >
            {oldValue.enabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.valueChangeLabel}> to </Text>
          <Text
            style={{
              color: newValue.enabled
                ? colors.status.success
                : colors.status.error,
              fontWeight: '600',
            }}
          >
            {newValue.enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </Text>
      );
    }

    // Handle screen type changes
    if (setting === 'cover_story' && oldValue?.screen && newValue?.screen) {
      return (
        <Text style={styles.valueChangeText}>
          <Text style={styles.valueChangeLabel}>Changed from </Text>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            {formatSettingName(oldValue.screen)}
          </Text>
          <Text style={styles.valueChangeLabel}> to </Text>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            {formatSettingName(newValue.screen)}
          </Text>
        </Text>
      );
    }

    // Generic fallback
    return (
      <View>
        <Text style={styles.valueChangeLabel}>Previous value:</Text>
        <Text style={styles.valueChangeText}>
          {JSON.stringify(oldValue, null, 2)}
        </Text>
        <Text style={styles.valueChangeLabel}>New value:</Text>
        <Text style={styles.valueChangeText}>
          {JSON.stringify(newValue, null, 2)}
        </Text>
      </View>
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
            name="arrow-back"
            color={colors.text.primary}
            size={24}
          />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="history" size={28} color={colors.accent} />
          <Text style={styles.title}>Settings History</Text>
        </View>

        <Text style={styles.description}>
          View a complete history of changes made to your app settings.
        </Text>

        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <MaterialIcons
                name="filter-list"
                size={16}
                color={colors.text.muted}
              />
              <Text style={styles.filterTitle}>Filter by Setting</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterOptions}
            >
              {(
                [
                  'all',
                  'stealth_mode',
                  'cover_story',
                  'panic_gesture',
                  'auto_upload',
                  'auto_wipe',
                  'emergency_sms',
                ] as SettingFilter[]
              ).map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    selectedFilter === filter && styles.activeFilterChip,
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedFilter === filter && styles.activeFilterChipText,
                    ]}
                  >
                    {getFilterLabel(filter)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <MaterialIcons name="event" size={16} color={colors.text.muted} />
              <Text style={styles.filterTitle}>Time Range</Text>
            </View>
            <View style={styles.timeRangeOptions}>
              {([7, 30, 90, 365] as TimeRange[]).map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[
                    styles.timeRangeChip,
                    timeRange === days && styles.activeTimeRangeChip,
                  ]}
                  onPress={() => setTimeRange(days)}
                >
                  <Text
                    style={[
                      styles.timeRangeChipText,
                      timeRange === days && styles.activeTimeRangeChipText,
                    ]}
                  >
                    {getTimeRangeLabel(days)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.logContainer}>
          <Text style={styles.logTitle}>Change History</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons
                name="error"
                size={24}
                color={colors.status.error}
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchAuditLog}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : auditLog.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="history"
                size={48}
                color={colors.text.muted}
              />
              <Text style={styles.emptyText}>No settings changes found</Text>
              <Text style={styles.emptySubtext}>
                Changes to your settings will appear here
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.logList}>
              {auditLog.map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.logEntry}
                  onPress={() => toggleExpand(entry.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.logHeader}>
                    <View style={styles.logHeaderLeft}>
                      {getPlatformIcon(entry.platform)}
                      <Text style={styles.settingName}>
                        {formatSettingName(entry.setting_changed)}
                      </Text>
                    </View>
                    <View style={styles.logMeta}>
                      <MaterialIcons
                        name="schedule"
                        size={14}
                        color={colors.text.muted}
                      />
                      <Text style={styles.timestamp}>
                        {formatDate(entry.changed_at)}
                      </Text>
                      {expandedEntries[entry.id] ? (
                        <MaterialIcons
                          name="expand-less"
                          size={16}
                          color={colors.text.muted}
                        />
                      ) : (
                        <MaterialIcons
                          name="expand-more"
                          size={16}
                          color={colors.text.muted}
                        />
                      )}
                    </View>
                  </View>

                  {renderValueChange(
                    entry.old_value,
                    entry.new_value,
                    entry.setting_changed
                  )}

                  {expandedEntries[entry.id] && (
                    <View style={styles.logDetails}>
                      <View style={styles.metadataContainer}>
                        <Text style={styles.metadataLabel}>Source:</Text>
                        <Text style={styles.metadataValue}>
                          {entry.change_source || 'App'}
                        </Text>

                        <Text style={styles.metadataLabel}>Platform:</Text>
                        <Text style={styles.metadataValue}>
                          {entry.platform}
                        </Text>

                        {entry.metadata?.app_version && (
                          <>
                            <Text style={styles.metadataLabel}>
                              App Version:
                            </Text>
                            <Text style={styles.metadataValue}>
                              {entry.metadata.app_version}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 20,
    lineHeight: 24,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 15,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  filterTitle: {
    fontSize: 14,
    color: colors.text.muted,
    textTransform: 'uppercase',
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.round,
  },
  activeFilterChip: {
    backgroundColor: colors.accent,
  },
  filterChipText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  activeFilterChipText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  timeRangeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeRangeChip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.round,
  },
  activeTimeRangeChip: {
    backgroundColor: colors.accent,
  },
  timeRangeChipText: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  activeTimeRangeChipText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
  },
  logTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 15,
  },
  logList: {
    flex: 1,
  },
  logEntry: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 15,
    ...shadows.sm,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.muted,
  },
  valueChangeText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  valueChangeLabel: {
    fontSize: 14,
    color: colors.text.muted,
  },
  logDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: `${colors.text.muted}20`,
  },
  metadataContainer: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: radius.md,
  },
  metadataLabel: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: colors.text.secondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    marginBottom: 20,
    color: colors.status.error,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  retryText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 10,
    color: colors.text.muted,
    fontSize: 14,
    textAlign: 'center',
  },
});
