# Tulip Booking — Travel Super App (mobile + web)

Expo (React Native + Web) app for the **Tulip Booking** travel super-app by Corevia Network:
Flights · Hotels · eSIM · Transfers · Car Rentals — plus accounts, payments, push, and an admin console.

Backed by the FastAPI service in [`../Backend`](../Backend). Codebase conventions live in the
root [`CLAUDE.md`](../CLAUDE.md) (thin UI + separate wiring, design tokens, i18n, etc.).

## Running

```bash
npm install
npm run web        # browser → http://localhost:8081
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run typecheck  # tsc --noEmit
```

The app calls the backend at `EXPO_PUBLIC_API_BASE_URL` (see `src/lib/config.ts`); it defaults
to the hosted Corevia backend when that env var is unset.

## What's in the app

- **Home / Services / Search / Results** — flights & hotels search and results.
- **eSIM store** — browse country/region plans, checkout, install (QR + usage), history.
- **Accounts** — sign up / sign in / forgot password (phone + WhatsApp OTP via the backend).
- **Payments** — FIB payment flow.
- **Orders & Trips** — order list/detail; trip detail with status pills.
- **Admin** — users, orders, currency, featured locations, and push notifications (custom / update / per-user / history).
- **i18n** — English, Arabic, Kurdish (Arabic & Kurdish are RTL).
- **Push** — Firebase Cloud Messaging (native device tokens).
- **Theming** — light/dark via design tokens; toggle in Profile (persists in AsyncStorage).

## Architecture

See the root [`CLAUDE.md`](../CLAUDE.md). In short:

- `app/` — expo-router screens (thin UI).
- `src/screens/<area>/use<Screen>.ts` — wiring hooks (state, API, navigation, validation).
- `src/components/` — shared components · `src/services/` — network · `src/state/` — zustand stores
  · `src/lib/` — helpers (incl. `api.ts` → `apiFetch`) · `src/data/` — static data
  · `src/theme/` — design tokens · `src/i18n/` — locales.

## CI / release

GitHub Actions:

- **Typecheck** — `.github/workflows/check.yml` (`tsc --noEmit` on PRs).
- **Android Build APK** — `.github/workflows/android-build.yml`.
- **Deploy web → GitHub Pages** — `.github/workflows/deploy.yml` (serves https://tulipbookings.com).
- **iOS App Store Connect** — `.github/workflows/ios-appstoreconnect.yml`.

Firebase client config (`google-services.json`, `GoogleService-Info.plist`) is committed
intentionally — these are app-embedded client identifiers, not server secrets.
