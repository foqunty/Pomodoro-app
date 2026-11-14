# Pomodoro App — STILL / FOCUS

A minimal focus timer for studying, coding, and taking regular breaks. **STILL / FOCUS** combines the Pomodoro technique with adjustable sessions, ambient sound, and a quiet interface designed to stay out of your way.

**[Try the live app](https://pomodoro-app-iota-gules.vercel.app/)** · **[Source code](https://github.com/foqunty/Pomodoro-app)**

## Why I built it

This is my first web application. I wanted a simple tool I could use while studying or programming, without unnecessary distractions. Building it also gave me a chance to practise React, TypeScript, working with browser APIs, and publishing an app that other people can use.

I developed it with help from Claude Code. The project has been a way to learn how to turn an idea into a working interface, review generated code, and improve the details through testing.

## What you can do

| Feature | How it works |
| --- | --- |
| Focus and breaks | Switch between focus sessions, short breaks, and long breaks. Defaults are **25 / 5 / 15 minutes**. |
| Adjustable timer | Change the duration of each mode. Focus supports 1–90 minutes, short breaks 1–30, and long breaks 1–60. |
| Pomodoro cycles | A long break is suggested after the selected number of completed focus sessions (four by default). |
| Timer controls | Start, pause, resume, reset, or skip a session. Skipping does not award progress. |
| Ambient audio | Choose brown noise, soft noise, rain, or a YouTube focus mix; control audio preferences and volume. |
| Completion alerts | Optional sounds and browser notifications let you know when a session ends. |
| Progress and rewards | Track completed focus sessions, focused minutes, points, and small milestones. |
| Changing quotes | Short quotes rotate during the session. |
| Keep screen awake | Optionally request that the screen stays awake during a running timer, when supported by the browser. |
| Installable web app | A web app manifest and service worker support installation and offline use of cached app resources. |

Some features depend on browser support or permissions. For example, notifications require permission, and keeping the screen awake is not available in every browser. YouTube audio needs an internet connection.

## How to use it

1. Open the **[live application](https://pomodoro-app-iota-gules.vercel.app/)**.
2. Choose **Focus**, **Short break**, or **Long break**.
3. Adjust the duration if you want something different from the default.
4. Press **Start** and work until the timer finishes. You can pause or reset it at any point.
5. When a session ends, review your progress and continue with the suggested next session.
6. Use the settings to change your cycle length, sounds, notifications, or keep-awake preference.

**Example:** Complete four 25-minute focus sessions, taking short breaks between them, and then take a longer break. You can change the durations and the number of sessions in a cycle to suit your routine.

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

## Technologies

| Technology | Role |
| --- | --- |
| **React 19** | UI components and interaction |
| **TypeScript** | Typed application logic |
| **Vite** | Local development and production builds |
| **Tailwind CSS 4** | Styling and responsive layouts |
| **Framer Motion** | Interface animations and transitions |
| **Lucide React** | Interface icons |
| **Web APIs** | Notifications, Wake Lock, local storage, and service worker support |
| **Vercel** | Hosting the live web app |

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

## Run it locally

**Requirements:** Node.js 22 or newer and npm.

```bash
git clone https://github.com/foqunty/Pomodoro-app.git
cd Pomodoro-app
npm install
npm run dev
```

Open the local address shown by Vite (usually **http://localhost:5173**).

### Build and preview

```bash
npm run build
npm run preview
```

The build script runs TypeScript checking and creates production files in `dist/`. The preview command serves that build locally.

The project does not currently define a dedicated automated test command in `package.json`. Timer behavior and browser interactions should still be checked manually when making changes.

## Deployment

The live version is hosted on **Vercel**:

**https://pomodoro-app-iota-gules.vercel.app/**

The repository includes a `vercel.json` configuration for the Vite build, single-page-app routing, caching, and security-related response headers. The generated `dist/` directory is the deployment output.

## Limitations and ideas for improvement

- Browser permissions and capabilities vary, especially for notifications and keeping the screen awake.
- YouTube-based background audio is not available offline.
- Local storage is device-specific; there is currently no account-based synchronization.
- A future improvement is automated testing for timer state transitions, saved-state restoration, and break cycles.

## Author

Built by **[Sedat Çoban](https://github.com/foqunty)** as a personal learning project, with development assistance from **Claude Code**.

## License

Released under the [MIT License](LICENSE).
