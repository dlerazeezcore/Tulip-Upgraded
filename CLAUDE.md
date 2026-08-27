# Tulip Booking — Project Conventions

Workspace with two independently-versioned apps:
- `tulip-booking/` — Expo / React Native (+ Web), TypeScript, expo-router, zustand, i18n.
- `Backend/` — FastAPI + SQLAlchemy + Alembic, Supabase/Postgres, eSIM / FIB / Firebase / WINGS integrations.

> This file is duplicated in both repos so the conventions travel with whichever repo you clone.

## Frontend — thin UI + separate wiring (mandatory)
Every screen and component is TWO files:
- **Thin UI** (`.tsx`) — JSX only. No business `useState`, no API calls, no router pushes, no derived computation. Pulls ONE hook and renders. Target ~50 lines.
- **Wiring hook** — owns state, API calls, navigation, validation, errors, toasts. Returns a typed view-model the UI destructures.

Clarifications: pure UI-affordance `useState` (input focus, password visibility, modal open/closed) is allowed in the `.tsx`; "business state" means data, selection, and anything the view-model should own. Framework bootstrap files (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`) are exempt — they are wiring, not screens. Derived computation (`.map`/`.filter`/`.find`, math, string building) belongs in the hook: screens render pre-shaped view-models.

| Kind | Thin UI | Wiring |
|---|---|---|
| Screen | `app/<route>/<screen>.tsx` | `src/screens/<area>/use<Screen>.ts` |
| Component | `src/components/<Foo>.tsx` | `src/components/use<Foo>.ts` (sibling) |
| Cross-screen state | — | `src/state/<thing>Store.ts` (zustand) |
| Network | — | `src/services/<domain>.ts` |
| Pure transforms | — | `src/lib/<thing>.ts` |
| Static/mock data | — | `src/data/<thing>.ts` |

Example: `app/(tabs)/profile.tsx` is JSX-only and pulls `src/screens/profile/useProfile.ts`, which owns all state/API/navigation.

## Backend — one file per domain (mandatory)
Each domain is a SINGLE self-contained module (`auth.py`, `admin.py`, `users.py`, `esim_access_api.py`, `fib_payment_api.py`, `push_notification.py`, `supabase_store.py`, `wings_api.py`, …). Do NOT split a domain across files. Each exposes `register_<domain>_routes(app)` and is wired in `app.py`. Large files are expected — keep them navigable with clear section headers/comments.

## Folder structure
- **Frontend**: `app/` (expo-router routes) · `src/{components,screens,services,state,lib,data,theme,i18n}` · `assets/`.
- **Backend**: flat domain modules at root · `alembic/` (migrations) · `tests/` (pytest) · `scripts/` · `docs/`.

## Conventions we follow
- **Secrets**: env-only via `Backend/config.py` (pydantic-settings, `.env`). NEVER hardcode tokens/keys/URLs in source.
- **API (FE)**: always `apiFetch` (`src/lib/api.ts`). Never raw `fetch`.
- **Theme**: use design tokens from `src/theme/tokens.ts` (`t.*`). No hardcoded hex. Support light/dark.
- **i18n**: locales `en` / `ar` / `ku`; `ar` + `ku` are RTL. Use `useTranslation()` / `useLocaleStore`. No hardcoded user-facing strings.
- **Auth-gated routes**: `useAuthStore((s) => s.user)`; admin via `s.user?.isAdmin`.
- **State**: zustand stores live in `src/state/`.
- **Push**: Firebase FCM directly (native token via `getDevicePushTokenAsync()`, not Expo push). `push_devices.locale` is the source of truth; re-register the device on every language change.
- **Tests**: backend `pytest` under `Backend/tests/`; keep green before merge.

## New pages & UI (mandatory)
- **Localize everything**: every new page/screen ships in all 3 locales — `en`, `ar`, `ku` — with `ar` + `ku` verified in RTL. No English-only screens.
- **Follow the established design**: reuse the initial design system — colors, spacing, radius, typography from `src/theme/tokens.ts` and the existing component patterns. No ad-hoc palettes or one-off layouts; new screens must match the existing look.
- **HD only**: new UI must be high-fidelity — crisp vector/SVG or @2x/@3x raster assets (no blurry/upscaled images), spacing pinned to the token scale, correct light/dark variants. No placeholder-grade visuals in shipped screens.

## Design ↔ Code sync (Claude Design ↔ Claude Code)
Keep the visual design system (`claude.ai/design` project `019dee07-…`) and this code "on the same
level" via one contract: **[`SYNC-STRATEGY.md`](./SYNC-STRATEGY.md)**. In short — design **tokens**
(`src/theme/tokens.ts`) are the shared source of truth (Design owns pixels, Code owns behavior);
each design card maps **1:1** to a component/screen; changes flow **one component at a time**, never
wholesale. Automated **pull** (Design → Code) uses the `DesignSync` tool after `/design-login`; the
**push** direction (`/design-sync`) is not a fit for this Expo/RN app and is done by hand per the
contract (see `SYNC-STRATEGY.md` §5b).

**Established UI rules** (recorded as they're approved, so every session honors them):
- **Desktop web ≥1024** uses the sidebar shell (`app/(tabs)/_layout.tsx`); gate web-only
  multi-column layouts on `useIsWideWeb()` (`src/lib/responsive.ts`). Mobile/native stays
  byte-for-byte unchanged below the breakpoint.
- **eSIM QR** always renders the Tulip petal mark centered on a small white badge with
  error-correction `H` — on-screen (`EsimInstallCard`) and in the shared/downloaded PNG.
- **Launch screen** is Claude Design canvas *"Tulip Booking splash screens"* artboard **1a
  "Deep blue — brand default"** (project `0ff3ecab-…`), implemented as `TulipSplash` +
  `useTulipSplash`. It is theme-independent (brand gradient in BOTH light and dark, like the
  hero surfaces). The native `expo-splash-screen` frame is only the white petal mark on
  `brand.blue600` — it cannot render a gradient or animate, so it exists purely to hand off to
  `TulipSplash`; keep `imageWidth: 206` so the native mark matches the JS one's 96pt ink width.
  Never point the splash at `tulip-logo-full.png` — that asset is a blue mark on an opaque
  WHITE square, which is why the old splash showed a white box on blue.

## CI/CD actions — do NOT break these
These GitHub Actions are the release pipeline. Any change or edit must keep them green:
1. **Android Build APK** — `tulip-booking/.github/workflows/android-build.yml` (debug-signed APK for sideload testing only)
2. **Deploy web → GitHub Pages** — `tulip-booking/.github/workflows/deploy.yml`
3. **iOS App Store Connect** — `tulip-booking/.github/workflows/ios-appstoreconnect.yml` (builds + uploads to TestFlight)
4. **Android Play release (AAB)** — `tulip-booking/.github/workflows/android-play-release.yml` (signed AAB → Google Play; needs the `ANDROID_KEYSTORE_*` + `PLAY_SERVICE_ACCOUNT_JSON` secrets)

A separate check workflow runs typecheck on PRs: `tulip-booking/.github/workflows/check.yml` (`tsc --noEmit`). Add any new checks (typecheck / tests) as SEPARATE jobs or workflows like it. Never modify the release workflows in a way that alters or breaks their build/deploy behavior.

Version bumps: `app.json` `expo.version` is the marketing version (compared against the backend's `latestVersion` for the mandatory-update gate). The iOS build number and the Android `versionCode` are auto-set to a fresh unix timestamp in CI, so they are always unique/increasing — you only bump `expo.version` per release.

## Platform API floors — a RECURRING deadline (check every January)
Google Play requires the Android **target API level** to stay within **one year of the latest
Android release**, and enforces it every year around **Aug 31**. Miss it and you can no longer
ship UPDATES — the listing stays live and installed users are unaffected, but every release
workflow above is dead until you comply. This is not a one-time migration; it comes back annually.

Current state (raised 2026-07): **Expo SDK 56** (RN 0.85, React 19.2) → **`targetSdkVersion` 36**
(Android 16), pinned via `expo-build-properties` in `app.json`. iOS minimum is 16.4.

**Raising the target API is never a one-line change.** It also raises the AGP / Gradle / Kotlin
floors, and those are set by the Expo SDK — e.g. `compileSdk 36` needs AGP 8.9.1+, but SDK 51
shipped AGP 8.2.1, so the bump was impossible without upgrading. The real task is therefore an
**Expo SDK upgrade**, which moves BOTH platforms (one codebase, one SDK version — iOS comes along
whether or not it had a problem) and is test-worthy on a real device. Budget days, not hours.
Always validate on the Play **internal** track before production.

Do NOT reintroduce `android:windowOptOutEdgeToEdgeEnforcement` — it is **ignored at targetSdk 36**.
Edge-to-edge is permanent, so safe-area insets (`ScreenSafeArea`, `useSafeAreaInsets`) are the only
thing keeping content clear of the status and nav bars.

Check Play Console → Policy status each **January** so this is scheduled work, not a scramble.
See [`RELEASING.md`](./RELEASING.md) for the full history and the current patch/plugin rationale.
