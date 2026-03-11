# Hacker News — React Migration

A Progressive Web Application clone of Hacker News, migrated from Angular to React.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** SCSS
- **Routing:** React Router v6
- **Unit Testing:** Vitest + React Testing Library
- **E2E Testing:** Playwright

## Local Development

### Prerequisites

- **Node.js 20** (see `.nvmrc`). If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` to switch to the correct version.
- **npm** (ships with Node.js)

### Install Dependencies

```bash
npm install
```

### Start the Dev Server

```bash
npm run dev
```

This starts the Vite dev server at [http://localhost:5173](http://localhost:5173).

> **Port conflicts:** Vite may fall back to port 5174 (or higher) if 5173 is already in use. Check the terminal output for the actual URL.

### Run Unit Tests

```bash
npm test              # Run tests once (vitest run)
npm run test:watch    # Run tests in watch mode
```

Unit tests use [Vitest](https://vitest.dev/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and jsdom.

### Production Build

```bash
npm run build
```

Compiles TypeScript and builds the app for production into the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

This serves the `dist/` folder via Vite's built-in preview server.

### Run E2E Tests (Playwright)

#### 1. Install Playwright Browsers (first time only)

```bash
npx playwright install
```

This downloads the browser binaries Playwright needs (Chromium by default). You only need to do this once per machine or when upgrading Playwright.

#### 2. Run the E2E Test Suite

```bash
npm run test:e2e
```

Or equivalently:

```bash
npx playwright test
```

Playwright is configured (via `webServer` in `playwright.config.ts`) to **automatically start the Vite dev server** before running tests, so you do not need to start it manually.

By default, tests run against `http://localhost:5173`.

#### 3. Test Against a Different Host or Port

If you want to test against a dev server already running on a different port, or a different host entirely, set the `BASE_URL` environment variable:

```bash
BASE_URL=http://localhost:5174 npx playwright test
```

#### 4. View Playwright HTML Reports

After a test run, Playwright generates an HTML report. To open it:

```bash
npx playwright show-report
```

This opens the report in your default browser. Reports are saved to `playwright-report/` by default.

## npm Scripts Reference

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `vite` | Start the Vite dev server |
| `npm run build` | `tsc -b && vite build` | Type-check and build for production |
| `npm run preview` | `vite preview` | Preview the production build locally |
| `npm test` | `vitest run` | Run unit tests once |
| `npm run test:watch` | `vitest` | Run unit tests in watch mode |
| `npm run test:e2e` | `playwright test` | Run Playwright E2E tests |

## Project Structure

```
src/
  components/    # Reusable UI components
  pages/         # Route-level page components
  hooks/         # Custom React hooks
  services/      # API and data services
  types/         # TypeScript type definitions
  styles/        # Global and shared SCSS styles
  App.tsx        # Root component with routing
  main.tsx       # Application entry point
e2e/
  playwright/    # Playwright e2e test specs
playwright.config.ts
vite.config.ts
tsconfig.json
```

## Configuration Files

| File | Purpose |
|---|---|
| `vite.config.ts` | Vite build config, React plugin, SCSS options, Vitest settings |
| `tsconfig.json` | TypeScript compiler options (ES2020, React JSX, strict mode) |
| `playwright.config.ts` | E2E test config: baseURL, browsers, workers, webServer |
| `package.json` | Dependencies, npm scripts, Prettier config |
| `.nvmrc` | Node.js version (20) |

## Migration Status

This app is being migrated from Angular to React. The baseline Playwright e2e tests in `e2e/playwright/` define the parity contract — the migration is complete when all baseline tests pass against the React app.
