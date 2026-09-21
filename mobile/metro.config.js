const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Fix web bundling by providing proper platform detection
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-web": path.resolve(__dirname, "node_modules/react-native-web"),
};

// Ensure web platform is properly configured
config.resolver.sourceExts = ["web.js", "web.ts", "web.tsx", ...config.resolver.sourceExts];

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

module.exports = config;
