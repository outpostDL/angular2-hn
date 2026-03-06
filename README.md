# Hacker News — React + TypeScript + Vite

A progressive Hacker News client, rebuilt with React, TypeScript, and Vite.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the app at [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
```

Creates a production build in the `dist/` directory.

### Testing

#### Unit Tests (Vitest)

```bash
npm test
```

Runs unit tests with Vitest and Testing Library.

#### End-to-End Tests (Playwright)

```bash
npx playwright install --with-deps chromium
npx playwright test
```

Runs e2e tests with Playwright. The dev server starts automatically.

## Project Structure

```
src/
  components/   # Reusable UI components
  pages/        # Route-level page components
  hooks/        # Custom React hooks
  services/     # API and data services
  types/        # TypeScript type definitions
  styles/       # Global SCSS styles
  assets/       # Static assets (icons, images)
  App.tsx       # Root application component
  main.tsx      # Application entry point
```

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** SCSS
- **Unit Testing:** Vitest + Testing Library
- **E2E Testing:** Playwright

## License

[MIT](LICENSE.md)
