const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper resolution for React Native
config.resolver.platforms = ['native', 'android', 'ios', 'web'];

module.exports = config;