// Reanimated 4 moved the worklets transform into `react-native-worklets`, and
// babel-preset-expo (SDK 56) auto-adds `react-native-worklets/plugin` whenever
// that package is installed (`worklets` option defaults to true). Listing the
// plugin here as well would apply the transform twice — so the plugins array is
// intentionally empty. Set `worklets: false` on the preset to opt out instead.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
