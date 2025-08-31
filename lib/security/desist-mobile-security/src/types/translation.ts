/**
 * Translation and Internationalization Types
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ko' | 'ar' | 'hi';

export interface TranslationResource {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    retry: string;
    sync: string;
    syncing: string;
    yes: string;
    no: string;
    unknown: string;
    good: string;
    poor: string;
    systemOverview: string;
    device: string;
    uptime: string;
    sessionActive: string;
    appVersion: string;
    deviceId: string;
    system: string;
    syncComplete: string;
    syncSuccess: string;
    syncError: string;
    syncToServer: string;
  };
  performance: {
    title: string;
    diagnostics: string;
    metrics: string;
    startupTime: string;
    memoryUsage: string;
    batteryLevel: string;
    networkStatus: string;
    connection: string;
    vpnDetected: string;
    syncDeviceStatus: string;
    syncSuccess: string;
    syncError: string;
    syncErrorMessage: string;
    syncSuccessMessage: string;
    tab: string;
    healthScore: string;
    optimizing: string;
    optimize: string;
    battery: string;
    memory: string;
    cpu: string;
    disk: string;
    recommendations: string;
    alerts: string;
    refreshError: string;
  };
  network: {
    wifi: string;
    cellular: string;
    offline: string;
    vpn: string;
    connected: string;
    disconnected: string;
    connectionType: string;
    tab: string;
    status: string;
    statusLabel: string;
    active: string;
    inactive: string;
    speed: string;
    download: string;
    upload: string;
    testing: string;
    lastTested: string;
    runSpeedTest: string;
    runDiagnostics: string;
    diagnostics: string;
    connectivity: string;
    responseTime: string;
    downloadSpeed: string;
    uploadSpeed: string;
    dnsResolution: string;
    diagnosticsError: string;
  };
  security: {
    encryption: string;
    authentication: string;
    biometric: string;
    twoFactor: string;
    securityLevel: string;
    threatDetection: string;
    accessDenied: string;
    accessGranted: string;
  };
  incidents: {
    report: string;
    submit: string;
    type: string;
    severity: string;
    location: string;
    description: string;
    anonymous: string;
    submitSuccess: string;
    submitError: string;
  };
  notifications: {
    settings: string;
    emergency: string;
    incidents: string;
    safety: string;
    marketing: string;
    quietHours: string;
    enabled: string;
    disabled: string;
  };
  privacy: {
    settings: string;
    dataCollection: string;
    analytics: string;
    location: string;
    consent: string;
    withdraw: string;
    manage: string;
  };
}

export interface LocaleConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  rtl: boolean;
  flag: string;
}

export interface TranslationState {
  currentLanguage: SupportedLanguage;
  availableLanguages: LocaleConfig[];
  isRTL: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface TranslationService {
  getCurrentLanguage(): SupportedLanguage;
  setLanguage(language: SupportedLanguage): Promise<void>;
  getAvailableLanguages(): LocaleConfig[];
  translate(key: string, options?: any): string;
  isRTL(): boolean;
  formatDate(date: Date): string;
  formatTime(date: Date): string;
  formatNumber(number: number): string;
  formatCurrency(amount: number, currency?: string): string;
}
