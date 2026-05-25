# Block Blast Lite Roadmap

## Phase 0: Initial setup

- Objective: Create the base project structure, static HTML entry point, CSS shell, JavaScript module placeholders, repository instructions, and roadmap.
- Likely files to change: `index.html`, `AGENTS.md`, `TASKS.md`, `README.md`, `AI_DIARY.md`, `css/styles.css`, `js/constants.js`, `js/pieces.js`, `js/board.js`, `js/game.js`, `js/storage.js`, `js/app.js`, `assets/`.
- Features that must not be implemented yet: board/grid, draggable pieces, scoring, collision, row or column clearing, start screen, game over screen, restart, localStorage behavior.
- Manual acceptance tests: Confirm expected files exist; confirm `index.html` links `css/styles.css`; confirm `index.html` loads `js/app.js` with `type="module"`; open the page and confirm the title and placeholder text appear.
- Required commit message: `chore: initialize vanilla js project`

## Phase 1: docs/planning

- Objective: Add initial planning details, sketch reference, entity list, and any real AI diary notes from actual work.
- Likely files to change: `README.md`, `AI_DIARY.md`, `assets/block-blast-sketch.png`, `TASKS.md`.
- Features that must not be implemented yet: board/grid, draggable pieces, scoring, collision, row or column clearing, start screen, game over screen, restart, localStorage behavior.
- Manual acceptance tests: Confirm README planning sections are present; confirm any AI diary entries describe only real issues or fixes; confirm sketch asset is referenced if available.
- Required commit message: `docs: add initial planning and ai diary`

## Phase 2: feat/player-movement

- Objective: Add the first interaction for selecting or moving planned pieces using DOM elements.
- Likely files to change: `js/app.js`, `js/game.js`, `js/pieces.js`, `css/styles.css`, `index.html`.
- Features that must not be implemented yet: collision validation, scoring, row or column clearing, lose detection, start screen, game over screen, restart, high score.
- Manual acceptance tests: Confirm a piece can be interacted with according to the phase design; confirm no score or collision behavior is active; confirm page still loads without console errors.
- Required commit message: `feat: player movement`

## Phase 3: feat/collision-interaction

- Objective: Add placement and fit validation so pieces cannot occupy invalid cells.
- Likely files to change: `js/game.js`, `js/board.js`, `js/pieces.js`, `js/constants.js`, `css/styles.css`.
- Features that must not be implemented yet: scoring, row or column clearing rewards, lose detection, start screen, game over screen, restart, high score.
- Manual acceptance tests: Confirm valid placement works; confirm invalid placement is rejected; confirm occupied cells cannot be reused; confirm no scoring or game-over behavior is active.
- Required commit message: `feat: collission implemented`

## Phase 4: feat/score-lose

- Objective: Add row and column clearing, score updates, and lose detection when no available piece fits.
- Likely files to change: `js/game.js`, `js/board.js`, `js/constants.js`, `css/styles.css`, `index.html`.
- Features that must not be implemented yet: start screen, game over screen, restart flow, high score persistence.
- Manual acceptance tests: Confirm completed rows clear; confirm completed columns clear; confirm score changes after clearing; confirm lose condition can be reached; confirm restart and high score are not implemented.
- Required commit message: `feat: add score/lose`

## Phase 5: feat/screens

- Objective: Add start and game over screens using DOM elements.
- Likely files to change: `index.html`, `css/styles.css`, `js/game.js`, `js/app.js`.
- Features that must not be implemented yet: restart behavior, high score persistence.
- Manual acceptance tests: Confirm start screen appears before play; confirm game over screen appears when losing; confirm controls do not refresh the browser; confirm high score is not implemented.
- Required commit message: `feat: start & game over screen`

## Phase 6: feat/restart

- Objective: Add restart behavior that resets the game without refreshing the browser.
- Likely files to change: `js/game.js`, `js/board.js`, `js/app.js`, `css/styles.css`.
- Features that must not be implemented yet: high score persistence.
- Manual acceptance tests: Confirm restart clears board state; confirm score resets; confirm current screen flow remains usable; confirm no high score is stored.
- Required commit message: `feat: game restart`

## Phase 7: feat/high-score

- Objective: Add high score persistence with localStorage through `StorageManager`.
- Likely files to change: `js/storage.js`, `js/game.js`, `js/app.js`, `index.html`, `css/styles.css`.
- Features that must not be implemented yet: final documentation and deployment link.
- Manual acceptance tests: Confirm high score saves after a better score; confirm high score survives browser refresh; confirm storage access is isolated to `StorageManager`.
- Required commit message: `feat: high score`

## Phase 8: docs/final-documentation

- Objective: Complete final README documentation and update AI diary only with real mistakes, failures, or fixes encountered.
- Likely files to change: `README.md`, `AI_DIARY.md`, `TASKS.md`.
- Features that must not be implemented yet: GitHub Pages deployment link unless deployment has happened.
- Manual acceptance tests: Confirm README includes all required sections; confirm AI diary has no invented entries; confirm instructions and gameplay description match the current implementation.
- Required commit message: `docs: complete readme and ai diary`

## Phase 9: deploy/github-pages

- Objective: Deploy the finished static project to GitHub Pages and document the live link.
- Likely files to change: `README.md`.
- Features that must not be implemented yet: new gameplay features outside the planned scope.
- Manual acceptance tests: Confirm GitHub Pages URL loads; confirm CSS and JavaScript load on the deployed page; confirm README contains the deployment link.
- Required commit message: `docs: add github pages deployment link`
