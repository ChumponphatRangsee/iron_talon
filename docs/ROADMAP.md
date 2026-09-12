# Roadmap

Status terms: `Proposed` = not implemented; `Implemented` = code/artifacts exist; `Verified` = evidence for a stated scope. Product acceptance and implementation status are separate.

| Stage | Status | Deliverable and exit gate |
|---|---|---|
| Preparation | Implemented; baseline checks Verified | English documentation, upstream comparison, immutable hashes, directory/AI policy; existing tests and build recorded in testing |
| Simulation Completion | Proposed; partial extraction already Implemented | Headless movement, combat, projectiles, AI, progression and map data; fixed timestep; cancellable simulation events; no rendering dependency |
| Workspace Migration | Proposed | npm workspaces for client/server/simulation/protocol/content as actual code becomes available; root commands preserved and clean-install tests/build pass |
| Network Slice | Proposed | Node/Colyseus authority, invite/session flow, 7-seat admission and 60-second reconnect; two browsers then seven independent clients share combat state; eighth seat rejected |
| Co-op Mission | Proposed | Assault-data-extraction progression, multiplayer AI targeting and agreed team mechanics; 1-7 players can finish with consistent outcome |
| Reliability/Capacity | Proposed | Abuse validation, room isolation, repeated reconnect/rematch, drain, telemetry and combat load tests on a recorded environment |

## Preparation evidence and remaining setup

See [baseline](BASELINE.md) and [testing](TESTING.md). The original source directory has no Git history; the comparison checkout is isolated. Preparation itself did not commit or push. A subsequent user-authorized GitHub integration includes the existing local Phase 1 source and preparation documents through that checkout; the original source directory remains intact. Continue Git operations in a proper checkout and reconcile any later local edits before publishing.

After Git workflow is established, add CI for tests/build and documentation impact review. A local documentation link checker exists; automatic enforcement of content correctness does not.

## Gate before Network Slice

- A complete mission/wave scenario advances headlessly through movement, collision, firing, damage, AI and progression.
- Simulation does not import React, DOM or Three.js; renderer consumes state/events.
- Fixed timestep, seeded/injected gameplay randomness and scheduled events produce reproducible test scenarios independent of display FPS.
- Restart while wave/airstrike/barrel events are pending cannot mutate the new match. Restore map collision state.
- Single-player passes browser regression for start, movement, combat, abilities, defeat/restart, victory and resize; compare cooldown behavior at 30/60/144 render FPS.
- Workspace migration preserves supported development/test/build commands.

## Outstanding decisions and risks

Network Slice must settle lifecycle details listed in [network requirements](NETWORK_PROTOCOL.md) and pin compatible server/SDK versions. Co-op Mission must settle the historical gameplay proposals before implementing them. Geometry/material disposal, focus-loss input cleanup, collision edge cases and frame-dependent damping need investigation during Simulation Completion and browser regression.

Do not treat the historical report's P0/P1 labels as these stage names. Its 70-CCU alpha figure is a target, not measured capacity. Do not deploy or claim a room-per-machine limit before Reliability/Capacity evidence.
