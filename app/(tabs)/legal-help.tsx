import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, shadows, tagColors } from '../../constants/theme';
import { searchAttorneys, type Attorney, type AttorneyTag } from '../../lib/attorneys';
import { performanceOptimizer } from '../../utils/performanceOptimizer';

type LegalHelpState = {
  searchQuery: string;
  showFilters: boolean;
  filters: {
    // Google Places API based filters
    rating: {
      enabled: boolean;
      minRating: number;
    };
    reviews: {
      enabled: boolean;
      minReviews: number;
    };
    distance: {
      enabled: boolean;
      maxDistance: number;
    };
    priceLevel: {
      enabled: boolean;
      maxLevel: number;
    };
    openNow: boolean;
    verified: boolean;
    selectedTags: AttorneyTag[];
  };
  refreshing: boolean;
  attorneys: Attorney[];
  originalAttorneys: Attorney[];
  userLocation: Location.LocationObject | null;
  isLoading: boolean;
  error: string | null;
  radius: number;
  showRadiusControl: boolean;
};

const initialState: LegalHelpState = {
  searchQuery: '',
  showFilters: false,
  filters: {
    rating: {
      enabled: false,
      minRating: 4.0,
    },
    reviews: {
      enabled: false,
      minReviews: 10,
    },
    distance: {
      enabled: false,
      maxDistance: 25,
    },
    priceLevel: {
      enabled: false,
      maxLevel: 3,
    },
    openNow: false,
    verified: false,
    selectedTags: [],
  },
  refreshing: false,
  attorneys: [],
  originalAttorneys: [],
  userLocation: null,
  isLoading: true,
  error: null,
  radius: 10,
  showRadiusControl: false,
};

export default function LegalHelpScreen() {
  const [state, setState] = useState<LegalHelpState>(() => ({
    ...initialState,
    attorneys: [],
    originalAttorneys: [],
  }));

  // Debounce timer for radius adjustments
  const radiusDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateState = (updates: Partial<LegalHelpState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getFilteredAttorneys = () => {
    if (!state.originalAttorneys?.length) return [];

    let filtered = [...state.originalAttorneys];

    // Apply search query filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (attorney) =>
          attorney.name.toLowerCase().includes(query) ||
          attorney.location.address.toLowerCase().includes(query) ||
          attorney.detailedLocation?.toLowerCase().includes(query) ||
          attorney.languages?.some((lang) => lang.toLowerCase().includes(query))
      );
    }

    // Apply Google Places API based filters
    if (state.filters.rating.enabled) {
      filtered = filtered.filter((attorney) => attorney.rating >= state.filters.rating.minRating);
    }

    if (state.filters.reviews.enabled) {
      filtered = filtered.filter((attorney) => attorney.userRatingsTotal >= state.filters.reviews.minReviews);
    }

    if (state.filters.distance.enabled && state.userLocation) {
      filtered = filtered.filter((attorney) => {
        if (!attorney.lat || !attorney.lng) return true;
        const distance = calculateDistance(
          state.userLocation!.coords.latitude,
          state.userLocation!.coords.longitude,
          attorney.lat,
          attorney.lng
        );
        return distance / 1609.34 <= state.filters.distance.maxDistance; // Convert to miles
      });
    }

    if (state.filters.priceLevel.enabled) {
      filtered = filtered.filter((attorney) => {
        return attorney.priceLevel <= state.filters.priceLevel.maxLevel;
      });
    }

    if (state.filters.openNow) {
      filtered = filtered.filter((attorney) => attorney.openingHours?.openNow === true);
    }

    if (state.filters.verified) {
      filtered = filtered.filter((attorney) => attorney.businessStatus === 'OPERATIONAL');
    }

    if (state.filters.selectedTags.length > 0) {
      filtered = filtered.filter((attorney) => {
        return attorney.tags?.some(tag => state.filters.selectedTags.includes(tag));
      });
    }

    return filtered;
  };

  const loadAttorneys = async () => {
    try {
      updateState({ isLoading: true, error: null });

      let location: Location.LocationObject | null = null;
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        try {
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          updateState({ userLocation: location });
        } catch (locationError) {
          console.warn('Failed to get location:', locationError);
        }
      }

      const attorneys = await searchAttorneys(
        location ? `${location.coords.latitude},${location.coords.longitude}` : 'current location',
        state.radius * 1609.34 // Convert miles to meters
      );

      updateState({
        attorneys: attorneys || [],
        originalAttorneys: attorneys || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading attorneys:', error);
      updateState({
        error: 'Failed to load attorneys. Please try again.',
        isLoading: false,
      });
    }
  };

  const onRefresh = async () => {
    updateState({ refreshing: true });
    await loadAttorneys();
    updateState({ refreshing: false });
  };

  const toggleRadiusControl = () => {
    updateState({ showRadiusControl: !state.showRadiusControl });
  };

  useEffect(() => {
    loadAttorneys();
  }, []);

  // Debounced radius change effect
  useEffect(() => {
    if (radiusDebounceRef.current) {
      clearTimeout(radiusDebounceRef.current);
    }

    radiusDebounceRef.current = setTimeout(() => {
      loadAttorneys();
    }, 500);

    return () => {
      if (radiusDebounceRef.current) {
        clearTimeout(radiusDebounceRef.current);
      }
    };
  }, [state.radius]);

  // Filter attorneys when filters change
  useEffect(() => {
    updateState({ attorneys: getFilteredAttorneys() });
  }, [state.searchQuery, state.filters, state.originalAttorneys]);

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Finding attorneys near you...</Text>
        </View>
      );
    }

    if (state.error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Unable to Load Attorneys</Text>
          <Text style={styles.errorMessage}>{state.error}</Text>
          <Text style={styles.errorSuggestions}>
            This may be due to:
            {'\n'}• Network connectivity issues
            {'\n'}• Location services being disabled
            {'\n'}• Temporary unavailability of our data sources
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadAttorneys}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      state.attorneys?.length &&
      state.attorneys.map((attorney) => (
        <View key={attorney.id} style={styles.attorneyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.attorneyName}>{attorney.name}</Text>
              <View style={styles.ratingContainer}>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <MaterialIcons
                      key={i}
                      name="star"
                      size={16}
                      color={
                        i < Math.round(attorney.rating)
                          ? colors.accent
                          : colors.text.muted
                      }
                    />
                  ))}
                <Text style={styles.ratingText}>
                  {attorney.rating.toFixed(1)}
                </Text>
              </View>
              <View style={styles.locationContainer}>
                <MaterialIcons
                  name="location-on"
                  size={14}
                  color={colors.text.muted}
                />
                <Text style={styles.distanceText}>
                  {attorney.location.address}
                </Text>
                {state.userLocation && attorney.lat && attorney.lng && (
                  <Text style={styles.distanceIndicator}>
                    {(
                      calculateDistance(
                        state.userLocation.coords.latitude,
                        state.userLocation.coords.longitude,
                        attorney.lat,
                        attorney.lng
                      ) / 1609.34
                    ).toFixed(1)}{' '}
                    mi away
                  </Text>
                )}
              </View>
            </View>
          </View>

          {attorney.detailedLocation !== 'Address not available' && (
            <View style={styles.addressContainer}>
              <MaterialIcons
                name="business"
                size={14}
                color={colors.text.muted}
              />
              <Text style={styles.addressText}>
                {attorney.detailedLocation}
              </Text>
            </View>
          )}

          {attorney.languages?.length > 0 && (
            <View style={styles.languagesContainer}>
              <MaterialIcons
                name="language"
                size={16}
                color={colors.text.muted}
              />
              <Text style={styles.languagesText}>
                {attorney.languages.join(', ')}
              </Text>
            </View>
          )}

          {/* Attorney Tags - Google Places API based filtering */}
          {attorney.tags && attorney.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {attorney.tags.map((tag, index) => {
                const tagColor = tagColors[tag];
                return (
                  <View
                    key={index}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: tagColor.background,
                        borderColor: tagColor.border,
                      },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: tagColor.text }]}>
                      {tag
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Essential Information Display */}
          <View style={styles.essentialInfoContainer}>
            {attorney.phone && (
              <View style={styles.infoItem}>
                <MaterialIcons
                  name="phone"
                  size={14}
                  color={colors.text.muted}
                />
                <Text style={styles.infoText}>{attorney.phone}</Text>
              </View>
            )}
            {attorney.website && (
              <View style={styles.infoItem}>
                <MaterialIcons
                  name="language"
                  size={14}
                  color={colors.text.muted}
                />
                <Text style={styles.infoText}>Website Available</Text>
              </View>
            )}
          </View>

          <View style={styles.contactContainer}>
            {attorney.phone && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => Linking.openURL(`tel:${attorney.phone}`)}
              >
                <Text style={styles.contactButtonText}>📞 Call</Text>
              </TouchableOpacity>
            )}
            {attorney.email && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => Linking.openURL(`mailto:${attorney.email}`)}
              >
                <Text style={styles.contactButtonText}>📧 Email</Text>
              </TouchableOpacity>
            )}
            {attorney.website && (
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() =>
                  attorney.website && Linking.openURL(attorney.website)
                }
              >
                <Text style={styles.contactButtonText}>🌐 Website</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Legal Help</Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => updateState({ showFilters: !state.showFilters })}
        >
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
          <MaterialIcons
            name="location-on"
            size={20}
            color={colors.text.primary}
          />
          <Text style={styles.radiusTitle}>Search Radius</Text>
          <TouchableOpacity
            style={styles.radiusToggleButton}
            onPress={toggleRadiusControl}
          >
            <MaterialIcons
              name={state.showRadiusControl ? 'expand-less' : 'expand-more'}
              size={20}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.radiusDisplay}>
          <Text style={styles.radiusText}>{state.radius} miles</Text>
          <Text style={styles.radiusCountText}>
            {state.attorneys.length} attorney{state.attorneys.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {state.showRadiusControl && (
          <View style={styles.radiusControlContainer}>
            <View style={styles.radiusButtonsContainer}>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => updateState({ radius: Math.max(1, state.radius - 5) })}
              >
                <MaterialIcons name="remove" size={20} color={colors.text.primary} />
              </TouchableOpacity>

              <View style={styles.radiusSliderContainer}>
                <Text style={styles.radiusLabel}>Drag to adjust</Text>
                <View style={styles.radiusSlider}>
                  <View
                    style={[
                      styles.radiusSliderFill,
                      { width: `${(state.radius / 50) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => updateState({ radius: Math.min(50, state.radius + 5) })}
              >
                <MaterialIcons name="add" size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.radiusPresetsContainer}>
              {[5, 10, 25, 50].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.radiusPreset,
                    state.radius === preset && styles.radiusPresetActive,
                  ]}
                  onPress={() => updateState({ radius: preset })}
                >
                  <Text
                    style={[
                      styles.radiusPresetText,
                      state.radius === preset && styles.radiusPresetTextActive,
                    ]}
                  >
                    {preset}mi
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      {state.showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScrollContainer}
        >
          <View style={styles.filtersContainer}>
            {/* Google Places API Based Filters */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Filter by Google Places Data</Text>
              
              {/* Rating Filter */}
              <View style={styles.filterSubsection}>
                <Text style={styles.filterSubtitle}>Minimum Rating</Text>
                <View style={styles.filterChipsRow}>
                  {[3.5, 4.0, 4.5, 5.0].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.filterChip,
                        state.filters.rating.enabled && 
                        state.filters.rating.minRating === rating &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => {
                        updateState({
                          filters: {
                            ...state.filters,
                            rating: {
                              enabled: state.filters.rating.minRating === rating 
                                ? !state.filters.rating.enabled 
                                : true,
                              minRating: rating,
                            },
                          },
                        });
                      }}
                    >
                      <MaterialIcons
                        name="star"
                        size={16}
                        color={
                          state.filters.rating.enabled && 
                          state.filters.rating.minRating === rating
                            ? colors.accent
                            : colors.text.muted
                        }
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          state.filters.rating.enabled && 
                          state.filters.rating.minRating === rating &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {rating}+ ⭐
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Reviews Filter */}
              <View style={styles.filterSubsection}>
                <Text style={styles.filterSubtitle}>Minimum Reviews</Text>
                <View style={styles.filterChipsRow}>
                  {[5, 10, 25, 50].map((reviews) => (
                    <TouchableOpacity
                      key={reviews}
                      style={[
                        styles.filterChip,
                        state.filters.reviews.enabled && 
                        state.filters.reviews.minReviews === reviews &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => {
                        updateState({
                          filters: {
                            ...state.filters,
                            reviews: {
                              enabled: state.filters.reviews.minReviews === reviews 
                                ? !state.filters.reviews.enabled 
                                : true,
                              minReviews: reviews,
                            },
                          },
                        });
                      }}
                    >
                      <MaterialIcons
                        name="rate-review"
                        size={16}
                        color={
                          state.filters.reviews.enabled && 
                          state.filters.reviews.minReviews === reviews
                            ? colors.accent
                            : colors.text.muted
                        }
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          state.filters.reviews.enabled && 
                          state.filters.reviews.minReviews === reviews &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {reviews}+ Reviews
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Distance Filter */}
              <View style={styles.filterSubsection}>
                <Text style={styles.filterSubtitle}>Maximum Distance</Text>
                <View style={styles.filterChipsRow}>
                  {[5, 10, 25, 50].map((distance) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.filterChip,
                        state.filters.distance.enabled && 
                        state.filters.distance.maxDistance === distance &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => {
                        updateState({
                          filters: {
                            ...state.filters,
                            distance: {
                              enabled: state.filters.distance.maxDistance === distance 
                                ? !state.filters.distance.enabled 
                                : true,
                              maxDistance: distance,
                            },
                          },
                        });
                      }}
                    >
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={
                          state.filters.distance.enabled && 
                          state.filters.distance.maxDistance === distance
                            ? colors.accent
                            : colors.text.muted
                        }
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          state.filters.distance.enabled && 
                          state.filters.distance.maxDistance === distance &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {distance} miles
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Level Filter */}
              <View style={styles.filterSubsection}>
                <Text style={styles.filterSubtitle}>Price Level ($ = affordable)</Text>
                <View style={styles.filterChipsRow}>
                  {[1, 2, 3, 4].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.filterChip,
                        state.filters.priceLevel.enabled && 
                        state.filters.priceLevel.maxLevel === level &&
                          styles.filterChipActive,
                      ]}
                      onPress={() => {
                        updateState({
                          filters: {
                            ...state.filters,
                            priceLevel: {
                              enabled: state.filters.priceLevel.maxLevel === level 
                                ? !state.filters.priceLevel.enabled 
                                : true,
                              maxLevel: level,
                            },
                          },
                        });
                      }}
                    >
                      <MaterialIcons
                        name="attach-money"
                        size={16}
                        color={
                          state.filters.priceLevel.enabled && 
                          state.filters.priceLevel.maxLevel === level
                            ? colors.accent
                            : colors.text.muted
                        }
                      />
                      <Text
                        style={[
                          styles.filterChipText,
                          state.filters.priceLevel.enabled && 
                          state.filters.priceLevel.maxLevel === level &&
                            styles.filterChipTextActive,
                        ]}
                      >
                        {'$'.repeat(level)} max
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Boolean Filters */}
              <View style={styles.filterSubsection}>
                <Text style={styles.filterSubtitle}>Additional Filters</Text>
                <View style={styles.filterChipsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      state.filters.openNow && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      updateState({
                        filters: {
                          ...state.filters,
                          openNow: !state.filters.openNow,
                        },
                      })
                    }
                  >
                    <MaterialIcons
                      name="schedule"
                      size={16}
                      color={
                        state.filters.openNow
                          ? colors.accent
                          : colors.text.muted
                      }
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        state.filters.openNow && styles.filterChipTextActive,
                      ]}
                    >
                      Open Now
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterChip,
                      state.filters.verified && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      updateState({
                        filters: {
                          ...state.filters,
                          verified: !state.filters.verified,
                        },
                      })
                    }
                  >
                    <MaterialIcons
                      name="verified"
                      size={16}
                      color={
                        state.filters.verified
                          ? colors.accent
                          : colors.text.muted
                      }
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        state.filters.verified && styles.filterChipTextActive,
                      ]}
                    >
                      Verified
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tag Filter */}
              <View style={styles.filterSubsection}>
                <Text style={styles.filterSubtitle}>Filter by Tag</Text>
                <View style={styles.filterChipsRow}>
                  {(['highly_rated', 'well_reviewed', 'established', 'verified', 'nearby', 'accessible', 'responsive'] as const).map((tag) => {
                    const tagColor = tagColors[tag];
                    return (
                      <TouchableOpacity
                        key={tag}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: state.filters.selectedTags.includes(tag)
                              ? tagColor.background
                              : colors.surface,
                            borderColor: state.filters.selectedTags.includes(tag)
                              ? tagColor.border
                              : colors.border,
                          }
                        ]}
                        onPress={() => {
                          const newSelectedTags = state.filters.selectedTags.includes(tag)
                            ? state.filters.selectedTags.filter(t => t !== tag)
                            : [...state.filters.selectedTags, tag];
                          updateState({
                            filters: {
                              ...state.filters,
                              selectedTags: newSelectedTags,
                            },
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color: state.filters.selectedTags.includes(tag)
                                ? tagColor.text
                                : colors.text.muted,
                            }
                          ]}
                        >
                          {tag.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
        }
      >
        {renderContent()}

        {state.attorneys.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              Linking.openURL('mailto:chrisrashadmitchell@gmail.com')
            }
          >
            <Text style={styles.addAttorneyText}>
              Become the top attorney in the list?{' '}
              <Text
                style={styles.addAttorneyHighlightedText}
                onPress={() => Linking.openURL('mailto:admin@wedesit.com')}
              >
                Contact Admin.
              </Text>
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    fontFamily: 'Inter-Bold',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: radius.md,
    marginBottom: 15,
    ...shadows.small,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'Inter-Regular',
  },
  filtersScrollContainer: {
    maxHeight: 300,
    marginBottom: 15,
  },
  filtersContainer: {
    paddingHorizontal: 20,
  },
  filterSection: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: radius.lg,
    marginBottom: 10,
    minWidth: 300,
    ...shadows.small,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 15,
    fontFamily: 'Inter-Bold',
  },
  filterSubsection: {
    marginBottom: 15,
  },
  filterSubtitle: {
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
  },
  filterChipTextActive: {
    color: colors.background,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Inter-Bold',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Inter-Regular',
  },
  errorSuggestions: {
    fontSize: 14,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  retryButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
  attorneyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 15,
    marginBottom: 15,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
  },
  attorneyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 5,
    fontFamily: 'Inter-Bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'Inter-Medium',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  distanceText: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  distanceIndicator: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
    marginLeft: 10,
    fontFamily: 'Inter-SemiBold',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    fontFamily: 'Inter-Regular',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  languagesText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  essentialInfoContainer: {
    marginVertical: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  contactButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: radius.md,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  contactButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  addAttorneyText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.text.muted,
    marginTop: 30,
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  addAttorneyHighlightedText: {
    color: colors.accent,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  // Radius control styles
  radiusContainer: {
    backgroundColor: colors.secondary,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: radius.lg,
    padding: 15,
    ...shadows.small,
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
  radiusCountText: {
    fontSize: 12,
    color: colors.text.muted,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
    textAlign: 'center',
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
    ...shadows.small,
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
