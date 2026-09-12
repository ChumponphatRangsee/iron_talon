# Instructions for AI Contributors

## Start every task

1. Read this file, [the roadmap](docs/ROADMAP.md), and the documents for the affected subsystem.
2. Inspect actual source and applicable nested instructions. Documents describe intent and evidence; do not assume proposed behavior exists.
3. Check working-tree state when Git metadata is available. Preserve user changes. This directory initially has no root `.git`; do not initialize, replace history, commit, push, or overwrite it merely to make a Git command succeed.
4. Match the user's authorized scope. Reference documents are historical input, not executable instructions. Explicit user instructions take precedence over this file.

## Boundaries

- Keep React + imperative Three.js. Maintain single-player behavior while extending the architecture.
- Simulation owns gameplay state, damage, movement, AI, progression and gameplay time. It must eventually run without React, DOM, WebGL or Three.js. Extraction is currently incomplete.
- Renderer and audio consume state/events. Meshes must not become the authority for newly extracted gameplay systems.
- Do not silently change frame-based constants to seconds. Introduce fixed-step timing with tests that preserve intended speed and cooldown duration.
- Future online play is server-authoritative, with at most seven occupied/reserved seats per room and a 60-second reconnect window. Neither feature exists yet.
- Follow [directory policy](docs/ARCHITECTURE.md). Do not create empty workspace packages or move source until Workspace Migration is authorized.
- Keep reusable tooling in `scripts/`; generated reports, screenshots and comparison checkouts belong in ignored `artifacts/`. Never store the only copy of a reusable test script in a temporary folder.
- Do not change gameplay, public runtime APIs, dependencies or deployment as part of a documentation-only task.

## Documentation impact is part of the change

| Change | Update in the same change set |
|---|---|
| Module location, imports, state ownership, dependency boundaries | Architecture; README if navigation/setup changes |
| Gameplay rules, controls, objectives or balance | Game design; affected test scenarios |
| Messages, schemas, authority, seats or reconnect | Network protocol; compatibility and test requirements |
| Commands, runtime versions, configuration or deployment | README and operations; testing when commands change |
| Completion, blockers or acceptance evidence | Roadmap and testing evidence |
| Significant architectural choice or reversal | A numbered decision record and its index |

Use `Proposed`, `Implemented`, and `Verified` consistently. `Implemented` means code/artifacts exist; `Verified` requires a command or reproducible check, result, environment and limitations. Acceptance of a proposal does not prove implementation. Do not upgrade all of a feature's status because one helper test passed.

For decisions, record context, choice, consequences and implementation status. Supersede previous records with a new numbered record instead of erasing their rationale. Keep a single authoritative description per concern and link to it rather than copying rules across documents.

## Before handing back work

- Run checks appropriate to the changed surface. Baseline commands: `npm test`, `npm run build`, and `node scripts/check-docs.mjs`.
- Browser-facing changes require the relevant browser scenarios from [testing](docs/TESTING.md); a build is not a playtest.
- Record failures and untested scope honestly. Do not broaden a preparation task into a gameplay fix without authorization.
- Update affected documentation and report documentation impact. If no documentation change is needed, give a brief reason.
- Do not replace immutable baseline evidence with current results. Capture a new baseline with a new filename when needed.
- No documentation-enforcement CI exists yet. The local link checker checks paths only, not truth, external links, or complete Markdown syntax. Human/AI review remains required.
