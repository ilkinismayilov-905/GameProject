# AGENTS.md

This file contains the permanent Codex instructions for Block Blast Lite. Every future task must read `AGENTS.md` and `TASKS.md` before making changes.

## Allowed Technologies

- HTML
- CSS
- Vanilla JavaScript
- DOM manipulation
- localStorage

## Forbidden Technologies

- React, Vue, Angular, Svelte
- jQuery
- Phaser, Pixi.js, Three.js
- Bootstrap, Tailwind, or any CSS framework
- npm runtime dependencies
- External JavaScript libraries
- Backend services
- Game engines
- Paid APIs

## Architecture Rules

- Use Object-Oriented Programming.
- Planned classes are `Game`, `Board`, `Piece`, and `StorageManager`.
- Use DOM elements instead of Canvas because the assignment focuses on DOM manipulation.
- Keep implementation simple, readable, and suitable for a university mini-project.

## Incremental Workflow

- Inspect repository state before each task.
- If the repository has no commits yet, initialize the project on `main` and create the first commit there.
- If `main` already contains an initial commit, create a new branch named for the current phase from the latest `main`.
- Do not implement future phases early.
- Keep each phase focused on the roadmap in `TASKS.md`.

## Mandatory Future Commit Messages

These exact commit messages must appear later in git history:

- `feat: player movement`
- `feat: collission implemented`
- `feat: add score/lose`
- `feat: start & game over screen`
- `feat: game restart`
- `feat: high score`

Keep the spelling `collission` exactly as written.

## Testing And Reporting

- Validate that expected files exist after each phase.
- Check that HTML, CSS, and JavaScript paths still resolve correctly.
- Run manual acceptance tests listed in `TASKS.md` for the current phase.
- Report what was changed, what was tested, and what was intentionally not implemented.

## README Requirements

`README.md` must eventually include:

- Game description
- Excalidraw sketch
- Entity list
- How to play
- Technical decisions
- `AI_DIARY.md` link
- GitHub Pages link
- Known bugs / future improvements

## AI Diary Honesty Rule

`AI_DIARY.md` must contain only real AI mistakes, real testing failures, or real fixes. Never fabricate diary entries.
