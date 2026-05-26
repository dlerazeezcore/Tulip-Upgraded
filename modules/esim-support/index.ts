import { requireOptionalNativeModule } from 'expo-modules-core';

// Resolves to the native module in a dev/prebuild client; null in Expo Go / web.
export default requireOptionalNativeModule('EsimSupport');
