/* eslint-disable @typescript-eslint/no-magic-numbers */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { IncidentFilter, IncidentReport, IncidentSeverity, IncidentType, Location as LocationType } from '../types/incident';
import { IncidentService } from '../services/IncidentService';
import { EncryptionService } from '../encryption';
import { COLORS } from '../constants/theme';

interface IncidentMapViewProps {
  encryptionService: EncryptionService;
  onIncidentSelect?: (incident: IncidentReport) => void;
}

const { width, height } = Dimensions.get('window');

const severityColors = {
  low: COLORS.severityLow,
  medium: COLORS.severityMedium,
  high: COLORS.severityHigh,
  critical: COLORS.severityCritical
};

const typeIcons = {
  theft: '🔓',
  assault: '⚠️',
  vandalism: '🔨',
  fraud: '💳',
  harassment: '😨',
  suspicious_activity: '🔍',
  traffic_incident: '🚗',
  safety_concern: '🛡️',
  emergency: '🚨',
  other: '📍'
};

export const IncidentMapView: React.FC<IncidentMapViewProps> = ({
  encryptionService,
  onIncidentSelect
}) => {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01
  });

  const incidentService = new IncidentService(encryptionService);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadNearbyIncidents();
    }
  }, [userLocation]);

  const initializeMap = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        const userLoc: LocationType = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy || 0,
          timestamp: new Date()
        };

        setUserLocation(userLoc);
        setMapRegion({
          latitude: userLoc.latitude,
          longitude: userLoc.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your location. Showing default view.');
    }
  };

  const loadNearbyIncidents = async (): Promise<void> => {
    if (!userLocation) return;

    try {
      setLoading(true);
      const RADIUS = 5000; // 5km radius
      const result = await incidentService.getIncidentsNearLocation(userLocation, RADIUS);

      if (result.success && result.data) {
        setIncidents(result.data);
      } else {
        Alert.alert('Error', 'Failed to load incidents');
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      Alert.alert('Error', 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (incident: IncidentReport): void => {
    setSelectedIncident(incident);
    setShowDetails(true);
    onIncidentSelect?.(incident);
  };

  const getMarkerColor = (severity: IncidentSeverity): string => {
    return severityColors[severity];
  };

  const getTypeIcon = (type: IncidentType): string => {
    return typeIcons[type] || typeIcons.other;
  };

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const renderIncidentDetails = (): React.ReactElement | null => {
    if (!selectedIncident) return null;

    return (
      <Modal
        visible={showDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Incident Details</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.incidentHeader}>
              <Text style={styles.incidentIcon}>{getTypeIcon(selectedIncident.type)}</Text>
              <View style={styles.incidentInfo}>
                <Text style={styles.incidentTitle}>{selectedIncident.title}</Text>
                <Text style={styles.incidentType}>
                  {selectedIncident.type.replace('_', ' ')} • {selectedIncident.severity}
                </Text>
                <Text style={styles.incidentTime}>
                  {formatTimestamp(selectedIncident.timestamp)}
                </Text>
              </View>
              <View style={[
                styles.severityBadge,
                { backgroundColor: getMarkerColor(selectedIncident.severity) }
              ]}>
                <Text style={styles.severityText}>
                  {selectedIncident.severity.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.incidentDescription}>
                {selectedIncident.description}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedIncident.upvotes}</Text>
                <Text style={styles.statLabel}>Upvotes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedIncident.downvotes}</Text>
                <Text style={styles.statLabel}>Downvotes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{selectedIncident.status}</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>

            {selectedIncident.tags && selectedIncident.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsWrapper}>
                  {selectedIncident.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {incidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{
              latitude: incident.location.latitude,
              longitude: incident.location.longitude
            }}
            pinColor={getMarkerColor(incident.severity)}
            onPress={() => handleMarkerPress(incident)}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>
                  {getTypeIcon(incident.type)} {incident.title}
                </Text>
                <Text style={styles.calloutSubtitle}>
                  {incident.severity} • {formatTimestamp(incident.timestamp)}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
      )}

      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Severity Levels</Text>
        {Object.entries(severityColors).map(([severity, color]) => (
          <View key={severity} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{severity}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadNearbyIncidents}
        disabled={loading}
      >
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>

      {renderIncidentDetails()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    width,
    height
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.dark
  },
  calloutContainer: {
    minWidth: 200,
    padding: 10
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4
  },
  calloutSubtitle: {
    fontSize: 12,
    color: COLORS.medium
  },
  legendContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 10,
    borderRadius: 8,
    minWidth: 120
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8
  },
  legendText: {
    fontSize: 11,
    textTransform: 'capitalize'
  },
  refreshButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 16,
    color: COLORS.medium
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  incidentIcon: {
    fontSize: 32,
    marginRight: 12
  },
  incidentInfo: {
    flex: 1
  },
  incidentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4
  },
  incidentType: {
    fontSize: 14,
    color: COLORS.medium,
    textTransform: 'capitalize',
    marginBottom: 2
  },
  incidentTime: {
    fontSize: 12,
    color: COLORS.lighter
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  severityText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold'
  },
  descriptionContainer: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8
  },
  incidentDescription: {
    fontSize: 14,
    color: COLORS.medium,
    lineHeight: 20
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.medium,
    marginTop: 4,
    textTransform: 'capitalize'
  },
  tagsContainer: {
    marginBottom: 20
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    backgroundColor: COLORS.locationBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  tagText: {
    fontSize: 12,
    color: COLORS.info
  }
});
