# Contributing

Thank you for your interest in contributing! Please feel free to put up a PR for any issue or feature request.

## Setup

1. Fork the repo and clone your fork
2. Make a branch for your feature or bug fix off `master`
3. Use Node 20 (`nvm use` reads `.nvmrc`)
4. `npm install`
5. `npm run dev` and open `localhost:5173` in a browser
6. Work your magic
7. Before opening a PR, make sure these pass:
  * `npm run build` (type-check + production build)
  * `npm test` (Vitest unit tests)
  * `npm run test:e2e` (Playwright; start `npm run dev` first)
8. Commit your changes and reference the issue you're addressing (for example: `git commit -am 'Commit message. Closes #5'`)
9. Push your branch and open a pull request to `master`

## Continuous integration

Every pull request (against any base branch) and every push to `master` runs the [CI workflow](.github/workflows/ci.yml) on GitHub Actions. It runs four jobs: typecheck (`npx tsc -b`), unit tests (`npm test`), build (`npm run build`) and Playwright e2e (Chromium against `npm run dev`). All jobs must be green before a PR is merged. If e2e fails, download the `playwright-report` artifact from the run for the HTML report. The e2e suite hits the live Hacker News API, so an occasional timeout from that API can fail the job; re-run it before digging in.

If you experience a problem at any point, please don't hesitate to file an issue!
