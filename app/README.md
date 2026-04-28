# Chromium Profile Manager App

Electron + Vue 3 + TypeScript desktop app for managing local Chromium profiles.

## Development

```sh
npm install
npm run dev:electron
```

## Build

```sh
npm run build
npm run build:electron
```

## Test

```sh
npm test -- --run
```

## Data layout

The app reads and writes project-level data without migration:

- `../data/profiles/<profile-id>/profile.json`
- `../data/profiles/<profile-id>/bookmarks.json`
- `../data/profiles/<profile-id>/quick-links.json`
- `../data/logs/<profile-id>.log`
- `../data/extensions/<extension-id>/...` or `../data/extensions/<extension-id>.crx`
- `../scripts/automation/*.py`
