# Claude Code prompt — bring Tulip-Upgraded to parity with the approved design

> Paste everything below the line into Claude Code (local), working in the
> `dlerazeezcore/Tulip-Upgraded` repo. It respects the repo's conventions and is
> scoped to NOT touch your wiring. The approved visual reference is the Tulip
> design project (the `*-app.html` prototypes — Web / iOS / Android). Token
> values already match 1:1 between the design's `tokens.css` and the repo's
> `src/theme/tokens.ts`, so this is layout + a couple of components, not a
> palette change.

---

You are working in the **Tulip Booking** Expo app (React Native + Web, expo-router,
zustand, i18n). Read `CLAUDE.md` first and follow it exactly. Make **UI-only** changes
that bring the app to match the approved design.

## Hard guardrails — do not break these
1. **Thin UI + separate wiring is mandatory.** Only edit thin UI (`.tsx` in `app/**` and
   `src/components/*.tsx`). Do **NOT** edit, rename, or reorder any wiring hook
   (`src/screens/**/use*.ts`, `src/components/use*.ts`), `src/services/*`, `src/state/*`,
   `src/lib/*` (except the one QR-render change in Task 1), or `src/data/*`. New/!changed
   UI must consume the **existing** hooks/view-models.
2. **Design tokens only** (`t.*` from `src/theme/tokens.ts`). No hardcoded hex. Light + dark.
3. **i18n**: no hardcoded user-facing strings — `useTranslation()` keys in `en`/`ar`/`ku`,
   verified in **RTL** for `ar`/`ku`.
4. **CI must stay green**: don't touch `android-build.yml`, `deploy.yml`,
   `ios-appstoreconnect.yml`, or `check.yml` behavior. `npm run typecheck` must pass.
5. **Don't regress working behavior.** Already done — leave them: the EU/euro currency flag
   fallback in `src/components/Flag.tsx`, and the hidden web payment methods. Verify only.

## What already exists (don't rebuild — extend)
- A **desktop web shell** with a 240px sidebar (`app/(tabs)/_layout.tsx`, `isWide = Platform.OS==='web' && width>=1024`).
- `useIsWideWeb()` in `src/lib/responsive.ts`, already used to make `services.tsx`,
  `bookings.tsx`, `profile.tsx`, and `esim-store/index.tsx` multi-column on web.
So the sidebar and several screens are already responsive. The work below fills the gaps.

---

## Task 1 — eSIM QR code with the Tulip logo centered ⭐
The scannable eSIM QR must show the **Tulip petal mark** centered on a small **white rounded
badge** (kept small so it stays scannable), everywhere a QR is rendered.

Files:
- `src/components/EsimInstallCard.tsx` — the on-screen `<QRCode>`.
- `src/lib/esimActivation.ts` → `generateQrDataUrl` — the PNG used for **share/download**, so
  the saved/shared image carries the same centered logo. Keep its signature/exports identical;
  only change the QR-render options.

On-screen QR (`react-native-qrcode-svg`, already a dep — supports a center logo):
```tsx
// add a crisp @2x/@3x PNG of the petal mark, e.g. assets/tulip-mark.png
import tulipMark from '../../assets/tulip-mark.png';

<QRCode
  value={vm.lpa}
  size={220}
  backgroundColor="#fff"
  color="#000"
  ecl="H"                    // REQUIRED with a center logo so occluded modules still decode
  logo={tulipMark}
  logoSize={48}              // ~20–22% of size; bigger hurts scanning
  logoBackgroundColor="#fff"
  logoMargin={4}
  logoBorderRadius={10}
/>
```
Notes: bump error-correction to `H` whenever a logo is present. If you prefer vector, the
existing `src/components/TulipLogo.tsx` (pure RN-SVG) can feed `logoSVG` so it stays crisp on
web + native. The QR must scan on a real phone, and the shared/downloaded PNG must match.
Leave the SM-DP+ / activation-code manual-entry block unchanged.

## Task 2 — Finish the desktop web experience ⭐ main task
Several tabs are already responsive; these screens still render the **mobile layout in a wide
column** and need desktop treatment via `useIsWideWeb()` (web ≥1024). Mobile/native must stay
exactly as-is. Match the approved mockups (`web-app.html`).

- **Home** (`app/(tabs)/index.tsx`): on wide, render the services grid at **4 columns** (it's
  `33.33%` today). Cap the hero/content nicely (it already uses `maxWidth: 1200`). Keep the
  photo-glass hero + MultiServiceTabs + ActiveEsimCard exactly; just widen the grid and spacing.
- **Search** (`app/search/[service].tsx`): on wide, lay the form out in **two columns** (From/To
  + dates on the left, trip-type + steppers on the right) inside a ~900–1000px centered card,
  instead of a single stacked column. Same fields, same `useServiceSearch` wiring.
- **eSIM detail** (`app/esim/[id].tsx`): on wide, **two columns** — plan/usage/manage on the
  left, the install card (QR + activate + manual entry) on the right. The mockup shows this.
- **eSIM place + checkout** (`app/esim-store/[place].tsx`, `app/esim-store/checkout.tsx`): cap
  width (~900px) and use a two-column plan-picker + summary on wide.
- Add **hover/focus states** for web on cards, tiles, nav and inputs (mobile has none): subtle
  lift + border-color → `t.primary`, pointer cursor, input focus ring.
- Respect **RTL** on desktop (sidebar flips right, rows mirror) for `ar`/`ku`.

Acceptance: at ≥1024px Home/Search/eSIM-detail/checkout are true multi-column desktop layouts
matching the mockups; at <1024px and on native they are byte-for-byte the current mobile UI;
light + dark + `en`/`ar`/`ku` (RTL) verified; `npm run typecheck` passes.

## Task 3 — Parity checks (verify, fix only if broken)
- First-launch **onboarding** currency/language: confirm the EUR row shows a mark (not an empty
  circle). Fallback already exists; only improve if it's actually blank. UI-only.
- **Web payment methods**: confirm still hidden. Don't reintroduce.

## Optional polish (do the isolated ones; ask before anything touching wiring)
- Skeletons (`Skeleton.tsx`) on web results/store loads; empty states (`EmptyState.tsx`).
- Desktop keyboard: Enter submits search, Esc closes modals, visible focus rings.
- Audit any bare `$` to go through the existing `useMoney()`.
- Give `UsageRing.tsx` more prominence on the eSIM detail desktop layout (extra space).

## Before you finish
- `npm run typecheck` passes.
- Light + dark + `en`/`ar`/`ku` (RTL) verified.
- No edits to any `use*.ts`, `services/`, `state/`, `data/`, the CI workflows, or `lib/`
  (except the QR options in `esimActivation.ts`).
- List exactly which files you changed.
