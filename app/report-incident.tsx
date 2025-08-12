import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Alert, FlatList, Image, Modal, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, radius } from '../constants/theme';
import { createClient } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

const INCIDENT_TYPES = [
  'ICE Activity',
  'Border Patrol Activity',
  'Checkpoint',
  'Raid in Progress',
  'Suspicious Vehicle',
  'Other Activity'
];

const INCIDENT_DESCRIPTIONS = {
  'ICE Activity': [
    { label: 'Number of officers', type: 'text' },
    { label: 'Vehicle descriptions', type: 'text' },
    { label: 'Badge numbers (if visible)', type: 'text' },
    { label: 'Actions being taken', type: 'text' },
    { label: 'Witnesses present', type: 'text' }
  ],
  'Border Patrol Activity': [
    { label: 'Number of agents', type: 'text' },
    { label: 'Vehicle descriptions', type: 'text' },
    { label: 'Actions being taken', type: 'text' },
    { label: 'Checkpoint or mobile unit', type: 'text' }
  ],
  'Checkpoint': [
    { label: 'Checkpoint location', type: 'text' },
    { label: 'Type of checkpoint', type: 'text' },
    { label: 'Number of officers', type: 'text' },
    { label: 'Vehicle descriptions', type: 'text' },
    { label: 'Specific activities observed', type: 'text' }
  ],
  'Raid in Progress': [
    { label: 'Location of raid', type: 'text' },
    { label: 'Number of officers', type: 'text' },
    { label: 'Vehicle descriptions', type: 'text' },
    { label: 'Type of location (business/residence)', type: 'text' },
    { label: 'Actions being taken', type: 'text' }
  ],
  'Suspicious Vehicle': [
    { label: 'Vehicle description', type: 'text' },
    { label: 'License plate (if visible)', type: 'text' },
    { label: 'Number of occupants', type: 'text' },
    { label: 'Observed behavior', type: 'text' },
    { label: 'Direction of travel', type: 'text' }
  ],
  'Other Activity': [
    { label: 'Please describe the activity in detail', type: 'text' },
    { label: 'Location', type: 'text' },
    { label: 'Personnel involved', type: 'text' },
    { label: 'Vehicles present', type: 'text' },
    { label: 'Actions observed', type: 'text' }
  ]
};

type FormField = {
  label: string;
  type: string;
  value: string;
};

export default function ReportIncidentScreen() {
  const [selectedType, setSelectedType] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [recordings, setRecordings] = useState<any[]>([]);
  console.log("🚀 ~ ReportIncidentScreen ~ recordings:", recordings)
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoRef = useRef<ExpoVideo>(null);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Location Permission Required',
            'Please enable location access to report incidents accurately.'
          );
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setUserLocation(location);
        setSelectedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
        getAddressFromCoordinates(location.coords.latitude, location.coords.longitude);
      } catch (error) {
        console.error('Error getting location:', error);
        Alert.alert(
          'Location Error',
          'Failed to get your location. Please try again.'
        );
      }
    })();
    fetchRecordings();
  }, []);

  const generateMapHtml = () => {
    const center = selectedLocation 
      ? [selectedLocation.longitude, selectedLocation.latitude]
      : userLocation
        ? [userLocation.coords.longitude, userLocation.coords.latitude]
        : [0, 0];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Select Location</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            #map {
              width: 100%;
              height: 100%;
              position: absolute;
              top: 0;
              left: 0;
            }
            .custom-div-icon {
              background-color: #ff4757;
              border: 2px solid white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              var map = L.map('map', {
                zoomControl: true,
                dragging: true,
                doubleClickZoom: true,
                scrollWheelZoom: true,
                touchZoom: true
              }).setView([${center[1]}, ${center[0]}], 15);

              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
              }).addTo(map);

              var marker = L.marker([${center[1]}, ${center[0]}], {
                draggable: true,
                icon: L.divIcon({
                  className: 'custom-div-icon',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })
              }).addTo(map);

              function sendLocation(latlng) {
                const message = {
                  type: 'locationSelected',
                  latitude: latlng.lat,
                  longitude: latlng.lng
                };
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify(message));
                } else {
                  window.parent.postMessage(message, '*');
                }
              }

              marker.on('dragend', function(e) {
                sendLocation(marker.getLatLng());
              });

              map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                sendLocation(e.latlng);
              });

              setTimeout(function() {
                map.invalidateSize();
              }, 100);
            });
          </script>
        </body>
      </html>
    `;
  };

  const handleWebMessage = (event: MessageEvent) => {
    try {
      const data = event.data;
      if (data && data.type === 'locationSelected') {
        console.log('Location selected:', data);
        setSelectedLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
        getAddressFromCoordinates(data.latitude, data.longitude);
        setShowMap(false);
      }
    } catch (error) {
      console.error('Error handling web message:', error);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelected') {
        setSelectedLocation({
          latitude: data.latitude,
          longitude: data.longitude
        });
        getAddressFromCoordinates(data.latitude, data.longitude);
        setShowMap(false);
      }
    } catch (error) {
      console.error('Error handling webview message:', error);
    }
  };

  React.useEffect(() => {
    if (Platform.OS === 'web' && showMap) {
      window.addEventListener('message', handleWebMessage);
      return () => {
        window.removeEventListener('message', handleWebMessage);
      };
    }
  }, [showMap]);

  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    setIsLoadingAddress(true);
    try {
      const address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (address.length > 0) {
        const addr = address[0];
        const addressParts = [
          addr.street || addr.name,
          addr.city,
          addr.region,
          addr.postalCode
        ].filter(Boolean);
        setAddress(addressParts.join(', '));
      } else {
        setAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting address:', error);
      setAddress(`Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
    const fields = INCIDENT_DESCRIPTIONS[type as keyof typeof INCIDENT_DESCRIPTIONS]?.map(field => ({
      ...field,
      value: ''
    })) || [];
    setFormFields(fields);
  };

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...formFields];
    newFields[index].value = value;
    setFormFields(newFields);
  };

  const fetchRecordings = async () => {
    try {
      setIsLoadingVideos(true);

      const userRecordingsStr = await AsyncStorage.getItem('userRecordings');
      const userRecordingIds = userRecordingsStr ? JSON.parse(userRecordingsStr) : [];
      
      if (userRecordingIds.length === 0) {
        setRecordings([]);
        return;
      }

      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .in('id', userRecordingIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      Alert.alert('Error', 'Failed to load recordings');
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const toggleVideoSelection = (videoUrl: string) => {
    setSelectedVideos(prev => 
      prev.includes(videoUrl)
        ? prev.filter(url => url !== videoUrl)
        : [...prev, videoUrl]
    );
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from('incidents')
        .insert([
          {
            type: selectedType,
            description: formFields
              .map(field => `${field.label}: ${field.value}`)
              .join('\n'),
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            status: 'active',
            created_at: new Date().toISOString(),
            video_urls: selectedVideos
          }
        ])
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Incident reported successfully');
      router.push({
        pathname: '/(tabs)/incidents',
        params: { newIncident: JSON.stringify(data) }
      });
    } catch (error) {
      console.log('Error reporting incident:', error);
      Alert.alert('Error', 'Failed to report incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVideoThumbnail = (videoUrl: string) => {
    // Convert video URL to thumbnail URL (assuming Cloudinary)
    return videoUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');
  };

  const handlePlayVideo = async (videoUrl: string) => {
    try {
      setSelectedVideo(videoUrl);
      setShowVideoModal(true);
    } catch (error) {
      console.error('Error playing video:', error);
      Alert.alert('Error', 'Failed to play video. Please try again.');
    }
  };

  const handleVideoError = (error: any) => {
    console.error('Video playback error:', error);
    Alert.alert('Error', 'Failed to play video. Please try again.');
    setShowVideoModal(false);
  };

  const renderVideoItem = ({ item }: { item: any }) => {
    const isSelected = selectedVideos.includes(item.video_url);
    const thumbnailUrl = getVideoThumbnail(item.video_url);

    return (
      <TouchableOpacity
        style={[styles.videoItem, isSelected && styles.selectedVideoItem]}
        onPress={() => toggleVideoSelection(item.video_url)}
      >
        <View style={styles.videoThumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.videoThumbnail}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.playButton}
            onPress={(e) => {
              e.stopPropagation();
              handlePlayVideo(item.video_url);
            }}
          >
            <MaterialIcons name="play-arrow" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.videoInfo}>
          <MaterialIcons name="video-label" size={20} color={isSelected ? '#fff' : '#666'} />
          <Text style={[styles.videoItemText, isSelected && styles.selectedVideoItemText]}>
            Recording {new Date(item.created_at).toLocaleDateString()}
          </Text>
          {isSelected && (
            <TouchableOpacity
              style={styles.removeVideoButton}
              onPress={() => toggleVideoSelection(item.video_url)}
            >
              <MaterialIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderVideoPicker = () => {
    if (!showVideoPicker) return null;

    return (
      <View style={styles.videoPickerContainer}>
        <FlatList
  data={recordings}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={[
        styles.videoPickerItem,
        selectedVideos.includes(item.video_url) && styles.selectedVideoPickerItem
      ]}
      onPress={() => toggleVideoSelection(item.video_url)}
    >
      <MaterialIcons name="video-label" size={20} color={selectedVideos.includes(item.video_url) ? '#fff' : '#666'} />
      <Text style={[
        styles.videoPickerItemText,
        selectedVideos.includes(item.video_url) && styles.selectedVideoPickerItemText
      ]}>
        Recording {new Date(item.created_at).toLocaleDateString()}
      </Text>
      {selectedVideos.includes(item.video_url) && (
        <TouchableOpacity
          style={styles.removeVideoButton}
          onPress={() => toggleVideoSelection(item.video_url)}
        >
          <MaterialIcons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )}
  keyExtractor={(item) => item.id}
  scrollEnabled={false}  // 🔧 Important: disable scrolling here
  style={styles.videoPickerList}
/>
      </View>
    );
  };

  const renderSelectedVideos = () => {
    if (selectedVideos.length === 0) return null;

    return (
      <View style={styles.selectedVideosContainer}>
        <Text style={styles.selectedVideosTitle}>Selected Videos</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.selectedVideosScroll}
        >
          {selectedVideos.map((videoUrl, index) => {
            const recording = recordings.find(r => r.video_url === videoUrl);
            if (!recording) return null;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.selectedVideoPreview}
                onPress={() => handlePlayVideo(videoUrl)}
              >
                <Image
                  source={{ uri: getVideoThumbnail(videoUrl) }}
                  style={styles.selectedVideoThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.selectedVideoOverlay}>
                  <MaterialIcons name="play-arrow" size={24} color="#fff" />
                </View>
                <TouchableOpacity
                  style={styles.removeSelectedVideo}
                  onPress={() => toggleVideoSelection(videoUrl)}
                >
                  <MaterialIcons name="close" size={16} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Cancel</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.legalRightsButton}
        onPress={() => router.push('/legal-rights')}>
        <MaterialIcons name="verified" size={20} color="#fff" />
        <Text style={styles.legalRightsText}>Know Your Rights</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Report Activity</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Select Location</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => setShowMap(true)}
        >
          <MaterialIcons name="location-on" size={20} color="#fff" style={styles.locationIcon} />
          {isLoadingAddress ? (
            <ActivityIndicator color="#fff" size="small" style={styles.loadingIndicator} />
          ) : (
            <Text style={styles.locationText} numberOfLines={2}>
              {address || 'Tap to select location on map'}
            </Text>
          )}
        </TouchableOpacity>

        {showMap && (
          <View style={styles.mapContainer}>
            <TouchableOpacity
              style={styles.closeMapButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.closeMapButtonText}>Close Map</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
              <iframe
                srcDoc={generateMapHtml()}
                style={styles.webMap}
                allow="geolocation"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <WebView
                ref={webViewRef}
                style={styles.map}
                source={{ html: generateMapHtml() }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onMessage={handleWebViewMessage}
                originWhitelist={['*']}
                scalesPageToFit={true}
                bounces={false}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        <Text style={styles.label}>Activity Type</Text>
        <View style={styles.typeContainer}>
          {INCIDENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                selectedType === type && styles.selectedTypeButton,
              ]}
              onPress={() => handleTypeSelect(type)}>
              <MaterialIcons 
                name="error" 
                size={16} 
                color={selectedType === type ? '#fff' : '#666'} 
              />
              <Text
                style={[
                  styles.typeButtonText,
                  selectedType === type && styles.selectedTypeButtonText,
                ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedType && (
          <React.Fragment>
            <Text style={styles.label}>Details</Text>
            {formFields.map((field, index) => (
              <View key={index} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  placeholderTextColor="#666"
                  value={field.value}
                  onChangeText={(value) => handleFieldChange(index, value)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            ))}

            <Text style={styles.label}>Attach Videos</Text>
            <TouchableOpacity
              style={styles.videoPickerButton}
              onPress={() => setShowVideoPicker(!showVideoPicker)}
            >
              <View style={styles.videoPickerButtonContent}>
                <MaterialIcons name="video-label" size={20} color="#fff" />
                <Text style={styles.videoPickerButtonText}>
                  {selectedVideos.length > 0
                    ? `${selectedVideos.length} video${selectedVideos.length > 1 ? 's' : ''} selected`
                    : 'Select videos'}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            {renderVideoPicker()}
            {renderSelectedVideos()}
          </React.Fragment>
        )}

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Report Activity'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showVideoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                if (videoRef.current) {
                  videoRef.current.stopAsync();
                }
                setShowVideoModal(false);
              }}
            >
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {selectedVideo && (
              <ExpoVideo
                ref={videoRef}
                source={{ uri: selectedVideo }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                isLooping
                onError={handleVideoError}
                shouldPlay={true}
                isMuted={false}
                volume={1.0}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButtonText: {
    color: '#ff4757',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  legalRightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  legalRightsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    paddingHorizontal: 20,
    fontFamily: 'Inter-Bold',
  },
  form: {
    padding: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Inter-Medium',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
  },
  locationIcon: {
    marginRight: 10,
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  mapContainer: {
    height: 400,
    marginBottom: 20,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webMap: {
    width: '100%',
    height: '100%',
    border: 'none',
  } as any,
  loadingIndicator: {
    flex: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedTypeButton: {
    backgroundColor: '#ff4757',
    borderColor: '#ff4757',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedTypeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  fieldContainer: {
    marginBottom: 15,
  },
  fieldLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Inter-Medium',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    overflow: 'scroll',
    textAlignVertical: 'top',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  submitButton: {
    backgroundColor: '#ff4757',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  closeMapButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: radius.lg,
    zIndex: 1,
    ...shadows.sm,
  },
  closeMapButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  videosList: {
    marginBottom: 20,
  },
  videoItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  selectedVideoItem: {
    backgroundColor: '#ff4757',
    borderColor: '#ff4757',
  },
  videoItemText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  selectedVideoItemText: {
    color: '#fff',
  },
  removeVideoButton: {
    padding: 5,
  },
  noVideosText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  videoThumbnailContainer: {
    position: 'relative',
    width: '100%',
    height: 150,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: Platform.select({
      ios: Dimensions.get('window').width * (9/16),
      android: Dimensions.get('window').width * (9/16),
      default: Dimensions.get('window').height * 0.6
    }),
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  closeModalButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 5,
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
  },
  videoPickerButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 20,
  },
  videoPickerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  videoPickerButtonText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter-Regular',
  },
  videoPickerContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: radius.lg,
    marginBottom: 20,
    maxHeight: 300,
    overflow: 'hidden',
  },
  videoPickerList: {
    padding: 10,
  },
  videoPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: radius.md,
    marginBottom: 5,
    backgroundColor: '#333',
  },
  selectedVideoPickerItem: {
    backgroundColor: colors.primary,
  },
  videoPickerItemText: {
    color: '#666',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  selectedVideoPickerItemText: {
    color: '#fff',
  },
  selectedVideosContainer: {
    marginBottom: 20,
  },
  selectedVideosTitle: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Inter-Medium',
  },
  selectedVideosScroll: {
    flexDirection: 'row',
  },
  selectedVideoPreview: {
    width: 120,
    height: 80,
    marginRight: 10,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedVideoThumbnail: {
    width: '100%',
    height: '100%',
  },
  selectedVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSelectedVideo: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    padding: 4,
  },
});