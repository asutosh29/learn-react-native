const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Configure the twcss global file path
module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
