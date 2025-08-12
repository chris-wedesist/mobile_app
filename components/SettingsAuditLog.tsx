import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { colors, shadows, radius } from '../constants/theme';
import { textStyles, cardStyles, layoutStyles } from '../constants/styles';
import { MaterialIcons } from '@expo/vector-icons';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

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

type SettingsAuditLogProps = {
  userId?: string;
  daysAgo?: number;
  settingFilter?: string;
  maxEntries?: number;
};

export default function SettingsAuditLog({
  userId,
  daysAgo = 30,
  settingFilter,
  maxEntries = 50
}: SettingsAuditLogProps) {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAuditLog();
  }, [userId, daysAgo, settingFilter]);

  const fetchAuditLog = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('settings_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(maxEntries);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (settingFilter) {
        query = query.eq('setting_changed', settingFilter);
      }

      if (daysAgo) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
        query = query.gte('changed_at', cutoffDate.toISOString());
      }

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
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSettingName = (setting: string) => {
    return setting
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'web':
        return <MaterialIcons name="public" size={16} color={colors.text.muted} />;
      case 'ios':
        return <MaterialIcons name="phone-iphone" size={16} color={colors.text.muted} />;
      case 'android':
        return <MaterialIcons name="phone-android" size={16} color={colors.text.muted} />;
      default:
        return <MaterialIcons name="smartphone" size={16} color={colors.text.muted} />;
    }
  };

  const renderValueChange = (oldValue: any, newValue: any, setting: string) => {
    // Handle boolean settings
    if (typeof oldValue?.enabled === 'boolean' && typeof newValue?.enabled === 'boolean') {
      return (
        <Text style={textStyles.body}>
          <Text style={textStyles.caption}>Changed from </Text>
          <Text style={{ 
            color: oldValue.enabled ? colors.status.success : colors.status.error,
            fontWeight: '600'
          }}>
            {oldValue.enabled ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={textStyles.caption}> to </Text>
          <Text style={{ 
            color: newValue.enabled ? colors.status.success : colors.status.error,
            fontWeight: '600'
          }}>
            {newValue.enabled ? 'Enabled' : 'Disabled'}
          </Text>
        </Text>
      );
    }

    // Handle screen type changes
    if (setting === 'cover_story' && oldValue?.screen && newValue?.screen) {
      return (
        <Text style={textStyles.body}>
          <Text style={textStyles.caption}>Changed from </Text>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            {formatSettingName(oldValue.screen)}
          </Text>
          <Text style={textStyles.caption}> to </Text>
          <Text style={{ color: colors.accent, fontWeight: '600' }}>
            {formatSettingName(newValue.screen)}
          </Text>
        </Text>
      );
    }

    // Generic fallback
    return (
      <View>
        <Text style={textStyles.caption}>Previous value:</Text>
        <Text style={textStyles.body}>{JSON.stringify(oldValue, null, 2)}</Text>
        <Text style={textStyles.caption}>New value:</Text>
        <Text style={textStyles.body}>{JSON.stringify(newValue, null, 2)}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: AuditLogEntry }) => {
    const isExpanded = expandedEntries[item.id] || false;

    return (
      <TouchableOpacity 
        style={styles.logEntry}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.logHeader}>
          <View style={layoutStyles.row}>
            {getPlatformIcon(item.platform)}
            <Text style={styles.settingName}>
              {formatSettingName(item.setting_changed)}
            </Text>
          </View>
          <View style={styles.logMeta}>
            <MaterialIcons name="schedule" size={14} color={colors.text.muted} />
            <Text style={styles.timestamp}>{formatDate(item.changed_at)}</Text>
            {isExpanded ? (
              <MaterialIcons name="expand-less" size={16} color={colors.text.muted} />
            ) : (
              <MaterialIcons name="expand-more" size={16} color={colors.text.muted} />
            )}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.logDetails}>
            {renderValueChange(item.old_value, item.new_value, item.setting_changed)}
            
            <View style={styles.metadataContainer}>
              <Text style={styles.metadataLabel}>Source:</Text>
              <Text style={styles.metadataValue}>{item.change_source}</Text>
              
              <Text style={styles.metadataLabel}>Platform:</Text>
              <Text style={styles.metadataValue}>{item.platform}</Text>
              
              {item.metadata?.app_version && (
                <>
                  <Text style={styles.metadataLabel}>App Version:</Text>
                  <Text style={styles.metadataValue}>{item.metadata.app_version}</Text>
                </>
              )}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[layoutStyles.container, layoutStyles.center]}>
        <Text style={textStyles.body}>Loading audit log...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[layoutStyles.container, layoutStyles.center]}>
        <Text style={textStyles.error}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAuditLog}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (auditLog.length === 0) {
    return (
      <View style={[layoutStyles.container, layoutStyles.center]}>
        <Text style={textStyles.body}>No settings changes found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={auditLog}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  listContent: {
    padding: 10,
  },
  logEntry: {
    ...cardStyles.base,
    marginBottom: 10,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginLeft: 8,
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
  logDetails: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: `${colors.text.muted}20`,
  },
  metadataContainer: {
    marginTop: 15,
    backgroundColor: colors.primary,
    padding: 10,
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
  retryButton: {
    marginTop: 15,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  retryText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
});