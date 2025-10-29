import 'dotenv/config';

export default ({ config }) => {
  const stealth = process.env.STEALTH === 'true';

  return {
    ...config,
    name: stealth ? 'Calculator' : 'DESIST',
    slug: 'desist',
    version: '1.0.0',
    orientation: 'portrait',
    icon: stealth
      ? './assets/images/icon-calculator.png'
      : './assets/images/icon.png',
    splash: {
      image: stealth
        ? './assets/images/splash-calculator.png'
        : './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: stealth ? '#000000' : '#1B2D45'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: stealth
        ? 'com.ahmedashraf_dev.calculator'
        : 'com.ahmedashraf_dev.desist'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: stealth
          ? './assets/images/icon-calculator.png'
          : './assets/images/adaptive-icon.png',
        backgroundColor: stealth ? '#000000' : '#1B2D45'
      },
      package: stealth
        ? 'com.ahmedashraf_dev.calculator'
        : 'com.ahmedashraf_dev.desist'
    },
    extra: {
      eas: { projectId: '03e1ecac-14ec-4ac3-a8cc-b4b8332e901b' }
    }
  };
};
