import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { listLocalIncidents } from '../../utils/incident-storage';
import { colors, radius, shadows } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type Incident = {
  id: string;
  videoUri: string;
  description?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  uploaded?: boolean;
};

export default function IncidentListScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listLocalIncidents();
      setIncidents(data);
    } catch (err) {
      console.error('Error loading incidents:', err);
      setError('Failed to load incidents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderIncident = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={styles.incidentCard}
      onPress={() => router.push(`/incidents/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="video-label" size={24} color={colors.accent} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.incidentTitle}>
            {item.description || `Incident ${item.id.substring(0, 8)}`}
          </Text>
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={14} color={colors.text.muted} />
              <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
            </View>
            {item.location && (
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={14} color={colors.text.muted} />
                <Text style={styles.metaText}>Location recorded</Text>
              </View>
            )}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.text.muted} />
      </View>
      
      {item.uploaded && (
        <View style={styles.uploadedBadge}>
          <Text style={styles.uploadedText}>Uploaded</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading incidents...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadIncidents}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="video-label" size={28} color={colors.accent} />
        <Text style={styles.title}>My Incidents</Text>
      </View>

      {incidents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="video-label" size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No Incidents Recorded</Text>
          <Text style={styles.emptyText}>
            Recorded incidents will appear here. Use the Record tab to document new incidents.
          </Text>
          <TouchableOpacity 
            style={styles.recordButton}
            onPress={() => router.push('/(tabs)/record')}
          >
            <Text style={styles.recordButtonText}>Record New Incident</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={renderIncident}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 30,
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    fontSize: 16,
    color: colors.status.error,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  retryText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  listContent: {
    paddingBottom: 100,
  },
  incidentCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.round,
    backgroundColor: `${colors.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  incidentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
    fontFamily: 'Inter-SemiBold',
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.status.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  uploadedText: {
    fontSize: 10,
    color: colors.text.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Inter-Regular',
  },
  recordButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  recordButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});