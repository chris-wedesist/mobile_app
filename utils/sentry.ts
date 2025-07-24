import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

/**
 * Initialise Sentry as early as possible in the application lifecycle.
 *
 * The DSN should be supplied via Expo extra config or environment variables.
 * Failing that, Sentry will be initialised with an empty DSN which keeps the
 * SDK active but prevents events from being sent.
 */
Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentryDSN ?? '',
  tracesSampleRate: 1.0,
});

// Re-export to allow `import '@/utils/sentry'` side-effect import patterns.
export default Sentry;