const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
      babelTransformerPath: require.resolve('react-native-svg-transformer'),
    },
    resolver: {
      assetExts: assetExts.filter((ext) => ext !== 'svg'),
      sourceExts: [...sourceExts, 'svg'],
      alias: {
        '@': './app',
        '@components': './app/components',
        '@screens': './app/screens',
        '@utils': './app/utils',
        '@assets': './app/assets',
        '@constants': './app/constants',
      },
      // EXCLUDE PROBLEMATIC MODULES - DOCUMENTED SOLUTION
      blockList: [
        /node_modules\/@expo\/metro-config\/.*/,
        /node_modules\/.*\/node_modules\/@expo\/metro-config\/.*/,
      ],
      // Simplified resolver for Expo SDK 53 - React Native compatible only
      alias: {
        ...require('metro-config').getDefaultConfig().resolver.alias,
      },
    },
    // EXCLUDE METRO CONFIG FROM BUNDLE - DOCUMENTED SOLUTION
    server: {
      enhanceMiddleware: (middleware, server) => {
        return (req, res, next) => {
          if (req.url.includes('@expo/metro-config')) {
            res.statusCode = 404;
            res.end('Module excluded');
            return;
          }
          return middleware(req, res, next);
        };
      },
    },
  };
})();
