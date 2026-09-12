# 0001: Prepare Before Migration

Decision: accepted by the user in the Project Preparation Plan.
Implementation status: Implemented for documentation and preparation tooling. Workspace migration and multiplayer remain Proposed.

## Context

Local Phase 1 work differs from upstream, the working root has no Git metadata, and simulation extraction is partial. Moving packages and implementing a server at the same time would obscure the baseline.

## Decision

Keep source/test locations and React + Three.js. Capture upstream comparison and immutable local hashes first. Write all new project documentation in English. Preserve the original Thai reference unchanged with provenance. Add explicit AI documentation-impact instructions. Defer workspaces, runtime API changes, gameplay changes, dependency upgrades, CI enforcement, commits/pushes and deployment.

## Consequences

Preparation can be reviewed separately from game behavior. The original reference remains historical and cannot grant implementation authority. Git integration, simulation completion and browser regression are gates for further networking work. Maintaining documentation is a contributor responsibility; no autonomous background updater is installed.
