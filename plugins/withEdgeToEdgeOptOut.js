// Expo config plugin: opt this app out of Android 15's ENFORCED edge-to-edge.
//
// Why: we target SDK 35 (Play requirement) on Expo SDK 51 / RN 0.74, which
// predate edge-to-edge support. Under enforcement the window starts
// full-height and resizes after first layout (visible reflow on launch), the
// system nav bar can no longer reserve space (expo-navigation-bar
// setPositionAsync no-ops), and softwareKeyboardLayoutMode "resize" is
// ignored. `windowOptOutEdgeToEdgeEnforcement` is the documented, Play-
// compliant escape hatch: Android 15 then treats the app like targetSdk 34.
//
// LIFETIME: the attribute is deprecated and IGNORED once targetSdk becomes 36
// (Play deadline ~Aug 2026). The real fix is the planned Expo SDK 52+ upgrade
// (react-native-edge-to-edge + safe-area-context 5.x) — see RELEASING.md.
// Delete this plugin as part of that upgrade.
const { withAndroidStyles } = require('expo/config-plugins');

const ATTR = 'android:windowOptOutEdgeToEdgeEnforcement';

module.exports = function withEdgeToEdgeOptOut(config) {
  return withAndroidStyles(config, (cfg) => {
    const styles = cfg.modResults;
    const appTheme = (styles.resources.style || []).find((s) => s.$.name === 'AppTheme');
    if (appTheme) {
      appTheme.item = appTheme.item || [];
      if (!appTheme.item.some((i) => i.$.name === ATTR)) {
        appTheme.item.push({ $: { name: ATTR }, _: 'true' });
      }
    }
    return cfg;
  });
};
