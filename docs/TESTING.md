# Testing

## Commands

Run from the project root with Node on PATH:

```sh
npm test
npm run build
node scripts/check-docs.mjs
```

`npm test` uses Node's built-in test runner. `npm run build` uses Vite and writes `dist/`. The documentation checker validates local inline-link file targets in authored Markdown; it skips the preserved reference and does not validate remote URLs, anchors, code examples or document truth.

## Preparation verification

Environment: Windows, Node 24.21.0, npm 11.19.0; existing installed dependencies. See [source identity](BASELINE.md) for capture time and upstream commit.

| Check | Result | Limitations |
|---|---|---|
| `npm test` | Verified: 9 passed, 0 failed | Helper-level tests, not a complete headless game |
| `npm run build` | Verified: 50 modules, successful output | 745.09 kB main JS / 202.30 kB gzip; Vite warns above 500 kB |
| `node scripts/check-docs.mjs` | Verified: local link targets in 12 authored Markdown files | Original reference, remote URLs and anchors excluded |
| `node --check scripts/capture-baseline.mjs` and `node --check scripts/check-docs.mjs` | Verified: both parse successfully | Capture also exercised against the actual upstream checkout; not a general tooling test suite |
| SHA-256 comparison against preparation manifest | Verified: only `.gitignore` differs, adding `artifacts/` | New documentation/tooling is outside the original application manifest |
| Original reference copy | Verified: source/destination SHA-256 match | Historical content is preserved, not revalidated as current requirements |
| Browser gameplay | Not run in Preparation | Build success does not prove playability |
| Fresh `npm ci` | Not run in Preparation | No clean-install validation claimed |
| Multiplayer/load/deployment | Not implemented or tested | No capacity or reconnect guarantee |

Existing tests cover numeric state serialization, player/enemy movement, basic collision/LOS, grenadier attack selection, wave advancement, player reset and timer reset/new callbacks. They do not verify actual grenade spawning, full combat, old callbacks already queued for execution, or restart through the engine.

## Required browser regression for later source changes

Record browser/version, viewport, GPU where relevant, command/URL and observations. Start a mission; move in all directions; fire/reload; use dodge, grenade, airstrike and drone; exercise defeat/restart and all-wave victory. Restart while explosions and wave transitions are pending and inspect restored barrel collision. Test resize and loss/regain of focus, console errors and renderer resource counts after repeated rematches.

For simulation timing changes, compare intended movement/cooldown durations across 30/60/144 render FPS. Add headless scenarios covering projectiles, damage, AI and progression with controlled randomness and time before networking.

## Future network acceptance

Test 7 clients and rejection of an eighth, including simultaneous joins and reconnect reservations. Reconnect before/after the 60-second deadline; assert no duplicate entity and current ammo/cooldowns/objective state. Test two-room isolation, forged state, invalid/duplicate/stale inputs and disconnect during combat. Load tests must simulate combat and report tick/frame/network measurements, not idle socket counts.

Keep generated screenshots/logs in ignored `artifacts/`. Record durable evidence summaries here or in a new baseline report; do not overwrite historical manifests.
