import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, ScrollView, ActivityIndicator, Alert, FlatList, Image, Modal, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { colors, shadows, radius } from '@/constants/theme';
import { createClient } from '@supabase/supabase-js';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useRecording } from '@/contexts/RecordingContext';
import { checkIncidentRestrictions, getUserCurrentLocation, isUserVerified } from '@/utils/incident-restrictions';
import { sendIncidentNotificationToNearbyUsers } from '@/utils/push-notifications';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useLanguage } from '@/contexts/LanguageContext';

const supabase = createClient(
  'https://tscvzrxnxadnvgnsdrqx.supabase.co'!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzY3Z6cnhueGFkbnZnbnNkcnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3NDcxMjgsImV4cCI6MjA2MDMyMzEyOH0.cvE6KoZXbSnigKUpbFzFwLtN-O6H4SxIyu5bn9rU1lY'!
);

type FormField = {
  label: string;
  type: string;
  value: string;
};

export default function ReportIncidentScreen() {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const { setIsRecording: setGlobalRecording } = useRecording();
  const [selectedType, setSelectedType] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const INCIDENT_TYPES = [
    t.reportIncident.incidentTypes.iceActivity,
    t.reportIncident.incidentTypes.borderPatrolActivity,
    t.reportIncident.incidentTypes.checkpoint,
    t.reportIncident.incidentTypes.raidInProgress,
    t.reportIncident.incidentTypes.suspiciousVehicle,
    t.reportIncident.incidentTypes.otherActivity,
  ];

  const getIncidentDescriptions = () => ({
    [t.reportIncident.incidentTypes.iceActivity]: [
      { label: t.reportIncident.incidentDescriptions.iceActivity.numberOfOfficers, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.iceActivity.vehicleDescriptions, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.iceActivity.badgeNumbers, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.iceActivity.actionsBeingTaken, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.iceActivity.witnessesPresent, type: 'text' },
    ],
    [t.reportIncident.incidentTypes.borderPatrolActivity]: [
      { label: t.reportIncident.incidentDescriptions.borderPatrolActivity.numberOfAgents, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.borderPatrolActivity.vehicleDescriptions, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.borderPatrolActivity.actionsBeingTaken, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.borderPatrolActivity.checkpointOrMobile, type: 'text' },
    ],
    [t.reportIncident.incidentTypes.checkpoint]: [
      { label: t.reportIncident.incidentDescriptions.checkpoint.checkpointLocation, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.checkpoint.typeOfCheckpoint, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.checkpoint.numberOfOfficers, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.checkpoint.vehicleDescriptions, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.checkpoint.specificActivities, type: 'text' },
    ],
    [t.reportIncident.incidentTypes.raidInProgress]: [
      { label: t.reportIncident.incidentDescriptions.raidInProgress.locationOfRaid, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.raidInProgress.numberOfOfficers, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.raidInProgress.vehicleDescriptions, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.raidInProgress.typeOfLocation, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.raidInProgress.actionsBeingTaken, type: 'text' },
    ],
    [t.reportIncident.incidentTypes.suspiciousVehicle]: [
      { label: t.reportIncident.incidentDescriptions.suspiciousVehicle.vehicleDescription, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.suspiciousVehicle.licensePlate, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.suspiciousVehicle.numberOfOccupants, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.suspiciousVehicle.observedBehavior, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.suspiciousVehicle.directionOfTravel, type: 'text' },
    ],
    [t.reportIncident.incidentTypes.otherActivity]: [
      { label: t.reportIncident.incidentDescriptions.otherActivity.describeActivity, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.otherActivity.location, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.otherActivity.personnelInvolved, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.otherActivity.vehiclesPresent, type: 'text' },
      { label: t.reportIncident.incidentDescriptions.otherActivity.actionsObserved, type: 'text' },
    ],
  });
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
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const recordingPromiseRef = useRef<Promise<any> | null>(null);

  // Cloudinary configuration
  const CLOUDINARY_CLOUD_NAME = 'do0qfrr5y';
  const CLOUDINARY_UPLOAD_PRESET = 'desist';

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            t.reportIncident.locationPermissionRequired,
            t.reportIncident.locationPermissionMessage
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
          t.reportIncident.locationError,
          t.reportIncident.locationErrorMessage
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
          <title>${t.reportIncident.selectLocationTitle}</title>
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
    const descriptions = getIncidentDescriptions();
    const fields = descriptions[type as keyof typeof descriptions]?.map(field => ({
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
      Alert.alert(t.errors.error, t.reportIncident.loadRecordingsFailed);
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

  const handleRecordVideo = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(t.reportIncident.notAvailable, t.reportIncident.videoRecordingMobileOnly);
      return;
    }

    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert(t.reportIncident.permissionRequired, t.reportIncident.cameraPermissionRequired);
        return;
      }
    }

    setShowCamera(true);
  };

  const handleUploadVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets[0]) {
        await uploadVideoToCloudinary(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    }
  };

  const uploadVideoToCloudinary = async (videoUri: string) => {
    try {
      setIsLoadingVideos(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: videoUri,
        type: 'video/mp4',
        name: `recording-${Date.now()}.mp4`,
      } as any);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET || '');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        // Save to Supabase
        const { data: recordingData, error } = await supabase
          .from('recordings')
          .insert([
            {
              video_url: data.secure_url,
              created_at: new Date().toISOString(),
              status: 'completed'
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Update local storage
        try {
          const existingRecordings = await AsyncStorage.getItem('userRecordings');
          const recordings = existingRecordings ? JSON.parse(existingRecordings) : [];
          recordings.push(recordingData.id);
          await AsyncStorage.setItem('userRecordings', JSON.stringify(recordings));
        } catch (storageError) {
          console.error('Error saving to local storage:', storageError);
        }

        // Refresh recordings list
        await fetchRecordings();
        
        // Automatically select the newly uploaded video
        setSelectedVideos(prev => [...prev, data.secure_url]);
        
        Alert.alert(t.common.success, t.reportIncident.videoUploaded);
      } else {
        throw new Error('No secure URL returned from Cloudinary');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert(t.errors.error, t.reportIncident.videoUploadFailed);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const prepareRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        if (audioStatus !== 'granted') {
          throw new Error('Audio recording permission is required');
        }
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      return true;
    } catch (error) {
      console.error('Preparation failed:', error);
      return false;
    }
  };

  const startVideoRecording = async () => {
    if (!cameraRef.current || isRecordingVideo) return;

    try {
      const prepared = await prepareRecording();
      if (!prepared) {
        Alert.alert(t.errors.error, t.reportIncident.recordingFailed);
        return;
      }

      setIsRecordingVideo(true);
      setGlobalRecording(true);
      recordingPromiseRef.current = cameraRef.current.recordAsync({
        maxDuration: 300, // 5 minutes
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert(t.errors.error, t.reportIncident.startRecordingFailed);
      setIsRecordingVideo(false);
      setGlobalRecording(false);
    }
  };

  const stopVideoRecording = async () => {
    if (!isRecordingVideo || !cameraRef.current) return;

    try {
      setIsRecordingVideo(false);
      setGlobalRecording(false);
      await cameraRef.current.stopRecording();
      
      if (recordingPromiseRef.current) {
        const video = await recordingPromiseRef.current;
        
        if (video?.uri) {
          await uploadVideoToCloudinary(video.uri);
          setShowCamera(false);
          setGlobalRecording(false);
        } else {
          throw new Error('No video URI returned');
        }
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert(t.errors.error, t.reportIncident.saveRecordingFailed);
      setIsRecordingVideo(false);
      setGlobalRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert(t.errors.error, t.reportIncident.selectLocation);
      return;
    }

    if (!user) {
      Alert.alert(t.errors.error, t.reportIncident.mustBeLoggedIn);
      return;
    }

    try {
      setIsSubmitting(true);

      // Get user's current location for verification
      const userLocation = await getUserCurrentLocation();
      
      // Check incident reporting restrictions
      const restrictionResult = await checkIncidentRestrictions(
        user,
        userLocation,
        selectedLocation
      );

      if (!restrictionResult.canReport) {
        Alert.alert(t.reportIncident.cannotReport, restrictionResult.reason);
        setIsSubmitting(false);
        return;
      }

      // If restrictions are passed, proceed with incident submission
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
            video_urls: selectedVideos,
            user_id: user.id,
            user_email: user.email,
            user_name: userProfile?.full_name || user.user_metadata?.full_name || 'Anonymous'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      const successMessage = restrictionResult.remainingReports 
        ? `${t.reportIncident.incidentReported} ${t.common.youHave} ${restrictionResult.remainingReports - 1} ${t.reportIncident.reportsRemaining}`
        : t.reportIncident.incidentReported;

      Alert.alert(t.common.success, successMessage);

      // Send push notifications to nearby users
      try {
        await sendIncidentNotificationToNearbyUsers(
          selectedLocation.latitude,
          selectedLocation.longitude,
          selectedType,
          data.id,
          50 // 50 mile radius
        );
        console.log('Push notifications sent to nearby users');
      } catch (pushError) {
        console.error('Error sending push notifications:', pushError);
        // Don't fail the incident report if push notifications fail
      }

      router.push({
        pathname: '/(tabs)/incidents',
        params: { newIncident: JSON.stringify(data) }
      });
    } catch (error) {
      console.log('Error reporting incident:', error);
      Alert.alert(t.errors.error, t.errors.failedToSave);
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
        {/* Action Buttons */}
        <View style={styles.videoActionButtons}>
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={handleRecordVideo}
            disabled={Platform.OS === 'web'}
          >
            <MaterialIcons name="videocam" size={24} color="#fff" />
            <Text style={styles.videoActionButtonText}>{t.reportIncident.recordVideo}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.videoActionButton}
            onPress={handleUploadVideo}
          >
            <MaterialIcons name="upload" size={24} color="#fff" />
            <Text style={styles.videoActionButtonText}>{t.reportIncident.uploadVideo}</Text>
          </TouchableOpacity>
        </View>

        {/* Existing Videos List */}
        {recordings.length > 0 && (
          <View style={styles.existingVideosSection}>
            <Text style={styles.existingVideosTitle}>{t.reportIncident.existingRecordings}</Text>
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
                    {t.record.recording} {new Date(item.created_at).toLocaleDateString()}
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
              scrollEnabled={false}
              style={styles.videoPickerList}
            />
          </View>
        )}
      </View>
    );
  };

  const renderSelectedVideos = () => {
    if (selectedVideos.length === 0) return null;

    return (
      <View style={styles.selectedVideosContainer}>
        <Text style={styles.selectedVideosTitle}>{t.common.selectedVideos}</Text>
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
        <Text style={styles.backButtonText}>{t.common.cancel}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.legalRightsButton}
        onPress={() => router.push('/legal-rights')}>
        <MaterialIcons name="verified" size={20} color="#fff" />
        <Text style={styles.legalRightsText}>{t.legalHelp.knowYourRights}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t.reportIncident.title}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>{t.reportIncident.location}</Text>
        <TouchableOpacity 
          style={styles.locationButton}
          onPress={() => setShowMap(true)}
        >
          <MaterialIcons name="location-on" size={20} color="#fff" style={styles.locationIcon} />
          {isLoadingAddress ? (
            <ActivityIndicator color="#fff" size="small" style={styles.loadingIndicator} />
          ) : (
            <Text style={styles.locationText} numberOfLines={2}>
              {address || t.reportIncident.selectLocation}
            </Text>
          )}
        </TouchableOpacity>

        {showMap && (
          <View style={styles.mapContainer}>
            <TouchableOpacity
              style={styles.closeMapButton}
              onPress={() => setShowMap(false)}
            >
              <Text style={styles.closeMapButtonText}>{t.common.close}</Text>
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

        <Text style={styles.label}>{t.reportIncident.selectType}</Text>
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
            <Text style={styles.label}>{t.reportIncident.description}</Text>
            {formFields.map((field, index) => (
              <View key={index} style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={`${t.common.enter} ${field.label.toLowerCase()}...`}
                  placeholderTextColor="#666"
                  value={field.value}
                  onChangeText={(value) => handleFieldChange(index, value)}
                  multiline
                  numberOfLines={2}
                />
              </View>
            ))}

            <Text style={styles.label}>{t.reportIncident.selectVideo}</Text>
            <TouchableOpacity
              style={styles.videoPickerButton}
              onPress={() => setShowVideoPicker(!showVideoPicker)}
            >
              <View style={styles.videoPickerButtonContent}>
                <MaterialIcons name="video-label" size={20} color="#fff" />
                <Text style={styles.videoPickerButtonText}>
                  {selectedVideos.length > 0
                    ? `${selectedVideos.length} ${selectedVideos.length > 1 ? t.common.videos : t.common.video} ${t.common.selected}`
                    : t.reportIncident.selectVideo}
                </Text>
                <MaterialIcons name="chevron-right" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            {renderVideoPicker()}
            {renderSelectedVideos()}
          </React.Fragment>
        )}

        {/* Verification Warning */}
        {user && !isUserVerified(user) && (
          <View style={styles.warningContainer}>
            <MaterialIcons name="warning" size={20} color={colors.status.warning} />
            <Text style={styles.warningText}>
              {t.errors.mustBeVerified || 'Only verified users can report incidents. Please verify your email address.'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.submitButton, 
            isSubmitting && styles.submitButtonDisabled,
            user && !isUserVerified(user) && styles.submitButtonDisabledUnverified
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting || (user ? !isUserVerified(user) : false)}>
          <Text style={styles.submitButtonText}>
            {isSubmitting ? t.reportIncident.submitting : t.reportIncident.submit}
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

      {/* Camera Modal for Recording */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => {
          if (!isRecordingVideo) {
            setShowCamera(false);
          }
        }}
      >
        <View style={styles.cameraContainer}>
          {cameraPermission?.granted ? (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.cameraView}
                mode="video"
                videoStabilizationMode="standard"
              />
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraCloseButton}
                  onPress={() => {
                    if (!isRecordingVideo) {
                      setShowCamera(false);
                      setGlobalRecording(false);
                    } else {
                      Alert.alert(
                        'Recording in Progress',
                        'Please stop recording before closing.',
                        [{ text: 'OK' }]
                      );
                    }
                  }}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.cameraRecordControls}>
                  {!isRecordingVideo ? (
                    <TouchableOpacity
                      style={styles.recordButton}
                      onPress={startVideoRecording}
                    >
                      <View style={styles.recordButtonInner} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.stopButton}
                      onPress={stopVideoRecording}
                    >
                      <View style={styles.stopButtonInner} />
                    </TouchableOpacity>
                  )}
                </View>
                
                {isRecordingVideo && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Recording...</Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.cameraPermissionContainer}>
              <MaterialIcons name="videocam-off" size={64} color="#666" />
              <Text style={styles.cameraPermissionText}>
                Camera permission is required to record videos.
              </Text>
              <TouchableOpacity
                style={styles.cameraPermissionButton}
                onPress={requestCameraPermission}
              >
                <Text style={styles.cameraPermissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
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
  submitButtonDisabledUnverified: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Inter-Regular',
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
  videoActionButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  videoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: radius.md,
    gap: 8,
  },
  videoActionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  existingVideosSection: {
    paddingTop: 10,
  },
  existingVideosTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 15,
    fontFamily: 'Inter-SemiBold',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraView: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  cameraCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
  cameraRecordControls: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ff4757',
  },
  stopButton: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#ff4757',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButtonInner: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4757',
    marginRight: 8,
  },
  recordingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  cameraPermissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    fontFamily: 'Inter-Regular',
  },
  cameraPermissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: radius.lg,
  },
  cameraPermissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});