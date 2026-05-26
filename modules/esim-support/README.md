# esim-support (local Expo native module)

Reports whether the device hardware supports eSIM:

- iOS: `CTCellularPlanProvisioning().supportsEmbeddedSIM`
- Android: `EuiccManager.isEnabled`

The app calls it via `src/services/device.ts` (`checkEsimSupport()`), which uses
`requireOptionalNativeModule('EsimSupport')` and **degrades gracefully** to an
advisory in Expo Go / web where native modules aren't available.

## Enabling the native check (dev/prebuild client)

This folder ships the implementation sources + `expo-module.config.json`. To get
the gradle/podspec scaffolding generated correctly, run once and keep these files:

```bash
# from tulip-booking/
npx create-expo-module@latest --local esim-support   # generates gradle + podspec scaffolding
# then ensure the Swift/Kotlin/index/config here are the ones in use (overwrite the generated stubs)
npx expo prebuild            # links the local module
npx expo run:ios             # or run:android  (NOT Expo Go)
```

Local modules under `modules/` are auto-linked by Expo autolinking during
prebuild — no `app.json` plugin entry is required. Once linked, `checkEsimSupport()`
returns `{ supported: true|false, source: 'native' }`.
