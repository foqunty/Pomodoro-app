# Pomodoro App — STILL / FOCUS

A simple focus timer for studying and coding.

**[Live app](https://pomodoro-app-iota-gules.vercel.app/)** · **[Source](https://github.com/foqunty/Pomodoro-app)**

## Why I built it

When I study or write code I lose track of time and forget to take breaks. Most timer apps felt too busy for me, so I wanted to make my own that only does what I need. It is also my first web app, so I used it to learn React and TypeScript and to put something online that other people can use.

I built it with help from Claude Code. I tested the features myself and changed the parts that didn't work the way I wanted.

## Features

- Focus, short break and long break (25 / 5 / 15 min by default, all adjustable)
- Long break after every 4 focus sessions (you can change the number)
- Background sounds: brown noise, soft noise, rain or a YouTube focus mix
- Notification and sound when a session ends
- Progress is saved in the browser, so a refresh doesn't reset the timer
- Optional "keep screen awake" while the timer runs
- Works offline and can be installed as an app (PWA)

Some of these need browser permission (notifications) or aren't supported in every browser (keep screen awake). YouTube audio needs internet.

## Tech

React 19, TypeScript, Vite, Tailwind CSS 4, Framer Motion. Hosted on Vercel.

## Run it locally

Needs Node.js 22+.

```bash
git clone https://github.com/foqunty/Pomodoro-app.git
cd Pomodoro-app
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` makes the production build.

## More details

How the timer keeps time, how data is stored, and the folder structure are in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## What I want to add next

- Automated tests for the timer logic
- Syncing progress between devices

## License

[MIT](LICENSE) © Sedat Çoban ([foqunty](https://github.com/foqunty))
