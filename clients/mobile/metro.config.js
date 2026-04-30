const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow resolving local file: workspace packages (e.g. @yourcloud/sdk).
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [path.resolve(__dirname, '../../packages')];
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  react: path.resolve(__dirname, 'node_modules/react'),
  'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
};

module.exports = withNativeWind(config, { input: './global.css' });
