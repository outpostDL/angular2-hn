# Hacker News — React Migration

A Progressive Web Application clone of Hacker News, migrated from Angular to React.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** SCSS
- **Routing:** React Router v6
- **Unit Testing:** Vitest + React Testing Library
- **E2E Testing:** Playwright

## Getting Started

### Prerequisites

- Node.js 20 (see `.nvmrc`)

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server at [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
```

Builds the app for production into the `dist/` directory.

### Testing

#### Unit Tests

```bash
npm test            # Run tests once
npm run test:watch  # Run tests in watch mode
```

#### E2E Tests (Playwright)

```bash
npx playwright test
```

By default, Playwright targets `http://localhost:5173` (Vite dev server). To run against the Angular app instead:

```bash
BASE_URL=http://localhost:4200 npx playwright test
```

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
```

## Migration Status

This app is being migrated from Angular to React. The baseline Playwright e2e tests in `e2e/playwright/` define the parity contract — the migration is complete when all baseline tests pass against the React app.
