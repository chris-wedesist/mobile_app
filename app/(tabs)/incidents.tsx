import { MaterialIcons } from '@expo/vector-icons';
import { createClient } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import WebView from 'react-native-webview';
import { colors, radius, shadows } from '../../constants/theme';

const supabase = createClient(
  'https://example.supabase.co',
  'your-supabase-anon-key'
);

// Test data generator
const generateTestData = (
  count: number,
  userLat: number,
  userLng: number,
  radiusKm: number
) => {
  const types = [
    'ICE Activity',
    'Border Patrol Activity',
    'Checkpoint',
    'Raid in Progress',
    'Suspicious Vehicle',
  ];
  const incidents = [];

  for (let i = 0; i < count; i++) {
    // Generate random coordinates within the specified radius of user location
    const radiusDegrees = radiusKm / 111; // Convert km to degrees (approximate)
    const lat = userLat + (Math.random() - 0.5) * radiusDegrees * 2;
    const lng = userLng + (Math.random() - 0.5) * radiusDegrees * 2;

    incidents.push({
      id: `test-${i}`,
      type: types[Math.floor(Math.random() * types.length)],
      description: `Test incident ${i + 1} - ${
        types[Math.floor(Math.random() * types.length)]
      } reported in the area.`,
      location: `POINT(${lng} ${lat})`,
      status: 'active',
      created_at: new Date(
        Date.now() - Math.random() * 1000 * 60 * 60 * 24
      ).toISOString(), // Random time in last 24 hours
      latitude: lat,
      longitude: lng,
    });
  }

  return incidents;
};

type Incident = {
  id: string;
  type: string;
  description: string;
  location: string;
  status: string;
  created_at: string;
  latitude: number;
  longitude: number;
  distance?: number;
};

const REFRESH_INTERVAL = 30000; // 30 seconds
const DEFAULT_RADIUS = 5; // 5km default

export default function IncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [radius, setRadius] = useState(DEFAULT_RADIUS); // Radius in kilometers
  const [showRadiusControl, setShowRadiusControl] = useState(false);
  const [customRadius, setCustomRadius] = useState(DEFAULT_RADIUS.toString());
  const refreshInterval = useRef<NodeJS.Timeout | undefined>(undefined);
  const mapRef = useRef<WebView>(null);
  const { newIncident } = useLocalSearchParams();

  useEffect(() => {
    checkLocationPermission();
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (newIncident) {
      try {
        const incident = JSON.parse(newIncident as string);
        setIncidents((prev) => [incident, ...prev]);
      } catch (error) {
        console.error('Error parsing new incident:', error);
      }
    }
  }, [newIncident]);

  // Refetch incidents when radius changes
  useEffect(() => {
    if (location) {
      fetchIncidents(location);
    }
  }, [radius, location]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    // Convert coordinates to radians
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to show nearby incidents');
        setIsLoading(false);
        return;
      }

      // Get high accuracy location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 0,
        distanceInterval: 0,
      });

      console.log('Got user location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });

      setLocation(location);
      await fetchIncidents(location);

      refreshInterval.current = setInterval(async () => {
        try {
          const newLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 0,
            distanceInterval: 0,
          });
          setLocation(newLocation);
          await fetchIncidents(newLocation);
          setIsConnected(true);
        } catch (error) {
          console.error('Refresh error:', error);
          setIsConnected(false);
        }
      }, REFRESH_INTERVAL) as unknown as NodeJS.Timeout;
    } catch (error) {
      console.error('Setup error:', error);
      setError(
        'Failed to get your location. Please check your settings and try again.'
      );
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncidents = async (userLocation: Location.LocationObject) => {
    try {
      // Generate test data with the current radius
      const data = generateTestData(
        10,
        userLocation.coords.latitude || 0,
        userLocation.coords.longitude || 0,
        radius
      );

      // Calculate distances for each incident
      const incidentsWithDistance = data.map((incident) => {
        try {
          // Get coordinates directly from the incident
          const latitude = parseFloat(incident.latitude);
          const longitude = parseFloat(incident.longitude);

          if (isNaN(latitude) || isNaN(longitude)) {
            console.warn('Invalid coordinates:', incident);
            return { ...incident, distance: 0 };
          }

          // Calculate distance
          const distance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            latitude,
            longitude
          );

          return {
            ...incident,
            latitude,
            longitude,
            distance,
          };
        } catch (error) {
          console.error('Error processing incident:', error);
          return { ...incident, distance: 0 };
        }
      });

      // Filter incidents within the specified radius
      const radiusInMeters = radius * 1000;
      const filteredIncidents = incidentsWithDistance.filter(
        (incident) => (incident.distance || 0) <= radiusInMeters
      );

      // Sort incidents by distance
      const incidents = filteredIncidents.sort(
        (a, b) => (a.distance || 0) - (b.distance || 0)
      );

      setIncidents(incidents);
      setIsConnected(true);
      setError(null);

      if (showMap && mapRef.current) {
        const mapScript = `
          updateMarkers(${JSON.stringify(incidents)});
          true;
        `;
        mapRef.current.injectJavaScript(mapScript);
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Failed to fetch incidents. Please try again.');
      setIsConnected(false);
    }
  };

  const adjustRadius = (increment: number) => {
    const newRadius = Math.max(1, Math.min(50, radius + increment)); // Limit between 1-50km
    setRadius(newRadius);
    setCustomRadius(newRadius.toString());
  };

  const handleCustomRadiusChange = (value: string) => {
    setCustomRadius(value);
  };

  const applyCustomRadius = () => {
    const newRadius = parseFloat(customRadius);
    if (!isNaN(newRadius) && newRadius >= 1 && newRadius <= 50) {
      setRadius(newRadius);
      setShowRadiusControl(false);
    } else {
      Alert.alert(
        'Invalid Radius',
        'Please enter a radius between 1 and 50 kilometers.'
      );
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderIncident = ({ item }: { item: Incident }) => (
    <TouchableOpacity
      style={styles.incidentCard}
      onPress={() => router.push(`/incidents/${item.id}`)}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentType}>{item.type}</Text>
        <Text style={styles.incidentTime}>
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
      <Text style={styles.incidentDescription}>{item.description}</Text>
      <View style={styles.incidentFooter}>
        <Text style={styles.incidentDistance}>
          {formatDistance(item.distance || 0)} away
        </Text>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor:
                item.status === 'active'
                  ? colors.accent
                  : colors.text.secondary,
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    if (location) {
      await fetchIncidents(location);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with radius control */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Nearby Incidents</Text>
          <TouchableOpacity
            style={styles.radiusButton}
            onPress={() => setShowRadiusControl(!showRadiusControl)}
          >
            <MaterialIcons name="tune" size={24} color={colors.text.primary} />
            <Text style={styles.radiusText}>{radius}km</Text>
          </TouchableOpacity>
        </View>

        {showRadiusControl && (
          <View style={styles.radiusControl}>
            <View style={styles.radiusIncrement}>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => adjustRadius(-1)}
              >
                <MaterialIcons
                  name="remove"
                  size={20}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
              <Text style={styles.radiusLabel}>Radius: {radius}km</Text>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => adjustRadius(1)}
              >
                <MaterialIcons
                  name="add"
                  size={20}
                  color={colors.text.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.customRadius}>
              <TextInput
                style={styles.radiusInput}
                value={customRadius}
                onChangeText={handleCustomRadiusChange}
                placeholder="Enter radius (1-50km)"
                keyboardType="numeric"
                maxLength={2}
              />
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyCustomRadius}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Connection status */}
      {!isConnected && (
        <View style={styles.connectionWarning}>
          <MaterialIcons
            name="wifi-off"
            size={16}
            color={colors.status.warning}
          />
          <Text style={styles.connectionText}>
            Offline mode - showing cached data
          </Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Incidents list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading incidents...</Text>
        </View>
      ) : (
        <FlatList
          data={incidents}
          renderItem={renderIncident}
          keyExtractor={(item) => item.id}
          style={styles.incidentsList}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={onRefresh}
              colors={[colors.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="location-off"
                size={48}
                color={colors.text.secondary}
              />
              <Text style={styles.emptyText}>
                No incidents found within {radius}km
              </Text>
              <Text style={styles.emptySubtext}>
                Try adjusting the radius or check back later
              </Text>
            </View>
          }
        />
      )}

      {/* Map toggle button */}
      <TouchableOpacity
        style={styles.mapToggle}
        onPress={() => setShowMap(!showMap)}
      >
        <MaterialIcons
          name={showMap ? 'list' : 'map'}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.mapToggleText}>
          {showMap ? 'List View' : 'Map View'}
        </Text>
      </TouchableOpacity>

      {/* Map view */}
      {showMap && (
        <View style={styles.mapContainer}>
          <WebView
            ref={mapRef}
            source={{ uri: 'https://www.google.com/maps' }}
            style={styles.map}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  radiusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: radius.round,
    ...shadows.sm,
  },
  radiusText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 5,
    fontFamily: 'Inter-SemiBold',
  },
  radiusControl: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    ...shadows.md,
  },
  radiusIncrement: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radiusLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  customRadius: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.text.muted,
  },
  radiusInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  applyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 10,
  },
  connectionText: {
    color: colors.status.warning,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    color: colors.text.muted,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
  },
  incidentsList: {
    padding: 20,
    paddingBottom: 100, // Extra padding at the bottom of the list
  },
  incidentCard: {
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 15,
    ...shadows.sm,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  incidentType: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  incidentTime: {
    color: colors.text.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  incidentDescription: {
    color: colors.text.secondary,
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentDistance: {
    color: colors.text.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mapToggle: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: radius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...shadows.md,
  },
  mapToggleText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  map: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 120,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtext: {
    color: colors.text.muted,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontFamily: 'Inter-Regular',
  },
});
