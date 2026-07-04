# App Store screenshots — Tulip Booking

Generated 2026-07-04 by capturing the **real running app** (Expo web build of the
current `main`) in a headless browser at Apple's exact device pixel sizes. These
are genuine app UI — not mockups — which is what App Store review Guideline 2.3.3
requires ("screenshots must reflect the app in use / current version").

## Files

```
store-assets/screenshots/
  iphone-6.5/   1284 × 2778 px   (6.5" iPhone slot)
  ipad-13/      2048 × 2732 px   (13" iPad slot)
```

Both folders contain the same 7 scenes at their device size.

## Recommended upload order (best first — App Store shows the first 2–3 most)

| # | File | Shows | Suggested caption |
|---|------|-------|-------------------|
| 1 | `5-active-esim.png` | Home + a live Active eSIM card with real-time data usage | "Your travel data, all in one place" |
| 2 | `3-plans.png` | Turkey data plans with pricing tiers (7/15/30 days) | "Pick a plan for any country" |
| 3 | `7-qr-install.png` | eSIM install screen with scannable QR | "Install in seconds — scan and go" |
| 4 | `2-store.png` | Full country list (global coverage) | "Data in 190+ destinations" |
| 5 | `6-my-esims.png` | Manage your eSIMs (active + ready-to-install) | "Track and manage every eSIM" |
| 6 | `4-regions.png` | Regional multi-country eSIMs | "One eSIM for a whole region" |

`1-home.png` (signed-out home) is included as an optional extra; `5-active-esim`
supersedes it, so it's not in the recommended six.

## How to upload

1. App Store Connect → your app → the rejected version → **Previews and Screenshots**.
2. Use **"View All Sizes in Media Manager"** to reach the **6.5" iPhone** and
   **13" iPad** slots (the two Apple flagged).
3. Drag in the files from the matching folder, in the order above.
4. Save. Screenshots are metadata — this does **not** require a new build.

## Notes / honesty

- The signed-in scenes (1, 5, 6) use representative demo data (an active "Turkey
  5 GB" plan, a ready-to-install "Germany" eSIM) to show real, existing features —
  standard practice for store screenshots. Every screen, component, and flow shown
  is real app UI rendered from the live code.
- Captions above are **suggestions**; App Store screenshots can also be uploaded
  raw (no caption). If you want captioned/framed marketing versions, that's a
  separate design pass.
- These screenshots address **Guideline 2.3.3** only. The **2.1 demo sign-in**
  rejection is a separate item (root cause diagnosed: the sign-in phone field's
  IP-geolocation overrides the country code, so `7507343635` under a US reviewer
  becomes `+1…` and can't be found). That was left unfixed per your decision.

## Regenerating

The capture scripts live in the session scratchpad (`shots.mjs`, `authed.mjs`,
`store-countries.mjs`). They drive Puppeteer against `npm run dev` (localhost:8081)
at viewport `428×926 @3x` (iPhone) and `1024×1366 @2x` (iPad). To regenerate after
UI changes: start the web server, then re-run those scripts.
