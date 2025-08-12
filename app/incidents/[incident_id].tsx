import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Video, AVPlaybackStatus, ResizeMode } from 'expo-av';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { colors, radius, shadows } from '../../constants/theme';
import { deleteIncidentFromDevice, uploadIncidentToCloud } from '../../utils/incident-storage';
import { BiometricAuth } from '../../components/BiometricAuth';
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
  cloud_url?: string;
};

export default function IncidentDetailScreen() {
  const { incident_id } = useLocalSearchParams<{ incident_id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState<'delete' | 'share' | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    loadIncidentDetails();
  }, [incident_id]);

  const loadIncidentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would fetch the incident details from storage
      // For demo purposes, we'll create a mock incident
      const mockIncident: Incident = {
        id: incident_id as string,
        videoUri: `${FileSystem.documentDirectory}DESIST/incidents/${incident_id}.mp4`,
        description: 'Police checkpoint on Main Street',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        created_at: new Date().toISOString(),
        uploaded: Math.random() > 0.5, // Randomly set as uploaded or not
      };
      
      setIncident(mockIncident);
    } catch (err) {
      console.error('Error loading incident details:', err);
      setError('Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
    }
  };

  const handleDelete = () => {
    setPendingAction('delete');
    if (Platform.OS === 'web') {
      confirmDelete();
    } else {
      setShowBiometricAuth(true);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Incident',
      'Are you sure you want to delete this incident from your device? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!incident_id) return;
              
              const result = await deleteIncidentFromDevice(incident_id as string);
              if (result.success) {
                router.replace('/incidents');
              } else {
                Alert.alert('Error', result.error || 'Failed to delete incident');
              }
            } catch (error) {
              console.error('Error deleting incident:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!incident) return;
    
    setPendingAction('share');
    if (Platform.OS === 'web') {
      performShare();
    } else {
      setShowBiometricAuth(true);
    }
  };

  const performShare = async () => {
    try {
      if (!incident) return;
      
      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: incident.description || 'Incident Recording',
            text: 'Incident recorded with DESIST!',
            url: incident.videoUri,
          });
        } else {
          Alert.alert('Sharing not supported', 'Sharing is not supported in this browser');
        }
      } else {
        // Native sharing
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(incident.videoUri);
        } else {
          Alert.alert('Sharing not available', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Error sharing incident:', error);
      Alert.alert('Error', 'Failed to share incident');
    }
  };

  const handleUpload = async () => {
    if (!incident || incident.uploaded) return;
    
    try {
      setIsUploading(true);
      const result = await uploadIncidentToCloud(incident.id);
      
      if (result.success) {
        setIncident(prev => prev ? { ...prev, uploaded: true, cloud_url: result.url } : null);
        Alert.alert('Success', 'Incident uploaded successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to upload incident');
      }
    } catch (error) {
      console.error('Error uploading incident:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBiometricSuccess = () => {
    setShowBiometricAuth(false);
    if (pendingAction === 'delete') {
      confirmDelete();
    } else if (pendingAction === 'share') {
      performShare();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading incident...</Text>
      </View>
    );
  }

  if (error || !incident) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={64} color={colors.status.error} />
        <Text style={styles.errorTitle}>Error Loading Incident</Text>
        <Text style={styles.errorText}>{error || 'Incident not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: incident.videoUri }}
            rate={1.0}
            volume={1.0}
            isMuted={false}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            useNativeControls
            style={styles.video}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.incidentTitle}>
            {incident.description || `Incident ${incident.id.substring(0, 8)}`}
          </Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialIcons name="access-time" size={16} color={colors.text.muted} />
              <Text style={styles.metaText}>
                Recorded on {formatDate(incident.created_at)}
              </Text>
            </View>
            
            {incident.location && (
              <View style={styles.metaItem}>
                <MaterialIcons name="location-on" size={16} color={colors.text.muted} />
                <Text style={styles.metaText}>
                  Location: {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <MaterialIcons name="share" size={20} color={colors.text.primary} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton,
                incident.uploaded && styles.actionButtonDisabled
              ]}
              onPress={handleUpload}
              disabled={incident.uploaded || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color={colors.text.primary} />
              ) : (
                <MaterialIcons name="upload" size={20} color={colors.text.primary} />
              )}
              <Text style={styles.actionText}>
                {isUploading ? 'Uploading...' : incident.uploaded ? 'Uploaded' : 'Upload'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <MaterialIcons name="delete" size={20} color={colors.text.primary} />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {showBiometricAuth && (
        <View style={styles.biometricOverlay}>
          <View style={styles.biometricContainer}>
            <Text style={styles.biometricTitle}>Authentication Required</Text>
            <Text style={styles.biometricText}>
              Please authenticate to {pendingAction === 'delete' ? 'delete' : 'share'} this incident
            </Text>
            <BiometricAuth
              onSuccess={handleBiometricSuccess}
              onFail={handleBiometricFail}
              promptMessage={`Authenticate to ${pendingAction === 'delete' ? 'delete' : 'share'} incident`}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
    fontFamily: 'Inter-Regular',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: 20,
  },
  incidentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    fontFamily: 'Inter-Bold',
  },
  metaContainer: {
    marginBottom: 30,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  metaText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  loadingText: {
    marginTop: 20,
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Inter-Bold',
  },
  errorText: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
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
    ...shadows.large,
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