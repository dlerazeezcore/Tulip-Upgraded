# Releasing Tulip Booking — Android

How to ship an Android update, plus the one-time setup (kept here for recovery /
future maintainers). iOS has its own airtight workflow and isn't documented here.

Package name: `com.theesim.app`

---

## TL;DR — ship an update

1. Bump `expo.version` in [`app.json`](./app.json) (e.g. `1.1.4` → `1.1.5`), commit + push.
2. GitHub → **Actions → "Android Play release (AAB)" → Run workflow**:
   - First run of a version: **track = internal** (validates the whole pipeline safely).
   - Then run again with **track = production**.
3. Once the build is **live in the store**, open the app's **Admin → Publish app update**,
   enter the new version, confirm. This forces every older build to update.

That's it — the workflow builds a signed AAB and uploads it to Play via the Play
Developer API.

---

## Versioning — what to touch

- **`expo.version`** = the marketing version users see. It's also compared against the
  backend's `latestVersion` for the mandatory-update gate. **Bump this every release.**
- **Android `versionCode`** (and the iOS build number) are auto-set to a fresh unix
  timestamp inside CI, so they're always unique and increasing. **Don't set them by hand.**
- Live production baseline at setup: `versionCode 2` (v1.0.9). Any timestamp versionCode
  is far above that.

## Mandatory-update gate

The app blocks usage on any version **behind** the backend's `latestVersion`.

- Publish the new version via **Admin → Publish app update** (sets `latestVersion` +
  sends the localized push) **only after** the build is actually downloadable in the store.
- Never set `latestVersion` higher than what users can install, or they get stuck on the
  forced-update screen with nothing to update to.

---

## The pipeline

`.github/workflows/android-play-release.yml` — `workflow_dispatch` with inputs:
`track` (internal / alpha / beta / production), `status` (completed / draft / inProgress),
and `user_fraction` for staged rollout. It runs `expo prebuild` → `gradle bundleRelease`
(signing with the upload keystore) → submits via `r0adkll/upload-google-play`.

Do **not** confuse it with `android-build.yml`, which only makes a debug-signed APK for
sideload testing (not usable for Play).

---

## One-time setup (already done — reference only)

### Signing (Play App Signing is enabled)
Google holds the **app signing key** and re-signs every release with it, so the signature
users see never changes. You upload builds signed with an **upload key**.

- Upload keystore: `upload.jks`, alias `upload`.
- **Back up `upload.jks` + its password somewhere safe.** Every upload needs it.
- If it's ever lost: Play Console → **Test and release → App integrity → App signing →
  Request upload key reset** (upload the new cert's `.pem`; Google approves in ~1–2 days).

### Google Cloud service account (lets CI upload)
- Project: **`tulip-play-release`**, with the **Google Play Android Developer API** enabled.
- Service account: **`github-play-uploader@tulip-play-release.iam.gserviceaccount.com`**,
  granted **Release to production** + **Release to testing tracks** on Tulip Booking under
  Play Console → **Users and permissions**.
- Its JSON key is the `PLAY_SERVICE_ACCOUNT_JSON` secret. **Never commit it** — Google
  auto-disables service-account keys found in public repos.

### GitHub secrets (repo → Settings → Secrets and variables → Actions)
| Secret | What it is |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `upload.jks`, base64-encoded (`[Convert]::ToBase64String([IO.File]::ReadAllBytes("$HOME\upload.jks"))`) |
| `ANDROID_KEYSTORE_PASSWORD` | keystore (store) password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | key password (usually same as the store password) |
| `PLAY_SERVICE_ACCOUNT_JSON` | full contents of the service-account JSON key |

---

## First-release checklist (after the initial setup)

- [ ] Upload-key reset approved by Google (email received).
- [ ] All 5 GitHub secrets present.
- [ ] Run the workflow with **track = internal**, confirm the build appears in Play Console.
- [ ] Re-run with **track = production**.
- [ ] Admin → Publish app update with the new version once it's live.
