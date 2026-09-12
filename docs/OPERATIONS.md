# Operations

## Current local setup

Validated on Windows with Node 24.21.0, npm 11.19.0, Git 2.55.0.windows.5. No root Git metadata exists. The package lock is authoritative for dependency installation; no package manager migration or dependency update was performed.

Standard commands are in [README](../README.md). If an existing PowerShell process cannot resolve the installed tools, use a session-only PATH adjustment:

```powershell
$env:PATH = 'C:\Program Files\nodejs;C:\Program Files\Git\cmd;' + $env:PATH
node --version
npm.cmd --version
git --version
npm.cmd test
npm.cmd run build
```

For a fresh installation run `npm.cmd ci`. This was not rerun during baseline verification; tests/build used the existing installed dependencies. Do not restore `.tmp-node` as an implicit toolchain dependency.

`npm run dev -- --host 127.0.0.1` normally starts at 5173; read the printed URL if occupied. Vite preview normally starts at 4173 after build. Neither port is a production promise. Check process identity before stopping a server; do not terminate all Node processes.

No application environment variables, credentials, database or backend are required today. Future public Vite variables are bundled into the browser and must never contain secrets. Keep private credentials out of Markdown, source, invite links and logs.

## Proposed infrastructure

Start with one long-running Node/Colyseus process and isolated rooms. Serve frontend static files over HTTPS and WebSocket traffic over WSS. Add health/readiness checks, structured logs, room/seat counts, tick duration, event-loop delay, memory and bandwidth metrics when the server exists.

Future deployments must stop accepting new rooms and drain existing rooms within an explicitly chosen shutdown policy. Record version compatibility and rollback behavior before the first deployment. A process restart can interrupt live matches; reconnect does not preserve crashed in-memory simulation.

When expanding across processes, configure shared presence/matchmaking and route connections to the room-owning process. Redis is the proposed coordination service; see [Colyseus scalability](https://docs.colyseus.io/scalability). Add durable storage when accounts or persistent results become approved requirements, not merely to run a local room.

Hosting provider, machine size, regions, costs and measured concurrency remain undecided. The historical 70-CCU target is not a capacity guarantee. No infrastructure resources were provisioned in Preparation.
