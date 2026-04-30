const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow resolving local file: workspace packages (e.g. @yourcloud/sdk).
config.resolver.unstable_enableSymlinks = true;
config.watchFolders = [path.resolve(__dirname, '../../packages')];

module.exports = config;
