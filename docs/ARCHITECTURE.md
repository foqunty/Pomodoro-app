# How the app works

More detail about the timer, data, and project layout. The main README has the short version.

## How the timer works

The timer keeps track of a target end time rather than trusting a simple counter that increments once a second. This helps it recover when the browser tab is in the background or the page is refreshed.

- A **running** session is reconstructed from the saved end time.
- A **paused** session restores its remaining time.
- A session whose end time passed while the page was closed can be completed on restoration.
- The app avoids replaying a completion notification for a session that has already been handled.

The core timer transitions and Pomodoro cycle rules live in `src/lib/timerReducer.ts`, separate from the user interface.

## Data and privacy

STILL / FOCUS does not require an account. Progress, timer state, and preferences are stored locally in the browser using `localStorage`.

- No backend or cloud database is used to synchronize your progress.
- Saved data is validated before it is loaded. Invalid or unexpected values fall back to safe defaults.
- If browser storage is unavailable, the app can continue running without persistent saves.
- You can reset your saved progress through the app.

Clearing the browser's site data also removes locally saved progress. Data does not automatically sync between devices or browsers.

## Project structure

```text
Pomodoro-app/
├── public/
│   ├── fonts/             # Local font assets
│   ├── icons/             # App icons
│   ├── manifest.webmanifest
│   └── sw.js              # Service worker
├── scripts/
│   └── sw-plugin.mjs      # Service-worker build integration
├── src/
│   ├── components/        # Timer, navigation, settings, audio and rewards UI
│   ├── config/            # App and music configuration
│   ├── data/              # Quotes and milestone definitions
│   ├── hooks/             # Timer, sound, notifications, connectivity, wake lock
│   ├── lib/               # Timer rules, storage, audio and browser utilities
│   ├── App.tsx            # Main application UI
│   ├── index.css          # Global styles
│   └── main.tsx           # React entry point
├── index.html
├── vite.config.ts
├── vercel.json
└── package.json
```

## Deployment

The live version is hosted on **Vercel**:

**https://pomodoro-app-iota-gules.vercel.app/**

The repository includes a `vercel.json` configuration for the Vite build, single-page-app routing, caching, and security-related response headers. The generated `dist/` directory is the deployment output.

