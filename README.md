# Chromium Profile Manager

[简体中文文档 / Simplified Chinese](./README.zh-CN.md)

This repository contains two related layers:

1. **ungoogled-chromium shared transformation layer** (repo root)
   - Patch/config/tooling workspace used to transform upstream Chromium into ungoogled-chromium.
   - Includes `patches/`, `utils/`, `devutils/`, `flags.gn`, `downloads.ini`, `domain_*.list`, and `pruning.list`.
2. **Local desktop app** (`app/`)
   - An Electron + Vue + TypeScript desktop application for managing and launching local Chromium profile configurations.

> This repo is not the full Chromium source tree.

## Acknowledgments

This project is built on top of and inspired by [ungoogled-chromium](https://github.com/ungoogled-software/ungoogled-chromium).

## Desktop app (`app/`) features

- Profile list and quick operations (launch / stop / settings / automation)
- Create new profile from the profiles grid (`+` card at the bottom)
- Profile settings modal (general, launch info, extensions, bookmarks, logs)
- Runtime state tracking with PID display
- **Auto-stop runtime state when the browser process exits**
- Automation script management for `scripts/automation/*.py` (start/stop/list/open folder)
- Extension management (import unpacked dir or CRX, then enable per profile)
- Bookmarks and quick links storage per profile
- Software settings (font, accent color, background color)
- Custom draggable titlebar for frameless Electron window

### Current runtime behavior

- `launch_profile` starts Chromium and tracks PID.
- If Chromium is closed externally, runtime state is updated to `stopped` automatically.
- `stop_profile` currently updates app runtime state/logs but **does not kill the OS browser process**.

## Data layout (`app`)

- `data/profiles/<profile-id>/profile.json`
- `data/profiles/<profile-id>/bookmarks.json`
- `data/profiles/<profile-id>/quick-links.json`
- `data/logs/<profile-id>.log` (JSONL)
- `data/extensions/<extension-id>/...` or `data/extensions/<extension-id>.crx`

## Quick start (desktop app)

### Requirements

- Node.js + npm
- Python in `PATH` (automation scripts are launched with `python`)
- A local Chromium runtime (new profiles default to a runtime path under `./runtime/.../chrome.exe`)

### Install and run

```sh
npm --prefix app install
npm --prefix app run dev:electron
```

### Build and test

```sh
npm --prefix app run build
npm --prefix app run build:electron
npm --prefix app test -- --run
```

## Shared ungoogled-chromium layer (root)

Useful commands:

```sh
./devutils/check_all_code.sh
python3 devutils/validate_config.py
python3 devutils/validate_patches.py -r
```

For full build/design workflow, see:

- `docs/building.md`
- `docs/design.md`
- `docs/developing.md`
- `docs/platforms.md`

## License

BSD-3-Clause (`LICENSE`).
