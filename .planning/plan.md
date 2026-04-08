<!-- DELETE THIS FILE BEFORE MERGING THE FEATURE BRANCH -->
# Plan: Tetris Clone

## Overview
Add a fully playable Tetris clone as a new `/tetris` route in the angular2-hn React app. The game features classic Tetris gameplay with scoring, levels, next/hold piece previews, high scores persisted to localStorage, keyboard + mobile touch controls, and full theme integration with the existing app theme system.

## Decisions & Constraints
- **Pure React implementation** — no external game/canvas libraries. Render the board using CSS grid or HTML table for consistency with the app's DOM-based approach.
- **Follow existing codebase patterns**: page in `src/pages/TetrisPage/`, custom hooks in `src/hooks/`, types in `src/types/`, co-located SCSS, lazy-loaded route.
- **Theme-aware**: Tetris board and UI must respect the app's 3 themes (default, night, amoledblack) using the existing SCSS theme mixin system.
- **Responsive**: Playable on both desktop (keyboard) and mobile (touch controls).
- **localStorage for high scores**: Consistent with how the app already persists settings.
- **No sound effects**: Keep it lightweight — can be added later.
- **Branch strategy**: Sub-branches from `react-migration` (e.g., `react-migration--tetris-<slug>`), PRs target `react-migration`.

## Tasks

### Wave 1 (parallel)

#### Task: Tetris types and constants
- **Goal:** Define all TypeScript types and game constants needed for the Tetris engine.
- **Outputs:**
  - `src/types/tetris.ts` — types for `Tetromino`, `TetrominoType`, `BoardCell`, `GameBoard`, `GameState`, `GameStatus`, `Position`, `HighScore`
  - `src/constants/tetris.ts` — board dimensions (10x20), tetromino shapes and rotations (SRS), colors per piece, scoring table, level speed curve, initial game state
- **Validation:** TypeScript compiles with no errors. Types are importable from other modules. Constants cover all 7 standard tetrominoes (I, O, T, S, Z, J, L) with all 4 rotation states.
- **Status:** pending

#### Task: Core game engine hook (`useTetrisGame`)
- **Goal:** Implement all Tetris game logic as a custom React hook, decoupled from rendering.
- **Outputs:**
  - `src/hooks/useTetrisGame.ts` — custom hook exposing: `board`, `currentPiece`, `nextPiece`, `heldPiece`, `score`, `level`, `linesCleared`, `gameStatus` (idle/playing/paused/gameover), and actions: `startGame()`, `moveLeft()`, `moveRight()`, `moveDown()`, `hardDrop()`, `rotate()`, `holdPiece()`, `togglePause()`
  - Collision detection, line clearing, piece spawning, gravity (auto-drop on interval based on level), lock delay, wall kicks (SRS), game over detection
  - `src/__tests__/useTetrisGame.test.ts` — unit tests for: piece movement, rotation, collision detection, line clearing, scoring, level progression, game over, hold piece
- **Validation:** All unit tests pass. Hook can be called in a test harness and produces correct state transitions for all core mechanics.
- **Dependencies:** Tetris types and constants
- **Status:** pending

#### Task: Route, page shell, and nav link
- **Goal:** Add the `/tetris` route to the app with a lazy-loaded page component and a nav link in the header.
- **Outputs:**
  - `src/pages/TetrisPage/TetrisPage.tsx` — shell component (placeholder content like "Tetris — coming soon")
  - `src/pages/TetrisPage/TetrisPage.scss` — basic page layout styles
  - Updated `src/App.tsx` — lazy-loaded `<Route path="/tetris" element={<TetrisPage />} />`
  - Updated `src/components/Header/Header.tsx` — "tetris" nav link added after "jobs"
  - `src/__tests__/TetrisRoute.test.tsx` — route renders the TetrisPage component
- **Validation:** Navigating to `/tetris` renders the shell page. Header shows "tetris" nav link with active state styling. Existing routes still work. Unit test passes.
- **Status:** pending

### Wave 2 (blocked by Wave 1)

#### Task: Game board renderer (`TetrisBoard` component)
- **Goal:** Render the Tetris game grid showing placed blocks, the active falling piece, and a ghost piece preview.
- **Outputs:**
  - `src/components/TetrisBoard/TetrisBoard.tsx` — renders 10x20 grid using CSS grid, colors cells based on board state + active piece overlay + ghost piece (translucent)
  - `src/components/TetrisBoard/TetrisBoard.scss` — grid layout, cell sizing, piece colors, ghost piece styling, theme-aware colors
- **Validation:** Board renders at correct dimensions. Active piece is visible and distinct from placed blocks. Ghost piece shows where the piece will land. Respects all 3 app themes. Responsive sizing (smaller cells on mobile).
- **Dependencies:** Tetris types and constants, Core game engine hook
- **Status:** pending

#### Task: Side panels (score, next piece, hold piece, stats)
- **Goal:** Build the info panels displayed alongside the game board.
- **Outputs:**
  - `src/components/TetrisInfo/TetrisInfo.tsx` — displays score, level, lines cleared
  - `src/components/TetrisPreview/TetrisPreview.tsx` — renders a small grid showing the next piece and held piece
  - `src/components/TetrisInfo/TetrisInfo.scss` and `src/components/TetrisPreview/TetrisPreview.scss` — styled to match app theme
- **Validation:** Score, level, and lines update in real-time during gameplay. Next piece and hold piece display correctly for all 7 piece types. Theme-aware.
- **Dependencies:** Tetris types and constants, Core game engine hook
- **Status:** pending

#### Task: Keyboard and touch input handling
- **Goal:** Wire up keyboard controls for desktop and touch/swipe controls for mobile.
- **Outputs:**
  - `src/hooks/useTetrisControls.ts` — keyboard event listeners (Arrow keys for move/soft-drop, Up/X for rotate, Space for hard drop, C for hold, P/Esc for pause) + touch gesture detection (swipe left/right/down for move, tap for rotate, swipe up for hard drop)
  - Controls only active when game is playing (not paused/gameover/idle)
  - `src/__tests__/useTetrisControls.test.ts` — unit tests for key mappings and control state management
- **Validation:** All keyboard controls work. Touch controls work on mobile viewport. Controls are disabled when game is paused or over. No conflicts with existing app keyboard behavior.
- **Dependencies:** Core game engine hook
- **Status:** pending

### Wave 3 (blocked by Wave 2)

#### Task: Assemble TetrisPage with full gameplay
- **Goal:** Wire all components together into the full playable TetrisPage.
- **Outputs:**
  - Updated `src/pages/TetrisPage/TetrisPage.tsx` — integrates `useTetrisGame`, `useTetrisControls`, `TetrisBoard`, `TetrisInfo`, `TetrisPreview`. Includes start/restart button, pause overlay, game over overlay with final score.
  - Updated `src/pages/TetrisPage/TetrisPage.scss` — full page layout (board centered, panels on sides), responsive layout (panels below board on mobile), overlay styling
- **Validation:** Full game is playable from start to game over. Pause/resume works. Game over shows final score and restart option. Layout works on desktop and mobile viewports.
- **Dependencies:** Game board renderer, Side panels, Keyboard and touch input handling
- **Status:** pending

#### Task: High scores system
- **Goal:** Persist and display a leaderboard of top scores using localStorage.
- **Outputs:**
  - `src/hooks/useTetrisHighScores.ts` — read/write top 10 high scores from localStorage, check if score qualifies, add new score with player initials
  - `src/components/TetrisHighScores/TetrisHighScores.tsx` — leaderboard table (rank, initials, score, level, lines, date)
  - `src/components/TetrisHighScores/TetrisHighScores.scss` — styled table, theme-aware
  - Updated TetrisPage — show high scores on idle/game-over state, prompt for initials on new high score
  - `src/__tests__/useTetrisHighScores.test.ts` — unit tests for localStorage read/write, top-10 sorting, qualification check
- **Validation:** High scores persist across page reloads. Top 10 sorted correctly. New high score triggers initials entry. Leaderboard displays on game idle and game over screens.
- **Dependencies:** Assemble TetrisPage with full gameplay
- **Status:** pending

### Wave 4 (blocked by Wave 3)

#### Task: Visual polish and animations
- **Goal:** Add animations and visual polish to make the game feel polished.
- **Outputs:**
  - Line clear animation (flash/dissolve effect)
  - Piece lock animation (brief flash when piece locks)
  - Game over animation (board fills up or gray-out)
  - Smooth piece movement (CSS transitions)
  - Start screen with controls reference
  - Updated SCSS files with animation keyframes
- **Validation:** Animations are smooth and don't block gameplay. All animations respect reduced-motion preference (`prefers-reduced-motion`). Theme-aware.
- **Dependencies:** Assemble TetrisPage with full gameplay, High scores system
- **Status:** pending

#### Task: E2E and integration tests
- **Goal:** Add Playwright E2E tests and additional unit/integration tests for full coverage.
- **Outputs:**
  - `e2e/playwright/tetris.spec.ts` — E2E tests: page loads, game starts on button click, pieces fall, keyboard controls work, pause/resume, game over triggers, high scores display, responsive layout, theme switching during game
  - Additional unit tests for any untested components
  - Screenshot baselines for visual regression
- **Validation:** All E2E tests pass. Unit test coverage for Tetris-related code is above 80%. No regressions in existing app tests.
- **Dependencies:** High scores system, Visual polish and animations
- **Status:** pending

## Execution Log
_Updated during implementation as tasks are completed._
