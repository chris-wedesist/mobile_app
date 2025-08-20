/**
 * @jest-environment node
 */

// Mock data generators
export const mockData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'https://example.com/avatar.jpg',
    preferences: {
      language: 'en',
      theme: 'light',
      notifications: {
        push: true,
        email: true,
        sms: false,
        emergency: true,
      },
      privacy: {
        locationSharing: true,
        dataCollection: false,
        analytics: true,
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  incident: {
    id: 'test-incident-id',
    title: 'Test Incident',
    description: 'This is a test incident description',
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
    },
    dateTime: new Date('2024-01-01T10:00:00Z'),
    witnesses: [
      {
        id: 'witness-1',
        name: 'John Doe',
        contact: '+1234567890',
        statement: 'I witnessed the incident',
      },
    ],
    evidence: [
      {
        id: 'evidence-1',
        type: 'photo' as const,
        url: 'https://example.com/photo.jpg',
        description: 'Photo evidence',
        uploadedAt: new Date('2024-01-01T10:30:00Z'),
      },
    ],
    status: 'pending' as const,
    priority: 'medium' as const,
    category: 'harassment' as const,
    createdAt: new Date('2024-01-01T09:00:00Z'),
    updatedAt: new Date('2024-01-01T09:00:00Z'),
  },

  newsItem: {
    id: 'news-1',
    title: 'Test News Article',
    description: 'This is a test news article description',
    url: 'https://example.com/news/1',
    urlToImage: 'https://example.com/news-image.jpg',
    publishedAt: new Date('2024-01-01T08:00:00Z'),
    source: {
      id: 'test-source',
      name: 'Test News Source',
    },
  },
};

// Async utilities for tests
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const flushPromises = () =>
  new Promise((resolve) => setImmediate(resolve));

// Mock functions
export const createMockFunction = <T extends (...args: any[]) => any>(
  returnValue?: any
): jest.MockedFunction<T> => {
  return jest
    .fn()
    .mockReturnValue(returnValue) as unknown as jest.MockedFunction<T>;
};

export const createMockAsyncFunction = <
  T extends (...args: any[]) => Promise<any>
>(
  returnValue?: any
): jest.MockedFunction<T> => {
  return jest
    .fn()
    .mockResolvedValue(returnValue) as unknown as jest.MockedFunction<T>;
};

// Test assertions
export const expectElementToBeVisible = (element: any) => {
  expect(element).toBeTruthy();
  expect(element.props.style).not.toEqual(
    expect.objectContaining({ display: 'none' })
  );
};

export const expectElementToBeHidden = (element: any) => {
  expect(element).toBeTruthy();
  expect(element.props.style).toEqual(
    expect.objectContaining({ display: 'none' })
  );
};

// Mock navigation
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => true),
  getState: jest.fn(() => ({
    routes: [{ name: 'Test' }],
    index: 0,
  })),
};

// Mock route
export const mockRoute = {
  params: {},
  key: 'test-route-key',
  name: 'Test',
};

// Mock AsyncStorage
export const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
};

// Mock Permissions
export const mockPermissions = {
  request: jest.fn(),
  check: jest.fn(),
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    DENIED: 'denied',
    LIMITED: 'limited',
    GRANTED: 'granted',
    BLOCKED: 'blocked',
  },
};

// Mock Location
export const mockLocation = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
};

// Mock Camera
export const mockCamera = {
  requestCameraPermissionsAsync: jest.fn(),
  getCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: {
    All: 'all',
    Videos: 'videos',
    Images: 'images',
  },
  CameraType: {
    front: 'front',
    back: 'back',
  },
  FlashMode: {
    on: 'on',
    off: 'off',
    auto: 'auto',
    torch: 'torch',
  },
};

// Mock ImagePicker
export const mockImagePicker = {
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    All: 'all',
    Videos: 'videos',
    Images: 'images',
  },
  ImagePickerResult: {
    canceled: false,
    assets: [
      {
        uri: 'file://test-image.jpg',
        width: 100,
        height: 100,
        type: 'image',
        fileName: 'test-image.jpg',
        fileSize: 1024,
      },
    ],
  },
};

// Mock Notifications
export const mockNotifications = {
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
};

// Mock Haptics
export const mockHaptics = {
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
};

// Mock Clipboard
export const mockClipboard = {
  getStringAsync: jest.fn(),
  setStringAsync: jest.fn(),
  hasStringAsync: jest.fn(),
};

// Mock Linking
export const mockLinking = {
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// Mock Share
export const mockShare = {
  share: jest.fn(),
  isAvailableAsync: jest.fn(),
};

// Mock FileSystem
export const mockFileSystem = {
  documentDirectory: 'file:///test/document/directory/',
  cacheDirectory: 'file:///test/cache/directory/',
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  downloadAsync: jest.fn(),
  uploadAsync: jest.fn(),
};

// Mock SecureStore
export const mockSecureStore = {
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(),
};
