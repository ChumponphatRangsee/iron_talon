# Game Design

## Implemented single-player

The current game is a top-down/angled 3D combat arena. React displays menu, HUD, defeat and victory overlays; Three.js renders procedural geometry. There are five waves containing 4, 5, 6, 7 and 10 enemies. Enemy types are rifleman, shotgunner, heavy, sniper and grenadier.

Movement uses WASD/arrow keys. Space or the mouse fires using enemy targeting/aim assistance; firing still requires a target in range. Shift dodges, G throws a grenade, Q calls an airstrike and F calls a drone. Reload occurs automatically when ammunition is depleted. These bindings describe source, not a fresh browser verification.

Initial player values are 100 HP, 50 armor, 30 ammunition and 3 grenades. Wave completion requires eliminating enemies. Current wave labels do not implement data capture or extraction objectives. Single-player must remain usable during subsequent refactoring.

## Accepted direction, Proposed implementation

- Browser co-op PvE for 1-7 players in a room, retaining React + Three.js.
- Node.js + Colyseus authoritative movement, projectiles, damage and AI.
- Join through an invite link; reserve disconnected players' seats for 60 seconds, within the seven-seat total.
- Mission progression: assault the base, secure data, extract.

## Historical proposals, not approved gameplay requirements

The original design suggests seven roles, revive/downed mechanics, mission durations, shared support, objective timings, difficulty formulas, friendly-fire rules and a possible 7v7 mode. These need explicit product decisions and playtesting before implementation. Do not copy the proposed key bindings over the current controls during preparation.

Read the [reference provenance](references/README.md). The original report predates local simulation extraction, the real test suite, npm-based Three.js loading and resize cleanup. Current source and [baseline](BASELINE.md) determine implemented status.
