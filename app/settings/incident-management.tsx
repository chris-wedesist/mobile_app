import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { downloadIncidentFromCloud, permanentlyDeleteIncidentFromCloud } from '@/utils/incident-storage';
import { BiometricAuth } from '@/components/BiometricAuth';
import { colors, radius, shadows } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

type CloudIncident = {
  id: string;
  description?: string;
  created_at: string;
  size?: string;
};

export default function IncidentManagementScreen() {
  const [incidents, setIncidents] = useState<CloudIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'restore' | 'delete'; id: string } | null>(null);
  const userId = 'mock-user-id'; // In a real app, this would come from authentication

  useEffect(() => {
    fetchCloudIncidents();
  }, []);

  const fetchCloudIncidents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would fetch from Supabase or another cloud storage
      // For demo purposes, we'll use mock data
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockIncidents: CloudIncident[] = [
        {
          id: 'incident-1',
          description: 'Police checkpoint on Main Street',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
          size: '24.5 MB',
        },
        {
          id: 'incident-2',
          description: 'ICE activity near community center',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
          size: '18.2 MB',
        },
        {
          id: 'incident-3',
          description: 'Checkpoint documentation',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
          size: '32.1 MB',
        },
      ];
      
      setIncidents(mockIncidents);
    } catch (err) {
      console.error('Error fetching cloud incidents:', err);
      setError('Failed to load cloud incidents. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (id: string) => {
    setPendingAction({ type: 'restore', id });
    if (Platform.OS === 'web') {
      performRestore(id);
    } else {
      setShowBiometricAuth(true);
    }
  };

  const handlePermanentDelete = (id: string) => {
    setPendingAction({ type: 'delete', id });
    if (Platform.OS === 'web') {
      confirmPermanentDelete(id);
    } else {
      setShowBiometricAuth(true);
    }
  };

  const performRestore = async (id: string) => {
    try {
      setProcessingId(id);
      const result = await downloadIncidentFromCloud(userId, id);
      
      if (result.success) {
        Alert.alert('Success', 'Incident restored to your device');
      } else {
        Alert.alert('Error', result.error || 'Failed to restore incident');
      }
    } catch (error) {
      console.error('Error restoring incident:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmPermanentDelete = (id: string) => {
    Alert.alert(
      'Permanently Delete',
      'This will permanently delete the incident from cloud storage. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: () => performPermanentDelete(id),
        },
      ]
    );
  };

  const performPermanentDelete = async (id: string) => {
    try {
      setProcessingId(id);
      const result = await permanentlyDeleteIncidentFromCloud(userId, id);
      
      if (result.success) {
        setIncidents(prev => prev.filter(incident => incident.id !== id));
        Alert.alert('Success', 'Incident permanently deleted');
      } else {
        Alert.alert('Error', result.error || 'Failed to delete incident');
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBiometricSuccess = () => {
    setShowBiometricAuth(false);
    if (pendingAction) {
      if (pendingAction.type === 'restore') {
        performRestore(pendingAction.id);
      } else {
        confirmPermanentDelete(pendingAction.id);
      }
    }
    setPendingAction(null);
  };

  const handleBiometricFail = () => {
    setShowBiometricAuth(false);
    setPendingAction(null);
    Alert.alert('Authentication Failed', 'Biometric authentication is required for this action');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderIncident = ({ item }: { item: CloudIncident }) => (
    <View style={styles.incidentCard}>
      <View style={styles.cardContent}>
        <Text style={styles.incidentTitle}>{item.description || `Incident ${item.id}`}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <MaterialIcons name="access-time" size={16} color={colors.text.muted} />
            <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
          </View>
          
          {item.size && (
            <Text style={styles.sizeText}>{item.size}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            processingId === item.id && styles.actionButtonDisabled
          ]}
          onPress={() => handleRestore(item.id)}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color={colors.text.primary} />
          ) : (
            <MaterialIcons name="file-download" size={20} color={colors.text.primary} />
          )}
          <Text style={styles.actionText}>Restore</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.deleteButton,
            processingId === item.id && styles.actionButtonDisabled
          ]}
          onPress={() => handlePermanentDelete(item.id)}
          disabled={processingId === item.id}
        >
          <MaterialIcons name="delete" size={20} color={colors.text.primary} />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={24} color={colors.text.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cloud Incidents</Text>
      </View>

      <View style={styles.warningBanner}>
        <MaterialIcons name="warning" size={20} color={colors.status.warning} />
        <Text style={styles.warningText}>
          Incidents are stored in the cloud for 30 days, then automatically deleted
        </Text>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading cloud incidents...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCloudIncidents}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : incidents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.text.muted} />
          <Text style={styles.emptyTitle}>No Cloud Incidents</Text>
          <Text style={styles.emptyText}>
            Incidents that you upload will be securely stored in the cloud and appear here.
          </Text>
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

      {showBiometricAuth && (
        <View style={styles.biometricOverlay}>
          <View style={styles.biometricContainer}>
            <Text style={styles.biometricTitle}>Authentication Required</Text>
            <Text style={styles.biometricText}>
              Please authenticate to {pendingAction?.type === 'restore' ? 'restore' : 'delete'} this incident
            </Text>
            <BiometricAuth
              onSuccess={handleBiometricSuccess}
              onFail={handleBiometricFail}
              promptMessage={`Authenticate to ${pendingAction?.type === 'restore' ? 'restore' : 'delete'} incident`}
            />
          </View>
        </View>
      )}
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.status.warning}20`,
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: radius.lg,
    gap: 10,
  },
  warningText: {
    color: colors.text.primary,
    fontSize: 14,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 16,
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
    padding: 20,
    paddingTop: 0,
  },
  incidentCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  cardContent: {
    marginBottom: 15,
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },
  sizeText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
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
  actionButtonDisabled: {
    opacity: 0.5,
  },
  deleteButton: {
    backgroundColor: colors.status.error,
  },
  actionText: {
    color: colors.text.primary,
    fontSize: 14,
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
    fontFamily: 'Inter-Regular',
  },
  biometricOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  biometricContainer: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.lg,
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
  },
  biometricText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
});