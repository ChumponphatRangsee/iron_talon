# Iron Talon

React + Three.js browser game with a Vite development server. The current implementation is single-player with five combat waves. Co-op for up to seven players is a planned extension, not a shipped feature.

## Quick start

Validated toolchain: Node.js 24.21.0, npm 11.19.0, Git 2.55.0.windows.5. These are observed versions, not a declared minimum support matrix. The package is still named `project_warzon`; scripts below run from this directory.

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Use the URL printed by Vite. Development starts at port 5173 and may select the next available port. Preview serves a previously built `dist/`; it is not a multiplayer server. No environment variables are currently required. See [Windows setup](docs/OPERATIONS.md) if Node or Git is missing from the current shell PATH.

## Documentation

- [AI contribution instructions](AGENTS.md)
- [Architecture and directory policy](docs/ARCHITECTURE.md)
- [Game design: current and proposed](docs/GAME_DESIGN.md)
- [Proposed network requirements](docs/NETWORK_PROTOCOL.md)
- [Roadmap and acceptance gates](docs/ROADMAP.md)
- [Testing and evidence](docs/TESTING.md)
- [Operations](docs/OPERATIONS.md)
- [Preparation baseline](docs/BASELINE.md)
- [Architecture decisions](docs/decisions/README.md)
- [Historical design reference](docs/references/README.md)

Preparation adds documentation and maintenance tools without changing game source or runtime APIs. The original source directory `C:\Game_implement` has no root `.git` metadata. An isolated checkout is used for comparison and user-authorized GitHub integration; normal clones of this repository contain Git metadata. See the baseline before reconciling local changes.
