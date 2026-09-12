# Architecture

Status: current boundaries are Implemented in part; the multiplayer architecture is Proposed. See [baseline evidence](BASELINE.md).

## Current runtime and ownership

`src/App.jsx` creates a runtime and displays React HUD/overlays. `src/game/runtime/` initializes the engine and manages timeout cancellation. `src/game/engine.js` still creates the scene, map, input bindings, audio, projectiles, combat and render loop.

`src/game/simulation/` contains numeric player/enemy state, movement, collision, attack selection and wave progression. Engine view objects proxy that state through `bindSimulationState`. This bridge is transitional, not a complete simulation interface.

| Data | Current owner | Target owner |
|---|---|---|
| Player/enemy positions and movement | Numeric simulation state through engine proxies | Simulation |
| Bullets, grenades, destructible map objects | Engine objects containing meshes | Simulation entities; renderer views keyed by ID |
| Damage, abilities, targeting, spawning | Engine | Simulation |
| Score and combo time | React UI updater and wall-clock time | Simulation; HUD projects results |
| Phase/wave | Duplicated across simulation, engine and UI | Simulation; adapters publish views |
| Geometry, camera, particles, sound | Engine | Client renderer/audio |
| Delayed gameplay and visual effects | Shared browser timer registry | Simulation tick scheduler / separate presentation timers |

The loop uses variable frame-normalized `dt`; a fixed simulation tick does not exist. Map colliders are constructed together with rendering. Restart cancels registered timers and restores barrel colliders, but full restart integration is not verified. Resource teardown closes renderer/audio but geometry/material lifecycle needs further work.

## Directory policy now

- Keep `src/`, `test/` and root package/config files in place.
- `src/game/{audio,effects,enemies,projectiles,scene}/index.js` are placeholders; their logic remains in the engine. Do not mistake folder existence for extraction.
- `src/game/core/` holds constants/math; compatibility re-exports remain in place.
- `docs/` contains project guidance; `docs/baselines/` contains immutable evidence; `docs/references/` preserves historical input.
- `scripts/` contains reusable maintenance tools. `artifacts/` is ignored and contains generated output and the isolated upstream checkout.
- `node_modules/` and `dist/` are reproducible output. Do not manually reorganize them or vendor temporary runtimes.

## Proposed workspace boundary

| Future location | Responsibility |
|---|---|
| `apps/client` | React UI, Three.js renderer, input mapping, local/network adapters |
| `apps/server` | Node/Colyseus rooms, sessions, input validation, room lifecycle |
| `packages/simulation` | Headless state, movement, combat, AI, progression, tick scheduling |
| `packages/protocol` | Versioned message/state contracts and validation definitions |
| `packages/content` | Numeric map/collider definitions and mission configuration |
| `tests` | Cross-package integration, browser, multiplayer and load scenarios |
| `infra` | Deployment configuration when deployment preparation starts |

Use npm workspaces when migration is authorized. Keep unit tests with their owning package. Simulation must not import client/server framework code; the server adapts simulation to Colyseus and the client adapter adapts state to rendering. Content must not require WebGL. Protocol definitions must not expose rendering objects or server secrets.

Local single-player and server rooms should drive the same simulation through an explicit input/step/state/event boundary. The exact API and network schema will be designed in their implementation stages; this preparation introduces neither. See [roadmap](ROADMAP.md) and [network requirements](NETWORK_PROTOCOL.md).
