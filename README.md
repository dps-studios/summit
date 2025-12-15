# Summit

**Trend-first health intelligence for Garmin users.**

See where you're headed, not just where you are.

## Philosophy

- **Your data. Your files. No subscription.** All data stored locally in SQLite. Export anytime to JSON, CSV, or Markdown.
- **Trends over snapshots.** Detect trajectory shifts across 1W/2W/1M/3M/6M/1Y before they become problems.
- **Plain English insights.** Know what's happening, why it matters, and what to do about it.

## Features

- **Vital Score** - Single daily score (0-100) computed from Body Battery, Sleep, Stress
- **Multi-timeframe trends** - Automatic shift detection across all timeframes
- **Actionable insights** - "Your deep sleep dropped 18% over 3 weeks" + why it matters + strategies to fix
- **Export anywhere** - JSON for machines, CSV for spreadsheets, Markdown for Obsidian

## Tech Stack

- [Tauri v2](https://v2.tauri.app/) - Desktop + mobile from one codebase
- [Svelte 5](https://svelte.dev/) - Lightweight reactive UI
- [SQLite](https://sqlite.org/) - Local-first data storage
- [Garmin Connect API](https://developer.garmin.com/gc-developer-program/) - Health data source

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run tauri dev

# Build for production
bun run tauri build
```

## Project Structure

```
summit/
├── src/
│   ├── lib/
│   │   ├── models/      # TypeScript types and interfaces
│   │   ├── sources/     # Data source abstraction (Garmin, future: Apple Health)
│   │   ├── stores/      # Svelte stores for state management
│   │   └── utils/       # Vital Score calculation, trends, export
│   └── routes/          # Svelte pages
├── src-tauri/
│   └── src/             # Rust backend + SQLite migrations
└── docs/                # Documentation
```

## Roadmap

- [ ] Garmin OAuth integration
- [ ] Daily Vital Score view
- [ ] Trend detection + insights
- [ ] Export to Markdown (Obsidian-friendly)
- [ ] iOS app (via Tauri v2 mobile)
- [ ] Android app

## License

MIT
