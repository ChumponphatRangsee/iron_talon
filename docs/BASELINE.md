# Preparation Baseline

Captured at 2026-09-12T10:24:47.234Z, before preparation changed `.gitignore`. Status: upstream identity and file comparison Verified; tests/build Verified only within the scope in [testing](TESTING.md).

## Source identity

- Working source: `C:\Game_implement`, without root `.git` metadata. No root repository was initialized, no history was rewritten, and no commit or push was performed.
- Upstream: [ChumponphatRangsee/iron_talon](https://github.com/ChumponphatRangsee/iron_talon), branch `main`, shallow checkout at `88e390fa97f7aa663240af3b23bfda05d0cbdef5`.
- Isolated checkout: `artifacts/upstream/iron_talon`. This is a separate nested directory, not a replacement for the working root; it is ignored and can be recreated from the recorded commit.
- [Immutable source manifest](baselines/preparation-source.json) records raw SHA-256 and LF-normalized text hashes for source, tests, package/config files and the original local `.gitignore`. Documentation, dependencies, build output and temporary files are outside its scope.
- Git initially could not reach GitHub in the sandbox; an approved retry succeeded. Git ownership checks were handled with a command-scoped `safe.directory` for this checkout, not a global configuration change.

## Existing differences from upstream

37 paths compared: 11 content-modified, 9 local-only, 17 differing only in line endings, and no upstream-only files. These differences existed before Preparation; they were not implemented by this documentation task.

| Files | Existing local difference |
|---|---|
| `.gitignore` | Expanded generated/runtime/environment exclusions |
| `index.html` | Empty data favicon added; title remains Project Warzon |
| `package.json`, `vite.config.js` | ES modules; real Node test command; npm Three.js dependency |
| `package-lock.json` | Three.js 0.128.0 root dependency and resolved package entry added |
| `src/App.jsx` | Runtime startup without external Three.js script loading; development runtime exposure |
| `src/game/engine.js` | Partial numeric simulation integration, registered timers, resize handling, grenadier selection and restart collider restoration |
| `src/game/input/disposeInput.js` | Resize listener cleanup |
| `src/game/loop/disposeRuntime.js` | Timer reset and AudioContext teardown |
| `src/game/player/actions.js` | Start also updates simulation phase |
| `src/game/runtime/createGameRuntime.js` | Timer registry ownership |
| `src/game/runtime/createTimerRegistry.js` | Local-only cancellable callback registry with generation guard |
| Six `src/game/simulation/` files | Local-only state, movement, combat selection, collision, progression and exports |
| Two `test/` files | Local-only nine helper-level regression tests |

The full per-path comparison and upstream/local hashes are in the manifest. The 17 line-ending-only paths include unchanged UI, constants/math, runtime exports and placeholder modules. No line-ending normalization was applied to source during Preparation.

## Preparation changes

New English guidance, roadmap, decision/provenance records, immutable baseline evidence and two reusable maintenance scripts were added. The original Thai reference was copied unchanged. `.gitignore` gains `artifacts/`; no application source, test, package, lockfile, Vite configuration or HTML file was changed by Preparation.

Reference source and destination SHA-256:

```text
AC10044BD1A9C9E176568DF00DD99331710FA823F8A699D848D7B0244A4C3E9C
```

The manifest establishes file identity, not Git ancestry for local edits. It cannot prove who made those edits. Keep the local source until a future integration has compared and preserved every change.

## Reproduce a comparison

From the project root, with Git and Node on PATH and an existing isolated checkout:

```sh
node scripts/capture-baseline.mjs artifacts/upstream/iron_talon artifacts/baseline-next.json
node scripts/check-docs.mjs
```

The capture tool refuses to overwrite a baseline. Pass `none` in place of the checkout to capture local-only evidence when upstream is unavailable; the output then has no verified upstream identity. On Windows, `GIT_EXECUTABLE` may name the installed Git executable if PATH is stale. Generated ad-hoc comparisons belong in `artifacts/`; preserve an intentional milestone manifest under `docs/baselines/` with a new name.

Before a later integration, verify the comparison checkout's commit and keep current local changes intact. Do not copy the upstream tree over this working directory or use destructive reset commands to establish a baseline.
