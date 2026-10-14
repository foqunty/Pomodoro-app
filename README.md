# STILL / FOCUS

A calm, cinematic Pomodoro timer. React + Vite + TypeScript + Tailwind CSS v4 + Framer Motion.

> **Your session is remembered on this device.** The timer, session counters, durations, cycle length and your
> preferences are saved in the browser's `localStorage` (never sent anywhere, no secrets), validated on load, and
> restored after a refresh or after closing the browser. A session that ran out while the page was closed or the device
> slept is completed (and counted once) when you come back. *Settings → Saved data → Reset all progress* erases it.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
```

Requires Node 20+.

## How it works

- **Timer:** `src/lib/timerReducer.ts` (pure logic) + `src/hooks/useTimer.ts`. A running session is defined
  by a wall-clock end time, so the countdown cannot drift or restart on re-render, and it re-syncs
  immediately when a background tab becomes visible again.
- **Sessions never auto-start.** When one finishes you get a reward panel and a clear "Start …" button.
  After 4 completed focus sessions the suggested break is the long one.
- **Rewards:** 4 points per focus minute; milestones in `src/data/milestones.ts`.
- **Sound:** off by default; the audio engine is only created after you press the sound button. All sounds are
  tiny Web Audio tones (no audio files). There is no ambient loop.
- **Background video:** fullscreen, muted, looping. It falls back to the solid navy background if it fails to
  load or if the browser has Data Saver on, and holds on a still frame under `prefers-reduced-motion`.

## Settings, full screen and ambient sound

- **Focus cycle:** the sliders button in the top bar opens a panel where you choose 1–99 focus sessions before each long
  break (default 4). The number of sessions you can complete is unlimited; durations stay validated (focus 1–90, short break 1–30,
  long break 1–60 minutes). The timer shows your place (e.g. `FOCUS 2/4`). Changing it never touches a running timer; it only
  changes when the *next* long break is offered. Sessions still never auto-start.
- **Full screen:** the button at the top-left uses the browser Fullscreen API (Esc exits). A web page cannot hide the
  browser toolbar any other way. iPhone Safari does not allow element full screen, so the button is hidden there; use
  *Share → Add to Home Screen* to run without browser bars.
- **Sound (three independent switches, all off by default, never persisted):**
  - *Background music* with a 0–100 volume slider. Sources: the **Reference mix** (a YouTube video played through the
    official IFrame Player API, privacy-enhanced host), or generated brown noise, soft noise and synthesised rain.
  - *Interface sounds* (button clicks) and the *session-complete chime* each have their own switch.
  - The player uses the most minimal configuration YouTube supports (no control bar, no keyboard shortcuts, no
    fullscreen button, no annotations/captions, no related videos); the app shows only a short "Focus mix" label and its
    own play/pause button. YouTube's own overlay (title, channel, logo, play button) still appears when the player is paused
    or hovered; that cannot be removed through supported options and is not hidden.
  - Nothing is requested from YouTube until you turn the Reference mix on. YouTube's policies require its player to stay
    visible (and at least 200×200), so it appears in a small dock (bottom-left on large screens, below the controls
    elsewhere). The video may show ads, can be removed or have embedding disabled by its owner, and ignores
    `volume` on iPhone/iPad (use the device buttons). If a browser blocks autoplay, press play on the player.
  - To use your own audio instead, put a file you have the rights to in `public/audio/` and set `LOCAL_TRACK` in
    `src/config/music.ts`; it then appears as a source (no YouTube involved). No audio is bundled.
- **Screen stays awake (Screen Wake Lock API):** requested while a session is *running*, released on pause, reset, skip
  and completion, and re-requested once when the tab becomes visible again. A website cannot keep the screen on after the
  device is locked or you leave the page. If the browser lacks the API or declines, a small note says the screen may dim.
- **Notifications:** on first visit an in-app dialog explains the feature; the browser's permission prompt only appears if
  you press *Enable notifications*. *Not now* (or Esc) means off and is remembered; you can change it in Settings. A
  notification is sent only if your preference is on *and* the browser permission is granted, once per finished session
  (de-duplicated by a persisted completion counter and the notification tag). **Limits:** notifications are local. They
  work while the page/service worker is alive (including a background tab, depending on the browser). They are *not*
  guaranteed on a locked phone or after the browser/site is closed — that needs Web Push, i.e. a push server, stored
  subscriptions and VAPID keys, which this app deliberately does not have. On return the timer restores correctly anyway.
- **Offline / install:** a hand-written service worker (`public/sw.js`, filled with the file list and a content-hash version
  at build time by `scripts/sw-plugin.mjs`) caches the app's own files after the first online visit. Offline you can open
  the app, run the timer, rotate quotes, use generated sounds and keep your saved session. It does **not** cache YouTube or
  the background video (third-party, large): those need a connection (the video falls back to the navy background unless
  the browser's own HTTP cache still has it). Fonts are self-hosted (OFL) so they work offline. A brand-new visit while
  offline cannot work. A manifest + icons make it installable (*Add to Home Screen* on iPhone gives a bar-free view).

## Security notes

- No backend, API keys, accounts or storage. There are no environment variables; if you ever add one, anything named
  `VITE_*` is bundled into the public JavaScript, so never put a secret there. Real `.env` files are git-ignored
  (`.env.example` is not).
- `vercel.json` sets a Content-Security-Policy and other headers (HSTS, `nosniff`, frame blocking, referrer and
  permissions policies). The CSP allows only this site, the background-video host and, for the optional
  Reference mix, `script-src https://www.youtube.com` and `frame-src https://www.youtube-nocookie.com` (autoplay and
  encrypted-media are delegated to that one origin). If you change the video
  host or add third-party scripts/fonts/images, update the policy or those resources will be blocked.
- Quote links and signature images are validated (https/http links only).
- Run `npm audit` before deploying and after upgrading dependencies.

## Quotations

Quotes rotate automatically every **30 seconds** (independent of the timer and audio) with a soft cross-fade; there is
no manual control, and the tick is skipped while the tab is hidden. The order is a shuffled deck: every quote is shown once before
any repeats, and the next deck never starts with the quote just shown. With 0 or 1 quotes nothing rotates.

Edit **`src/data/quotes.ts`** — add, remove or reorder entries; the UI needs no changes. Each quote supports
`text`, `author`, `category`, `source`, `sourceUrl` and an optional `signature` image path.

The bundled quotes were each checked against a public-domain edition (Project Gutenberg / Wikisource) or a
well-documented primary source. If a signature image is not provided, the author's name is set typographically.
Only add signature images you have permission to use. Please verify any quote you add — many popular
"motivational" quotes are misattributed.

## Quote font: American Captain

The font is **not bundled**: I could not verify its licence, and I did not substitute another font and call it
American Captain. Until you add it, quotes use Instrument Serif.

1. Obtain a licensed copy (check the licence covers web embedding).
2. Save it as `public/fonts/AmericanCaptain.woff2` (convert with a tool such as `woff2_compress` if needed).
3. In `src/index.css`, uncomment the `url('/fonts/AmericanCaptain.woff2')` line in the `@font-face` block.

If the font is installed on a visitor's computer it is also picked up automatically via `local()`.

## Deploy to Vercel

### 1. Push to GitHub

Create an empty repository on github.com first (no README), then from this folder:

```bash
git init
git add .
git commit -m "Initial commit: STILL / FOCUS"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 2. Import into Vercel

1. Sign in at [vercel.com](https://vercel.com) (with GitHub is easiest).
2. **Add New… → Project**, then **Import** your repository (grant Vercel access to it if asked).
3. Vercel detects Vite automatically (`vercel.json` already sets the build command, `dist` output and SPA rewrite).
4. Leave the defaults and click **Deploy**. No environment variables are needed.

### 3. Get the public URL

When the deployment finishes, Vercel shows it on the project page (**Domains**), in the form
`https://<project-name>.vercel.app`. Open it to confirm it works, then share it. Every push to `main` redeploys.

### 4. Custom domain (later)

1. Buy a domain from any registrar.
2. In Vercel: **Project → Settings → Domains → Add**, enter the domain.
3. Add the DNS records Vercel shows you at your registrar (usually an `A` record for the apex domain and a
   `CNAME` for `www`) — or switch the domain's nameservers to Vercel.
4. Wait for DNS to propagate; Vercel issues HTTPS automatically.

## Project structure

```
src/
  App.tsx                    composition + timer/sound wiring
  components/                BackgroundVideo, Navigation, FocusTimer, QuoteDisplay,
                             TimerControls, SessionModes, RewardPanel, SoundToggle, ui/Button
  data/quotes.ts             your quotation library
  data/milestones.ts         milestones and reward messages
  hooks/                     useTimer, useSound, useQuoteDeck
  lib/                       timerReducer (pure), sound (Web Audio), format
  index.css                  design tokens, .liquid-glass, animations
```
