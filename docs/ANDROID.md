# Putting Articulation on Google Play

The app is a Progressive Web App (installable, works offline), so it ships to Android as a
**Trusted Web Activity (TWA)**: a small Android wrapper that opens your site full-screen in
Chrome, with no browser bar. Updates to the website show up in the app immediately, with no
new Play release needed.

## Costs and rules to know first

- **Google Play developer account: $25, one-time** (not yearly — Apple's is the $99/year one). One account can publish many apps.
- **New personal accounts must run a closed test with at least 12 testers for 14 days in a row** before Google allows a public (production) release. Plan two weeks and line up 12 people (friends, family, students) who opt in and keep the app installed. Organization accounts (needs a D-U-N-S number) are exempt.
- **Kids:** if you mark children as part of the target audience, the app falls under Google Play's *Families* policy. You'll need the privacy policy (a starting draft is in `public/privacy.html`, fill in your contact details), an honest *Data safety* form (voice recordings are sent to the speech checker for transcription, not stored; progress stays on the device), and no ads/analytics SDKs (the app has none).

## Steps

### 1. Host the site on a stable HTTPS domain

Use the Cloudflare setup from [HOSTING.md](HOSTING.md) (for example `articulation.shalonely.com`). The app must load at the domain root over HTTPS, and `/.well-known/assetlinks.json` must be served from that domain (the Worker does this).

### 2. Generate the Android app

Easiest: **[PWABuilder](https://www.pwabuilder.com)** → enter your URL → *Package for stores* → **Android** → *Google Play*.

- Package ID: e.g. `com.shalonely.articulation` (permanent, choose carefully)
- App name: Articulation Workshop · Short name: Articulation
- Theme/background colors and icons are read from `manifest.webmanifest` (already set up, including maskable icons)
- Keep "Signing key: create new". **Download and back up the signing key and its passwords** — you need them for every update.

It produces an `.aab` (upload to Play), an `.apk` (to test on your phone), and an `assetlinks.json`.

(Command-line alternative: `npx @bubblewrap/cli init --manifest https://YOUR-DOMAIN/manifest.webmanifest` then `npx @bubblewrap/cli build`.)

### 3. Prove the app owns the site (Digital Asset Links)

Without this the app shows a browser address bar. Put the package name and SHA-256 fingerprints into the Worker's vars in `wrangler.jsonc`:

```jsonc
"vars": {
  "STT_ORIGIN": "…",
  "ANDROID_PACKAGE": "com.shalonely.articulation",
  "ANDROID_SHA256": "AA:BB:…(your upload key),CC:DD:…(Play app signing key)"
}
```

Then `npx wrangler deploy` and check `https://YOUR-DOMAIN/.well-known/assetlinks.json`.

You need **two** fingerprints: your upload key (in PWABuilder's `assetlinks.json`) and **Google's app signing key**, which you get after the first upload: Play Console → your app → *Test and release → App integrity → App signing* → "SHA-256 certificate fingerprint". (If you self-host instead, set the same two values as `ANDROID_PACKAGE` / `ANDROID_SHA256` environment variables on the server.)

### 4. Play Console

1. Create the app → fill in store listing (screenshots: use the app on your phone; feature graphic 1024×500).
2. *Policy → App content*: privacy policy URL (`https://YOUR-DOMAIN/privacy.html`), target audience, Data safety, content rating.
3. *Test and release → Closed testing* → upload the `.aab` → add your 12+ testers' emails → send them the opt-in link.
4. After 14 days, *Apply for production* → roll out.

### 5. Updating

- Website changes (new cards, design, bug fixes): just deploy the site. The app picks them up.
- Icon, name, package or Android version bumps: rebuild with PWABuilder/Bubblewrap using the **same signing key**, increase the version code, upload a new `.aab`.

## Microphone on Android

The TWA runs in Chrome, so the first tap on 🎤 shows Chrome's microphone permission prompt for your site — the same as in the browser. The device voice (offline) and the server voice both work inside the app.
