const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The caption engine and styles live in ../shared so the Remotion renderer uses the exact same code.
config.watchFolders = [path.resolve(__dirname, '../shared')];

module.exports = config;
