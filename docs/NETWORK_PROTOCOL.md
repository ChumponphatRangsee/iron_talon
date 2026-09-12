# Network Requirements

Status: Proposed. There is no network client, game server, deployed endpoint or implemented wire schema. This document defines accepted requirements and identifies decisions to resolve during Network Slice.

## Authority and interfaces

The client sends player intent. The server owns movement, projectiles, damage, AI and mission outcomes. Never accept client-provided HP, damage or position as authoritative. Resolve player identity from the authenticated session, not an arbitrary payload ID.

The future protocol must define a version, match/session identity, ordered input sequence, movement/aim intent and deduplicated discrete actions. Validate types, finite numbers, bounds, rate and stale/duplicate commands. Exact field names, schemas and encoding are intentionally not introduced by this preparation.

State must be serializable and use stable entity/owner/team IDs. Keep simulation state separate from Colyseus schema adaptation and client rendering. Clients need a full initial/reconnect state and subsequent updates; transient effects must not replay as gameplay damage after reconnect.

## Seven seats and reconnect

- The admission invariant is at most seven unique occupied/reserved seats, including loading and reconnect reservations. Do not count a seat twice when it changes state.
- A dropped participant keeps their seat for 60 seconds. Expiry releases it; successful reconnect reuses the participant and entity rather than creating a duplicate.
- Keep invite codes separate from private reconnect credentials. Do not expose reconnect tokens in invite links or logs.
- Reconnect must restore current authoritative state and reset stale input handling. Losing the server process is not covered by client reconnect; no crash-recovery guarantee exists.
- Resolve intentional leave behavior, mid-mission admission, host transfer, disconnected-character behavior and all-disconnected room cleanup before implementing the lifecycle. These are not approved gameplay rules yet.

## Proposed starting measurements

Evaluate a fixed 30 Hz simulation, 15-20 state updates/second and bounded input sending; these are tuning candidates, not benchmarks. Measure correction behavior at 50/100/200 ms RTT, room isolation and real combat traffic before committing to capacity.

Pin compatible Colyseus server/SDK versions during implementation and consult the documentation for that version. Reference: [rooms](https://docs.colyseus.io/room), [reconnection](https://docs.colyseus.io/room/reconnection). Framework APIs do not replace game-specific admission, validation or regression tests.
