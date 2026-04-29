# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

This repository is **not** the full Chromium source tree. It is the shared ungoogled-chromium layer that defines how upstream Chromium is transformed into ungoogled-chromium through:

- configuration files (`chromium_version.txt`, `downloads.ini`, `flags.gn`, `domain_regex.list`, `domain_substitution.list`, `pruning.list`)
- quilt-style patch stacks under `patches/`
- Python tooling in `utils/` and `devutils/`

Platform-specific packaging and full build orchestration live in separate repositories listed in `docs/platforms.md`.

## Repository layers

This checkout contains two largely independent layers:

1. **Shared ungoogled-chromium transformation layer** (repo root): config + patches + Python tooling used by platform build repos.
2. **Local profile manager app** (`app/`): an Electron + Vue + TypeScript desktop app for managing and launching local Chromium profile configurations.

Do not conflate app-layer changes with the shared transformation pipeline; platform build expectations still come from the root-layer artifacts.

## Core architecture

### Shared-layer transformation pipeline

The root-layer tooling follows a fixed source transformation flow:

1. obtain Chromium sources (`utils/downloads.py` for tarballs, `utils/clone.py` for a full checkout)
2. prune bundled binaries (`utils/prune_binaries.py`)
3. apply ordered patches from `patches/series` (`utils/patches.py`)
4. substitute Google-related domains (`utils/domain_substitution.py`)
5. build Chromium with GN/Ninja using `flags.gn`

Read `docs/design.md` and `docs/building.md` before changing this flow.

### Shared-layer sources of truth

- `patches/series` is the authoritative patch apply order.
- `patches/core/` contains essential ungoogling patches that must stay aligned with Chromium updates.
- `patches/extra/` contains optional or less stable feature/control patches.
- `downloads.ini` defines source archives and extraction metadata.
- `flags.gn` is validated as a sorted, duplicate-free GN arg list.
- `domain_regex.list` defines regex replacements.
- `domain_substitution.list` defines which files are rewritten.
- `pruning.list` defines which files are removed from the source tree.

### Python tooling split

- `utils/`: end-user/build pipeline helpers that operate on Chromium source trees.
- `devutils/`: maintainer tooling for validation, list generation, linting, and tests.
- `utils/_common.py`: shared constants/CLI helpers (including version and patch series parsing).

### App architecture (Electron + Vue profile manager)

Frontend (`app/src`):

- Single-shell Vue app: `AppShell` → `ProfilesPage` → profile settings modal/panels.
- Pinia stores in `app/src/stores/` own UI state and call service wrappers in `app/src/services/`.
- Services call the Electron preload bridge through the compatibility `tauriInvoke()` facade.
- `profiles` store auto-creates a default profile on first run if none exist.

Backend (`app/electron`):

- `main.ts` wires Electron window lifecycle, IPC handlers, and app data directory setup.
- `preload.ts` exposes a minimal `window.electronAPI` bridge with command invocation and window controls.
- `ipc/handlers.ts` allowlists app commands and routes them to TypeScript services.
- `services/` exposes app operations (profiles, launcher/runtime, logs, extensions, bookmarks, automation).
- `services/runtime.ts` tracks in-memory runtime transitions (`idle/starting/running/stopped/error`).
- `services/paths.ts` resolves relative paths against the project root before launch.

On-disk app data layout:

- `data/profiles/<profile-id>/profile.json`
- `data/profiles/<profile-id>/bookmarks.json`
- `data/profiles/<profile-id>/quick-links.json`
- `data/logs/<profile-id>.log` (JSON lines)
- `data/extensions/<id>/...` (directory imports) or `data/extensions/<id>.crx`

Important runtime behavior:

- Launch path resolution and command preview/logging happen in `app/electron/services/runtime.ts`.
- `stop_profile` currently marks runtime state as stopped and writes a log entry; it does **not** kill an OS process.

### Cross-layer contracts in the app

- Keep renderer TypeScript types aligned with Electron service return shapes (`app/src/types/*.ts` ↔ `app/electron/services/types.ts`).
- Command names are part of the API contract (`app/src/services/*.ts` ↔ `app/electron/ipc/handlers.ts`).

### Scoped use of `vue-expert` skill (app/src only)

Use `vue-expert` as a frontend-only guide with these six rules:

1. Apply `vue-expert` guidance only to `app/src/**` files.
2. Do not use `vue-expert` to change `app/electron/**`, root-layer Python tooling (`utils/`, `devutils/`), or patch/config artifacts (`patches/`, `flags.gn`, `downloads.ini`, `domain_*.list`, `pruning.list`).
3. Keep the existing app stack and patterns: Vue 3 + TypeScript + Vite + Pinia, with `<script setup>` in Vue SFCs.
4. Do not introduce Nuxt/SSR, Quasar/Capacitor, or PWA/service-worker architecture unless explicitly requested.
5. Preserve frontend↔Electron IPC contracts when editing `app/src`: command names and payload shapes in `app/src/services/*.ts` must continue matching `app/electron/ipc/handlers.ts`.
6. For `app/src`-only changes, validate with app-layer commands (`cd app && npm run build`, `cd app && npm test -- --run`) and avoid unrelated root-layer validation unless those layers are also changed.

### Patch maintenance model

Patches are maintained in GNU Quilt format. For Chromium rebases, follow the quilt workflow in `docs/developing.md` rather than introducing alternate patch rewrite mechanisms.

### Domain substitution model

Domain substitution is a fail-safe, not cosmetic rewriting. Replacement domains end in `qjz9zk` so missed Google-bound requests become visible/blockable. `utils/domain_substitution.py` also supports reversion using its cache archive.

### Binary pruning model

Binary pruning removes prebuilt binaries and related artifacts from the source tree. `devutils/update_lists.py` regenerates `pruning.list` and `domain_substitution.list` from a Chromium source tree.

## Common commands

Run commands from repository root unless noted.

### Validate, lint, and test Python tooling (full pass)

```sh
./devutils/check_all_code.sh
```

Runs yapf, pylint, and pytest for both `utils/` and `devutils/`.

### Python formatting

```sh
./devutils/run_utils_yapf.sh
./devutils/run_devutils_yapf.sh
```

### Python linting

```sh
./devutils/run_utils_pylint.py
./devutils/run_devutils_pylint.py
```

If lint fails only on FIXME comments, wrappers can be rerun with `--hide-fixme`.

### Python tests

```sh
./devutils/run_utils_tests.sh
./devutils/run_devutils_tests.sh
```

Direct pytest equivalents:

```sh
python3 -m pytest -c utils/pytest.ini
python3 -m pytest -c devutils/pytest.ini
```

Run a single test file:

```sh
python3 -m pytest -c utils/pytest.ini utils/tests/test_patches.py
python3 -m pytest -c devutils/pytest.ini devutils/tests/test_validate_patches.py
```

Run a single test function/pattern:

```sh
python3 -m pytest -c utils/pytest.ini utils/tests/test_patches.py -k test_name
python3 -m pytest -c devutils/pytest.ini devutils/tests/test_validate_patches.py -k test_name
```

### App layer (Vue + Electron)

Command context (important):

- If your CWD is repository root, use `npm --prefix app run <script>`.
- If your CWD is `app/`, use `npm run <script>` (do not add `--prefix app`, or npm will resolve `app/app/package.json`).

Install JS dependencies:

```sh
cd app && npm install
```

Run frontend tests:

```sh
cd app && npm test -- --run
```

Run one Vitest file:

```sh
cd app && npx vitest run src/path/to/file.test.ts
```

Run Vitest by test name:

```sh
cd app && npx vitest run -t "test name"
```

Run frontend tests in watch mode:

```sh
cd app && npm run test:watch
```

Build app:

```sh
cd app && npm run build
```

Build Electron installers:

```sh
cd app && npm run build:electron
```

Run Electron app in development:

```sh
cd app && npm run dev:electron
```

Equivalent from repo root:

```sh
npm --prefix app run dev:electron
```

### Validate root-layer configuration and patches

```sh
python3 devutils/validate_config.py
python3 devutils/validate_patches.py -r
```

Use local Chromium sources instead of remote downloads:

```sh
python3 devutils/validate_patches.py -l build/src
```

### Recompute generated lists

Requires an existing Chromium source tree:

```sh
python3 devutils/update_lists.py -t build/src
```

### Retrieve and unpack Chromium source tarballs

```sh
python3 utils/downloads.py retrieve -c build/download_cache -i downloads.ini
python3 utils/downloads.py unpack -c build/download_cache -i downloads.ini -- build/src
```

### Apply the main transformation steps manually

```sh
python3 utils/prune_binaries.py build/src pruning.list
python3 utils/patches.py apply build/src patches
python3 utils/domain_substitution.py apply -r domain_regex.list -f domain_substitution.list -c build/domsubcache.tar.gz build/src
```

### Clone Chromium source instead of tarballs

```sh
python3 utils/clone.py -o build/src
```

### Build outline (shared layer only)

This repo does not contain full platform packaging. Generic flow:

```sh
mkdir -p build/src/out/Default
cp flags.gn build/src/out/Default/args.gn
cd build/src
./out/Default/gn gen out/Default --fail-on-unused-args
ninja -C out/Default chrome chromedriver chrome_sandbox
```

For supported builds, use the platform-specific repositories listed in `docs/platforms.md`.

## Repository-specific expectations

- Preserve project priorities from `README.md`: remove Google web-service dependency first, preserve default Chromium behavior second, keep privacy/control changes mostly opt-in.
- New non-essential features should generally be off by default and exposed through command-line flags / `chrome://flags`, not `chrome://settings` (`docs/contributing.md`).
- Do not modify or bypass existing patches, GN flags, binary pruning, or domain substitution in ways that conflict with platform repo expectations in `docs/repo_management.md`.
- When rebasing patches to a new Chromium version, follow the quilt workflow in `docs/developing.md`.
- Keep config files and patch files UTF-8 encoded; tooling assumes UTF-8.
- The app layer consumes a local Chromium runtime; current verified Windows runtime path is `runtime/ungoogled-chromium-146/ungoogled-chromium_146.0.7680.177-1.1_windows_x64/chrome.exe`.
