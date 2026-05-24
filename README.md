# Tulip Booking — Travel Super App

Expo (React Native + Web) prototype implementing the hero slice of the **Tulip Booking** travel super-app design (Flights · Hotels · eSIM · Transfers · Car Rentals — extensible).

Source design: `corevia-network-design-system` handoff bundle (Claude Design).

## Running

```bash
npm install
npm run web        # browser → http://localhost:8081
npm run ios        # iOS simulator
npm run android    # Android emulator
```

Press `i`/`a`/`w` from the Expo dev server menu to switch targets.

Type-check:

```bash
npm run typecheck
```

## Hero slice — 7 screens

1. **Home** — greeting, hero search with multi-service tabs, upcoming trip card, services grid, popular destinations
2. **Services hub** — full 5-service grid + extensible "More coming soon" slot + bundle promo
3. **Search** — service tabs, trip-type chips, from/to with swap, dates, traveler stepper
4. **Flight results** — sort tabs, expandable fare-family cards (Light / Standard / Flex / Business)
5. **Hotel results** — filter rail (price, stars, amenities), sortable hotel cards (filters work client-side)
6. **Trip detail** — bookings across services with status pills
7. **Profile** — user card, travelers, payment methods, preferences (theme toggle lives here)

Plus a minimal **Inbox** placeholder.

## What's interactive

- **Theme toggle** in Profile flips light ↔ dark across all screens; persists in AsyncStorage.
- **Service tabs** on Home/Search select an active service; tile taps push to `/search/[service]`.
- **Search forms** are controlled; submit pushes to `/results/flights` or `/results/hotels`.
- **Hotel filters** (star rating + amenities) filter the result list immediately.
- **Flight sort tabs** re-order results; cards expand to show fare families.
- **Trip card** taps → `/trip/london-summer`.
- **Bottom tabs** on mobile; **sidebar** on web ≥ 1024px.

## What's not

- No real backend, auth, or payments.
- Date picker is non-interactive in this slice (shows preset dates from `searchStore`).
- Inbox is a placeholder list.

## Folder layout

- `app/` — expo-router screens
- `src/theme/` — JS-port of `tokens.css` + `ThemeContext`
- `src/components/` — shared building blocks
- `src/data/` — mock data (services, trips, hotels, flights, user)
- `src/state/` — zustand stores (theme, search, filters)
- `assets/` — Tulip logo SVG + PNG (from design bundle)
