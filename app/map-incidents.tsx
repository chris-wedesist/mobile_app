import { createClient } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius, shadows } from '../constants/theme';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

type Incident = {
  id: string;
  type: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: string;
  created_at: string;
  distance?: number;
};

export default function MapIncidentsScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to view incidents on the map.'
        );
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      await fetchIncidents(location);
    })();
  }, []);

  const fetchIncidents = async (location: Location.LocationObject) => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate distances and filter incidents within 5km
      const incidentsWithDistance = data
        .map((incident: any) => ({
          ...incident,
          distance: calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            incident.location.latitude,
            incident.location.longitude
          ),
        }))
        .filter(
          (incident: Incident) => incident.distance && incident.distance <= 5
        );

      setIncidents(incidentsWithDistance);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      Alert.alert('Error', 'Failed to fetch incidents. Please try again.');
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'ICE Activity':
        return 'red';
      case 'Border Patrol Activity':
        return 'orange';
      case 'Checkpoint':
        return 'yellow';
      case 'Raid in Progress':
        return 'red';
      case 'Suspicious Vehicle':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const generateMapHtml = () => {
    const center = userLocation
      ? [userLocation.coords.longitude, userLocation.coords.latitude]
      : [-122.4324, 37.78825];

    const markers = incidents
      .map((incident) => {
        const color = getMarkerColor(incident.type);
        return `L.marker([${incident.location.latitude}, ${incident.location.longitude}], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: "<div style='background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;'></div>",
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).bindPopup('<b>${incident.type}</b><br>${incident.description}');`;
      })
      .join('\n');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incidents Map</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100%; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            var map = L.map('map').setView([${center[1]}, ${center[0]}], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors'
            }).addTo(map);
            ${markers}
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        style={styles.map}
        source={{ html: generateMapHtml() }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back to List</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
