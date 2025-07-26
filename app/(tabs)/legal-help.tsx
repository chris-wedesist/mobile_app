import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Linking,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { colors, shadows, radius } from '@/constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { performanceOptimizer } from '@/utils/performanceOptimizer';
import { getAttorneys, type Attorney } from '@/lib/attorneys';

type LegalHelpState = {
  searchQuery: string;
  showFilters: boolean;
  filters: {
    proBono: boolean;
    slidingScale: boolean;
    distance: boolean;
    rating: boolean;
    // New filter options
    feeStructure: string[];
    firmSize: string[];
    experienceLevel: string[];
    availability: string[];
    acceptsNewClients: boolean;
    emergencyAvailable: boolean;
    virtualConsultation: boolean;
    inPersonConsultation: boolean;
    maxConsultationFee?: number;
  };
  refreshing: boolean;
  attorneys: Attorney[];
  originalAttorneys: Attorney[]; // Keep original data separate
  userLocation: Location.LocationObject | null;
  isLoading: boolean;
  error: string | null;
  // Radius control
  radius: number; // Search radius in miles
  showRadiusControl: boolean; // Show/hide radius adjustment UI
};

const initialState: LegalHelpState = {
  searchQuery: '',
  showFilters: false,
  filters: {
    proBono: false,
    slidingScale: false,
    distance: false,
    rating: false,
    // New filter defaults
    feeStructure: [],
    firmSize: [],
    experienceLevel: [],
    availability: [],
    acceptsNewClients: false,
    emergencyAvailable: false,
    virtualConsultation: false,
    inPersonConsultation: false,
    maxConsultationFee: undefined,
  },
  refreshing: false,
  attorneys: [],
  originalAttorneys: [],
  userLocation: null,
  isLoading: true,
  error: null,
  // Radius control defaults
  radius: 25, // Default 25 mile radius
  showRadiusControl: false, // Hidden by default
};

export default function LegalHelpScreen() {
  const [state, setState] = useState<LegalHelpState>(() => ({
    ...initialState,
    attorneys: [],
    originalAttorneys: []
  }));

  const updateState = (updates: Partial<LegalHelpState>) => {
    setState(prev => ({
      ...prev,
      ...updates
    }));
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const requestLocationPermission = async () => {
    try {
      updateState({ isLoading: true, error: null });
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        updateState({ userLocation: location });
        await fetchAttorneys(location);
      } else {
        updateState({ 
          error: 'Location access is required to find attorneys near you. Please enable location services in your device settings.',
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      updateState({ 
        error: 'Failed to get location. Please check your device settings and try again.',
        isLoading: false 
      });
    }
  };

  const fetchAttorneys = async (location: Location.LocationObject, radius?: number) => {
    try {
      const searchRadius = radius ?? state.radius;
      updateState({ isLoading: true, error: null, attorneys: [], originalAttorneys: [] });
      console.log('🔍 Fetching real attorneys with location:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        radius: searchRadius
      });

      const cacheKey = `real_attorneys_${location.coords.latitude}_${location.coords.longitude}_${searchRadius}`;
      
      const attorneys = await performanceOptimizer.fetchWithCache(cacheKey, async () => {
        // Fetch real attorney data from multiple sources
        const realAttorneys = await getAttorneys(
          location.coords.latitude,
          location.coords.longitude,
          searchRadius
        );
        
        console.log('✅ Successfully fetched real attorneys:', realAttorneys.length);
        return realAttorneys;
      }, {
        key: cacheKey,
        duration: 30 * 60 * 1000 // 30 minutes cache for real attorney data
      });

      updateState({
        attorneys: attorneys,
        originalAttorneys: attorneys
      });
    } catch (error) {
      console.error('❌ Error in fetchAttorneys:', error);
      updateState({
        attorneys: [],
        originalAttorneys: [],
        error: 'Failed to fetch attorneys. Please try again.'
      });
    } finally {
      updateState({ isLoading: false });
    }
  };



  const getFilteredAttorneys = () => {
    let filtered = [...state.originalAttorneys];

    // Filter by search query
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(attorney =>
        attorney.name.toLowerCase().includes(query) ||
        attorney.specialization.toLowerCase().includes(query) ||
        attorney.languages.some(lang => lang.toLowerCase().includes(query)) ||
        attorney.detailedLocation.toLowerCase().includes(query)
      );
    }

    // Apply fee structure filters
    if (state.filters.feeStructure.length > 0) {
      filtered = filtered.filter(attorney =>
        state.filters.feeStructure.includes(attorney.feeStructure)
      );
    }

    // Apply firm size filters
    if (state.filters.firmSize.length > 0) {
      filtered = filtered.filter(attorney =>
        state.filters.firmSize.includes(attorney.firmSize)
      );
    }

    // Apply experience level filters
    if (state.filters.experienceLevel.length > 0) {
      filtered = filtered.filter(attorney => {
        const experience = attorney.experienceYears;
        return state.filters.experienceLevel.some(level => {
          switch (level) {
            case '0-5': return experience <= 5;
            case '5-10': return experience > 5 && experience <= 10;
            case '10-20': return experience > 10 && experience <= 20;
            case '20+': return experience > 20;
            default: return true;
          }
        });
      });
    }

    // Apply availability filters
    if (state.filters.availability.length > 0) {
      filtered = filtered.filter(attorney =>
        state.filters.availability.includes(attorney.availability)
      );
    }

    // Apply consultation type filters
    if (state.filters.virtualConsultation) {
      filtered = filtered.filter(attorney => attorney.virtualConsultation);
    }

    if (state.filters.inPersonConsultation) {
      filtered = filtered.filter(attorney => attorney.inPersonConsultation);
    }

    // Apply new client acceptance filter
    if (state.filters.acceptsNewClients) {
      filtered = filtered.filter(attorney => attorney.acceptsNewClients);
    }

    // Apply emergency availability filter
    if (state.filters.emergencyAvailable) {
      filtered = filtered.filter(attorney => attorney.emergencyAvailable);
    }

    // Apply consultation fee filter
    if (state.filters.maxConsultationFee !== undefined) {
      filtered = filtered.filter(attorney =>
        (attorney.consultationFee || 0) <= state.filters.maxConsultationFee!
      );
    }

    // Legacy filters (for backward compatibility)
    if (state.filters.proBono) {
      filtered = filtered.filter(attorney => attorney.feeStructure === 'pro-bono');
    }

    if (state.filters.slidingScale) {
      filtered = filtered.filter(attorney => attorney.feeStructure === 'sliding-scale');
    }

    if (state.filters.distance) {
      // Sort by distance (closest first)
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(
          state.userLocation?.coords.latitude || 0,
          state.userLocation?.coords.longitude || 0,
          a.lat,
          a.lng
        );
        const distanceB = calculateDistance(
          state.userLocation?.coords.latitude || 0,
          state.userLocation?.coords.longitude || 0,
          b.lat,
          b.lng
        );
        return distanceA - distanceB;
      });
    }

    if (state.filters.rating) {
      // Sort by rating (highest first)
      filtered.sort((a, b) => b.rating - a.rating);
    }

    // Prioritize civil rights and immigration specializations
    filtered.sort((a, b) => {
      const priorityA = getSpecializationPriority(a.specialization);
      const priorityB = getSpecializationPriority(b.specialization);
      return priorityB - priorityA; // Higher priority first
    });

    return filtered;
  };

  // Helper function to assign priority to specializations
  const getSpecializationPriority = (specialization: string): number => {
    const highPriority = ['Civil Rights Law', 'Immigration Law', 'Police Misconduct', 'Asylum & Refugee Law'];
    const mediumPriority = ['Constitutional Law', 'Deportation Defense', 'First Amendment Rights'];
    
    if (highPriority.includes(specialization)) return 3;
    if (mediumPriority.includes(specialization)) return 2;
    return 1;
  };

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  // Radius control functions
  const adjustRadius = (newRadius: number) => {
    const clampedRadius = Math.max(5, Math.min(100, newRadius)); // 5-100 mile range
    updateState({ radius: clampedRadius });
    
    // Refetch attorneys with new radius if location is available
    if (state.userLocation) {
      fetchAttorneys(state.userLocation, clampedRadius);
    }
  };

  const toggleRadiusControl = () => {
    updateState({ showRadiusControl: !state.showRadiusControl });
  };

  const increaseRadius = () => {
    adjustRadius(state.radius + 5);
  };

  const decreaseRadius = () => {
    adjustRadius(state.radius - 5);
  };

  // Update attorneys whenever search or filters change
  useEffect(() => {
    if (state.originalAttorneys.length > 0) {
      const filteredAttorneys = getFilteredAttorneys();
      updateState({ attorneys: filteredAttorneys });
    }
  }, [state.searchQuery, state.filters, state.originalAttorneys]);

  const onRefresh = async () => {
    updateState({ refreshing: true });
    if (state.userLocation) {
      await fetchAttorneys(state.userLocation, state.radius);
    }
    updateState({ refreshing: false });
  };

  const renderContent = () => {
    const attorneys = state.attorneys || [];

    if (state.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading attorneys...</Text>
        </View>
      );
    }

    if (state.error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="location-off" size={48} color={colors.text.muted} />
          <Text style={styles.errorText}>{state.error}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.retryButton, styles.settingsButton]}
              onPress={openSettings}>
              <Text style={styles.retryButtonText}>Open Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={requestLocationPermission}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (!state.userLocation) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="location-off" size={48} color={colors.text.muted} />
          <Text style={styles.errorText}>Location access is required to find attorneys near you</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={requestLocationPermission}>
            <Text style={styles.retryButtonText}>Allow Location Access</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (attorneys.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attorneys found in your area</Text>
        </View>
      );
    }

    return attorneys?.length && attorneys.map(attorney => (
      <View key={attorney.id} style={styles.attorneyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerInfo}>
            <Text style={styles.attorneyName}>{attorney.name}</Text>
            <View style={styles.ratingContainer}>
              {Array(5).fill(0).map((_, i) => (
                <MaterialIcons
                  key={i}
                  name="star"
                  size={16}
                  color={i < Math.round(attorney.rating) ? colors.accent : colors.text.muted}
                />
              ))}
              <Text style={styles.ratingText}>{attorney.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.locationContainer}>
              <MaterialIcons name="location-on" size={14} color={colors.text.muted} />
              <Text style={styles.distanceText}>{attorney.location}</Text>
            </View>
          </View>
        </View>

        {attorney.detailedLocation !== "Address not available" && (
          <View style={styles.addressContainer}>
            <MaterialIcons name="business" size={14} color={colors.text.muted} />
            <Text style={styles.addressText}>{attorney.detailedLocation}</Text>
          </View>
        )}

        {attorney.languages?.length > 0 && (
          <View style={styles.languagesContainer}>
            <MaterialIcons name="language" size={16} color={colors.text.muted} />
            <Text style={styles.languagesText}>
              {attorney.languages.join(', ')}
            </Text>
          </View>
        )}

        {/* New attorney information display */}
        <View style={styles.attorneyInfoContainer}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="work" size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>{attorney.firmSize.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="schedule" size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>{attorney.experienceYears} years</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="attach-money" size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>
                {attorney.feeStructure === 'pro-bono' ? 'Pro Bono' : 
                 attorney.feeStructure === 'sliding-scale' ? 'Sliding Scale' :
                 attorney.feeStructure.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
            {attorney.consultationFee !== undefined && attorney.consultationFee > 0 && (
              <View style={styles.infoItem}>
                <MaterialIcons name="receipt" size={14} color={colors.text.muted} />
                <Text style={styles.infoText}>${attorney.consultationFee} consultation</Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <MaterialIcons name="event" size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>
                {attorney.availability === 'immediate' ? 'Immediate' :
                 attorney.availability === 'within-week' ? 'Within Week' :
                 attorney.availability === 'within-month' ? 'Within Month' :
                 'Consultation Only'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="cases" size={14} color={colors.text.muted} />
              <Text style={styles.infoText}>{attorney.cases} cases</Text>
            </View>
          </View>

          {/* Consultation type badges */}
          <View style={styles.badgesContainer}>
            {attorney.virtualConsultation && (
              <View style={styles.badge}>
                <MaterialIcons name="videocam" size={12} color={colors.accent} />
                <Text style={styles.badgeText}>Virtual</Text>
              </View>
            )}
            {attorney.inPersonConsultation && (
              <View style={styles.badge}>
                <MaterialIcons name="person" size={12} color={colors.accent} />
                <Text style={styles.badgeText}>In-Person</Text>
              </View>
            )}
            {attorney.acceptsNewClients && (
              <View style={styles.badge}>
                <MaterialIcons name="person-add" size={12} color={colors.accent} />
                <Text style={styles.badgeText}>New Clients</Text>
              </View>
            )}
            {attorney.emergencyAvailable && (
              <View style={styles.badge}>
                <MaterialIcons name="emergency" size={12} color={colors.accent} />
                <Text style={styles.badgeText}>Emergency</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.contactContainer}>
          {attorney.phone && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL(`tel:${attorney.phone}`)}>
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          {attorney.email && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL(`mailto:${attorney.email}`)}>
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          )}
          {attorney.website && (
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => attorney.website && Linking.openURL(attorney.website)}>
              <Text style={styles.contactButtonText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Legal Help</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => updateState({ showFilters: !state.showFilters })}>
          <MaterialIcons
            name="filter-list"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search attorneys..."
          placeholderTextColor={colors.text.muted}
          value={state.searchQuery}
          onChangeText={(text) => updateState({ searchQuery: text })}
        />
      </View>

      {/* Radius Control */}
      <View style={styles.radiusContainer}>
        <View style={styles.radiusHeader}>
          <MaterialIcons name="location-on" size={20} color={colors.text.primary} />
          <Text style={styles.radiusTitle}>Search Radius</Text>
          <TouchableOpacity
            style={styles.radiusToggleButton}
            onPress={toggleRadiusControl}>
            <MaterialIcons
              name={state.showRadiusControl ? "expand-less" : "expand-more"}
              size={20}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.radiusDisplay}>
          <Text style={styles.radiusText}>{state.radius} miles</Text>
        </View>

        {state.showRadiusControl && (
          <View style={styles.radiusControlContainer}>
            <View style={styles.radiusButtonsContainer}>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={decreaseRadius}
                disabled={state.radius <= 5}>
                <MaterialIcons
                  name="remove"
                  size={20}
                  color={state.radius <= 5 ? colors.text.muted : colors.text.primary}
                />
              </TouchableOpacity>
              
              <View style={styles.radiusSliderContainer}>
                <Text style={styles.radiusLabel}>5 - 100 miles</Text>
                <View style={styles.radiusSlider}>
                  <View 
                    style={[
                      styles.radiusSliderFill, 
                      { width: `${((state.radius - 5) / 95) * 100}%` }
                    ]} 
                  />
                </View>
              </View>
              
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={increaseRadius}
                disabled={state.radius >= 100}>
                <MaterialIcons
                  name="add"
                  size={20}
                  color={state.radius >= 100 ? colors.text.muted : colors.text.primary}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.radiusPresetsContainer}>
              <TouchableOpacity
                style={[styles.radiusPreset, state.radius === 10 && styles.radiusPresetActive]}
                onPress={() => adjustRadius(10)}>
                <Text style={[styles.radiusPresetText, state.radius === 10 && styles.radiusPresetTextActive]}>10 mi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radiusPreset, state.radius === 25 && styles.radiusPresetActive]}
                onPress={() => adjustRadius(25)}>
                <Text style={[styles.radiusPresetText, state.radius === 25 && styles.radiusPresetTextActive]}>25 mi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radiusPreset, state.radius === 50 && styles.radiusPresetActive]}
                onPress={() => adjustRadius(50)}>
                <Text style={[styles.radiusPresetText, state.radius === 50 && styles.radiusPresetTextActive]}>50 mi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.radiusPreset, state.radius === 100 && styles.radiusPresetActive]}
                onPress={() => adjustRadius(100)}>
                <Text style={[styles.radiusPresetText, state.radius === 100 && styles.radiusPresetTextActive]}>100 mi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {state.showFilters && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScrollContainer}>
          <View style={styles.filtersContainer}>
            {/* Fee Structure Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Fee Structure</Text>
              <View style={styles.filterChipsRow}>
                {[
                  { key: 'pro-bono', label: 'Pro Bono', icon: 'check-circle' },
                  { key: 'sliding-scale', label: 'Sliding Scale', icon: 'attach-money' },
                  { key: 'contingency', label: 'Contingency', icon: 'trending-up' },
                  { key: 'flat-fee', label: 'Flat Fee', icon: 'receipt' },
                  { key: 'hourly', label: 'Hourly', icon: 'schedule' },
                  { key: 'mixed', label: 'Mixed', icon: 'swap-horiz' }
                ].map(({ key, label, icon }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterChip,
                      state.filters.feeStructure.includes(key) && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      const newFeeStructure = state.filters.feeStructure.includes(key)
                        ? state.filters.feeStructure.filter(f => f !== key)
                        : [...state.filters.feeStructure, key];
                      updateState({
                        filters: { ...state.filters, feeStructure: newFeeStructure },
                      });
                    }}>
                    <MaterialIcons
                      name={icon as any}
                      size={16}
                      color={state.filters.feeStructure.includes(key) ? colors.accent : colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        state.filters.feeStructure.includes(key) && styles.filterChipTextActive,
                      ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Firm Size Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Firm Size</Text>
              <View style={styles.filterChipsRow}>
                {[
                  { key: 'solo', label: 'Solo Practice', icon: 'person' },
                  { key: 'small-firm', label: 'Small Firm', icon: 'group' },
                  { key: 'large-firm', label: 'Large Firm', icon: 'business' }
                ].map(({ key, label, icon }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterChip,
                      state.filters.firmSize.includes(key) && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      const newFirmSize = state.filters.firmSize.includes(key)
                        ? state.filters.firmSize.filter(f => f !== key)
                        : [...state.filters.firmSize, key];
                      updateState({
                        filters: { ...state.filters, firmSize: newFirmSize },
                      });
                    }}>
                    <MaterialIcons
                      name={icon as any}
                      size={16}
                      color={state.filters.firmSize.includes(key) ? colors.accent : colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        state.filters.firmSize.includes(key) && styles.filterChipTextActive,
                      ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Level Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Experience</Text>
              <View style={styles.filterChipsRow}>
                {[
                  { key: '0-5', label: '0-5 Years', icon: 'school' },
                  { key: '5-10', label: '5-10 Years', icon: 'work' },
                  { key: '10-20', label: '10-20 Years', icon: 'star' },
                  { key: '20+', label: '20+ Years', icon: 'verified' }
                ].map(({ key, label, icon }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterChip,
                      state.filters.experienceLevel.includes(key) && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      const newExperienceLevel = state.filters.experienceLevel.includes(key)
                        ? state.filters.experienceLevel.filter(f => f !== key)
                        : [...state.filters.experienceLevel, key];
                      updateState({
                        filters: { ...state.filters, experienceLevel: newExperienceLevel },
                      });
                    }}>
                    <MaterialIcons
                      name={icon as any}
                      size={16}
                      color={state.filters.experienceLevel.includes(key) ? colors.accent : colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        state.filters.experienceLevel.includes(key) && styles.filterChipTextActive,
                      ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Availability Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Availability</Text>
              <View style={styles.filterChipsRow}>
                {[
                  { key: 'immediate', label: 'Immediate', icon: 'flash-on' },
                  { key: 'within-week', label: 'Within Week', icon: 'today' },
                  { key: 'within-month', label: 'Within Month', icon: 'event' },
                  { key: 'consultation-only', label: 'Consultation Only', icon: 'chat' }
                ].map(({ key, label, icon }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.filterChip,
                      state.filters.availability.includes(key) && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      const newAvailability = state.filters.availability.includes(key)
                        ? state.filters.availability.filter(f => f !== key)
                        : [...state.filters.availability, key];
                      updateState({
                        filters: { ...state.filters, availability: newAvailability },
                      });
                    }}>
                    <MaterialIcons
                      name={icon as any}
                      size={16}
                      color={state.filters.availability.includes(key) ? colors.accent : colors.text.muted}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        state.filters.availability.includes(key) && styles.filterChipTextActive,
                      ]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Consultation Type Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Consultation Type</Text>
              <View style={styles.filterChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    state.filters.virtualConsultation && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    updateState({
                      filters: { ...state.filters, virtualConsultation: !state.filters.virtualConsultation },
                    })
                  }>
                  <MaterialIcons
                    name="videocam"
                    size={16}
                    color={state.filters.virtualConsultation ? colors.accent : colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      state.filters.virtualConsultation && styles.filterChipTextActive,
                    ]}>
                    Virtual
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    state.filters.inPersonConsultation && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    updateState({
                      filters: { ...state.filters, inPersonConsultation: !state.filters.inPersonConsultation },
                    })
                  }>
                  <MaterialIcons
                    name="person"
                    size={16}
                    color={state.filters.inPersonConsultation ? colors.accent : colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      state.filters.inPersonConsultation && styles.filterChipTextActive,
                    ]}>
                    In-Person
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Additional Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Additional</Text>
              <View style={styles.filterChipsRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    state.filters.acceptsNewClients && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    updateState({
                      filters: { ...state.filters, acceptsNewClients: !state.filters.acceptsNewClients },
                    })
                  }>
                  <MaterialIcons
                    name="person-add"
                    size={16}
                    color={state.filters.acceptsNewClients ? colors.accent : colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      state.filters.acceptsNewClients && styles.filterChipTextActive,
                    ]}>
                    Accepts New Clients
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    state.filters.emergencyAvailable && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    updateState({
                      filters: { ...state.filters, emergencyAvailable: !state.filters.emergencyAvailable },
                    })
                  }>
                  <MaterialIcons
                    name="emergency"
                    size={16}
                    color={state.filters.emergencyAvailable ? colors.accent : colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      state.filters.emergencyAvailable && styles.filterChipTextActive,
                    ]}>
                    Emergency Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    state.filters.distance && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    updateState({
                      filters: { ...state.filters, distance: !state.filters.distance },
                    })
                  }>
                  <MaterialIcons
                    name="location-on"
                    size={16}
                    color={state.filters.distance ? colors.accent : colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      state.filters.distance && styles.filterChipTextActive,
                    ]}>
                    Sort by Distance
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    state.filters.rating && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    updateState({
                      filters: { ...state.filters, rating: !state.filters.rating },
                    })
                  }>
                  <MaterialIcons
                    name="star"
                    size={16}
                    color={state.filters.rating ? colors.accent : colors.text.muted}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      state.filters.rating && styles.filterChipTextActive,
                    ]}>
                    Sort by Rating
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }>
        {renderContent()}
        
        {state.attorneys.length > 0 && (  
          <TouchableOpacity onPress={() => Linking.openURL('mailto:chrisrashadmitchell@gmail.com')}>
            <Text style={styles.addAttorneyText}>Become the top attorney in the list? <Text style={styles.addAttorneyHighlightedText} onPress={() => Linking.openURL('mailto:admin@wedesit.com')}>Contact Admin.</Text></Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  filterButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: radius.round,
    ...shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    borderRadius: radius.lg,
    marginBottom: 15,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: 12,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filtersScrollContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    maxWidth: 120,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    color: colors.text.muted,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  filterChipTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20, // Add padding to account for tab bar
  },
  attorneyCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
  },
  attorneyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.text.primary,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  statText: {
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 4,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  languagesText: {
    fontSize: 14,
    color: colors.text.muted,
    marginLeft: 4,
  },
  attorneyInfoContainer: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: colors.text.muted,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    color: colors.accent,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  contactButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  contactButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  addAttorneyText: {
    color: colors.text.primary,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  addAttorneyHighlightedText: {
    color: colors.accent,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: colors.text.primary,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButton: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  // Radius control styles
  radiusContainer: {
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: radius.lg,
    padding: 15,
    ...shadows.sm,
  },
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  radiusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginLeft: 8,
  },
  radiusToggleButton: {
    padding: 4,
  },
  radiusDisplay: {
    alignItems: 'center',
    marginBottom: 10,
  },
  radiusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.accent,
    fontFamily: 'Inter-Bold',
  },
  radiusControlContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.text.muted,
    paddingTop: 15,
  },
  radiusButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  radiusButton: {
    backgroundColor: colors.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  radiusSliderContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  radiusLabel: {
    fontSize: 12,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Inter-Regular',
  },
  radiusSlider: {
    height: 4,
    backgroundColor: colors.text.muted,
    borderRadius: 2,
    position: 'relative',
  },
  radiusSliderFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  radiusPresetsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radiusPreset: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.text.muted,
  },
  radiusPresetActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  radiusPresetText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },
  radiusPresetTextActive: {
    color: colors.text.primary,
    fontFamily: 'Inter-SemiBold',
  },
});