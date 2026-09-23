# Rust Rewrite Plan: angular2-hn → Leptos (client-side WASM)

Target stack: **Leptos 0.8 (CSR)** + **leptos_router** + **leptos_meta**, built with **Trunk**,
HTTP via **gloo-net**, persistence via **gloo-storage**. Same API base URL:
`https://node-hnapi.herokuapp.com`. The scaffold lives in [`rust-app/`](rust-app/).

---

## 1. Investigation: feature surface of the Angular app

### 1.1 API layer — `src/app/shared/services/hackernews-api.service.ts`

| Method | Request | Notes |
|---|---|---|
| `fetchFeed(feedType, page)` | `GET /{feedType}?page={n}` | Returns `Story[]` (30 per page). |
| `fetchItemContent(id)` | `GET /item/{id}` | Returns a `Story` with nested `comments`. **Poll special case:** if `story.type === 'poll'`, for `i in 1..=poll.length` it fires `fetchPollContent(story.id + i)`, writes the result into `story.poll[i-1]`, and accumulates `story.poll_votes_count += points`. These are fire-and-forget subscriptions that mutate the already-returned object (Angular re-renders via change detection). |
| `fetchPollContent(id)` | `GET /item/{id}` | Returns `PollResult` (`points`, `content`). |
| `fetchUser(id)` | `GET /user/{id}` | Returns `User`. |

`lazyFetch` wraps `unfetch` in an `Observable` with a cancel token (unsubscribe → ignore result).
Errors are surfaced as observable errors → component sets `errorMessage`.

Live API observations (2026‑09‑23): feed items have `type: "link"` (not `"story"`), `domain` may be
absent, and `GET /user/{id}` returned `Cannot GET /user/...` HTML (404) for a sampled user — the user
endpoint appears unreliable/unsupported on the current host.

### 1.2 Routing — `src/app/app.routes.ts`

| Path | Component | Data |
|---|---|---|
| `''` | redirect → `news/1` (`pathMatch: 'full'`) | |
| `news/:page` | `FeedComponent` | `feedType: 'news'` |
| `newest/:page` | `FeedComponent` | `feedType: 'newest'` |
| `show/:page` | `FeedComponent` | `feedType: 'show'` |
| `ask/:page` | `FeedComponent` | `feedType: 'ask'` |
| `jobs/:page` | `FeedComponent` | `feedType: 'jobs'` |
| `item/:id` | `ItemDetailsComponent` (lazy `ItemDetailsModule`) | |
| `user/:id` | `UserComponent` (lazy `UserModule`) | |

### 1.3 Data models — `src/app/shared/models/*`

**`story.ts` – `Story`**

| Field | TS type | Notes |
|---|---|---|
| `id` | `number` | |
| `title` | `string` | |
| `points` | `number` | `null` for jobs |
| `user` | `string` | `null` for jobs |
| `time` | `number` | unix seconds |
| `time_ago` | `number` (declared) | actually a string like `"2 hours ago"` |
| `type` | `FeedType` | `'poll' \| 'story' \| 'job'`; API also emits `link`, `ask` |
| `url` | `string` | external URL or `item?id=…` for self posts |
| `domain` | `string` | optional |
| `comments` | `Comment[]` | only on `/item/{id}` |
| `comments_count` | `number` | |
| `poll` | `PollResult[]` | only for polls |
| `poll_votes_count` | `number` | computed client-side |
| `deleted`, `dead` | `boolean` | |
| (`content`) | – | used by template (`item.content`) but not declared |

**`comment.ts` – `Comment`**: `id: number`, `level: number`, `user: string`, `time: number`,
`time_ago: string`, `content: string` (HTML), `deleted: boolean`, `comments: Comment[]` (recursive).

**`user.ts` – `User`**: `id: string`, `crated_time: number` (typo for `created_time`), `created: string`,
`karma: number`, `avg: number`, `about: string` (HTML).

**`poll-result.ts` – `PollResult`**: `points: number`, `content: string` (HTML).

**`settings.ts` – `Settings`**: `showSettings: boolean`, `openLinkInNewTab: boolean`, `theme: string`,
`titleFontSize: string`, `listSpacing: string`.

**`feed-type.type.ts`**: `type FeedType = 'poll' | 'story' | 'job'` (this is really the *item* type; the
feed category strings `news|newest|show|ask|jobs` are untyped).

### 1.4 Components / features

| Area | Component | Behaviour |
|---|---|---|
| `app.component` | `AppComponent` | Wraps everything in `<div class="{{settings.theme}}">` → `.body-cover` + `.wrapper` (header, `<router-outlet>`, footer). Sends GA pageviews on `NavigationEnd`. |
| `feeds/feed` | `FeedComponent` | Reads `feedType` from route data and `:page` from params (default 1); calls `fetchFeed`; shows `app-loader` while `items` undefined, `app-error-message` ("Could not load {feedType} stories.") on error. Renders `<ol start=listStart>` (`(page-1)*30+1`) of `<item>` rows; `.list-margin` unless jobs; jobs banner text; nav: `‹ Prev` when `listStart !== 1`, `More ›` when 30 items. Scrolls to top after load. |
| `feeds/item` | `ItemComponent` | Row: title link (external `href` w/ optional `target=_blank rel=noopener` when setting on, or `routerLink /item/:id` when `url` doesn't start with `http`), `(domain)`, points ★ / "N points by user", `time_ago`, `comments_count \| comment` link. Two layouts: `.subtext-palm` (mobile) and `.subtext-laptop`. Inline styles from settings: `margin-bottom: listSpacing px`, title `font-size: titleFontSize px`. Jobs hide points/user/comments. |
| `item-details` | `ItemDetailsComponent` | `:id` param → `fetchItemContent`; loader / error ("Could not load item comments."); mobile header with back button (`Location.back()`), laptop header (`.item-header` if comments>0 or job; `.head-margin` if text), poll results (`pollBar` width = `points/poll_votes_count*100%`), `[innerHTML]` story content, `<ul class="comment-list">` of `app-comment`. Scrolls to top on init. |
| `item-details/comment` | `CommentComponent` | Recursive. Deleted → `[deleted] \| Comment Deleted`. Otherwise `.meta` with `[-]/[+]` collapse toggle, user link, `time_ago`; `[innerHTML]` content; `<ul class="subtree">` of children; `[hidden]` when collapsed. |
| `user` | `UserComponent` | `:id` → `fetchUser`; loader / error ("Could not load user {id}."); profile: id, `karma ★`, `Created {created}`, `[innerHTML] about`. Back button. |
| `core/header` | `HeaderComponent` | Logo link `/news/1`, nav `new \| show \| ask \| jobs` (each `/x/1`, `scrollTop()` on click), cog icon toggles settings; renders `<app-settings>` when `showSettings`. |
| `core/footer` | `FooterComponent` | Static GitHub link. |
| `core/settings` | `SettingsComponent` | Overlay popup: checkbox "Open links in a new tab", radio themes `default / night / amoledblack`, number inputs for font size (min 1) and list spacing (min 0) (on `keyup`), × close. |
| `shared/components/loader` | `LoaderComponent` | CSS "Loading..." animation. |
| `shared/components/error-message` | `ErrorMessageComponent` | CSS skull + `message` + offline hint. |
| `shared/pipes/comment.pipe` | `CommentPipe` | `0 → "discuss"`, `1 → "1 comment"`, `n → "n comments"`. |

### 1.5 Settings / state — `src/app/shared/services/settings.service.ts`

- Singleton (`providedIn: 'root'`), plain mutable `settings` object shared by reference.
- `localStorage` keys: `openLinkInNewTab` (JSON bool), `theme` (string), `titleFontSize` (string, default `"16"`),
  `listSpacing` (string, default `"0"`). `showSettings` is not persisted.
- Theme init: saved `theme` wins; otherwise derived from `matchMedia('(prefers-color-scheme: dark)')`
  → `night` / `default`. A `change` listener on the media query keeps calling `setTheme` (which
  *persists* the theme — so after the first OS change the user is effectively "opted in").
- Theme is applied purely by putting the theme name as a CSS class on the root `div`; `_themes.scss`
  defines `.default`, `.night`, `.amoledblack` via a `theme()` mixin.

### 1.6 PWA

- `app.module.ts` registers `ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })`.
- `src/manifest.json` + icons in `src/assets/icons`; `index.html` has theme-color / apple meta tags, an
  `app-loader` splash (`app-root:empty + .app-loader`), GA snippet, and a skip link.
- README "Build process": ejected webpack, `npm start` / `npm build`, `npm run precache` (Workbox) +
  `npm run static-serve` to test the SW. Themes listed: Default, Night, Black (AMOLED).

### 1.7 Styling

Per-component SCSS with Angular view encapsulation, all importing `_media.scss` (breakpoints:
mobile ≤768px, laptop ≥769px, tablet ≤1024px) and `_theme_variables.scss`. Two `:host >>>` piercing
rules (comment HTML, user `pre`). Global `styles.scss` imports `_themes.scss` and defines the splash
loader.

---

## 2. Angular → Leptos mapping

| Angular concept | Leptos equivalent | Where in `rust-app/` |
|---|---|---|
| `@Component` class + template | `#[component] fn Name(props) -> impl IntoView` with `view!` macro | `src/components/*.rs` |
| `@NgModule` / lazy `loadChildren` | Rust modules; no lazy loading (single WASM bundle; see risks) | `src/components/mod.rs` |
| `@Injectable` service + DI | `provide_context` / `expect_context` of a `Copy` struct wrapping `RwSignal<Settings>` | `src/settings.rs` (`SettingsStore`) |
| `HackerNewsAPIService` | Free `async fn`s returning `Result<T, ApiError>` using `gloo_net::http::Request` | `src/api.rs` |
| `Observable` + `subscribe` + cancel token | `LocalResource::new(move \|\| fetch(...))` keyed on route signals; `Suspense` + `Suspend` for loading/error branches; re-runs (and drops stale futures) when inputs change | `feed.rs`, `item_details.rs`, `user.rs` |
| `RouterModule.forRoot(routes)` | `<Router><Routes fallback=…><Route path=path!("/news/:page") view=…/></Routes></Router>` | `src/routes.rs` |
| `redirectTo: 'news/1'` | `<Route path=path!("/") view=\|\| view!{ <Redirect path="/news/1"/> }/>` | `src/routes.rs` |
| `route.data.feedType` | Component prop `feed_type: FeedType` set per route | `routes.rs` → `Feed` |
| `ActivatedRoute.params` | `use_params_map()` + `Memo` | `feed.rs`, `item_details.rs`, `user.rs` |
| `[routerLink]` / `routerLinkActive` | `<A href=…>` (adds `aria-current` on active) | all components |
| `Location.back()` | `web_sys::window().history().back()` | `item_details.rs`, `user.rs` |
| `*ngIf` | `<Show when=…>` for reactive conditions; `bool.then(\|\| view!{…})` for static ones | throughout |
| `*ngFor` | `iter().map(\|x\| view!{…}).collect_view()` (or `<For>` for keyed reactive lists) | `feed.rs`, `item_details.rs` |
| `[innerHTML]` | `inner_html=…` attribute | `item_details.rs`, `user.rs` |
| `[ngStyle]` / `[class.x]` | `style=move \|\| …` / `class:x=…` | `item.rs`, `item_details.rs` |
| `(click)` / `(change)` / `(keyup)` | `on:click` / `on:change` / `on:input` + `event_target_value` | `header.rs`, `settings_panel.rs` |
| `@Input()` | Component function parameter | `Item(item: Story)`, `CommentView(comment: Comment)` |
| Recursive `app-comment` | Recursive `#[component] fn CommentView` returning `AnyView` (via `.into_any()`) to break the infinite type | `item_details.rs` |
| Pipe `comment` | Plain fn `comment_label(u32) -> String` | `src/models.rs` |
| `localStorage` | `gloo_storage::LocalStorage::{get,set}` (same keys) | `src/settings.rs` |
| `window.matchMedia(...)` listener | `web_sys::Window::match_media` + `wasm_bindgen::Closure` listener | `src/settings.rs` |
| TS classes/interfaces | `#[derive(Deserialize, Clone, Debug, Default)]` structs, `#[serde(rename = "type")]`, `#[serde(default)]`, `#[serde(other)]` for unknown enum variants | `src/models.rs` |
| `<title>` / meta | `leptos_meta::{provide_meta_context, Title}` | `src/main.rs` |
| `ServiceWorkerModule` | Not available from Leptos; hand-written `sw.js` copied by Trunk (`data-trunk rel="copy-file"`) + `navigator.serviceWorker.register` via `web_sys` | TODO |
| Angular CLI / webpack | Trunk (`Trunk.toml`, `index.html` with `data-trunk` links; SCSS compiled by Trunk's bundled dart-sass) | `Trunk.toml`, `index.html`, `styles/` |
| Component SCSS encapsulation | One global stylesheet (`styles/main.scss`) aggregating the component files; `:host >>>` rewritten to real ancestor selectors | `styles/main.scss` |

### 2.1 Crates

| Crate | Version | Purpose |
|---|---|---|
| `leptos` (features `csr`) | 0.8 | Reactive UI framework |
| `leptos_router` | 0.8 | Client-side routing (`Router`, `Routes`, `Route`, `A`, `Redirect`, `use_params_map`) |
| `leptos_meta` | 0.8 | `<Title>` / head management |
| `gloo-net` (features `http`, `json`) | 0.6 | `fetch` wrapper + JSON decode |
| `gloo-storage` | 0.3 | Typed `localStorage` access |
| `serde`, `serde_json` | 1 | Model (de)serialization |
| `wasm-bindgen`, `wasm-bindgen-futures` | 0.2 / 0.4 | JS interop, spawning futures |
| `web-sys` (features `Window`, `MediaQueryList`, `MediaQueryListEvent`, `History`, `Location`) | 0.3 | `window.scrollTo`, `matchMedia`, `history.back()` |
| `futures` | 0.3 | `join_all` for the poll fan-out |
| `console_error_panic_hook` | 0.1 | Readable panics in devtools |

Build tools: `rustup target add wasm32-unknown-unknown`, `cargo install trunk --locked` (Trunk 0.21
downloads `wasm-bindgen` CLI and `dart-sass` on demand).

---

## 3. Gaps & risks

1. **Poll fan-out semantics.** Angular mutates the story after render as each option arrives. The Rust
   port awaits all `N` option requests concurrently (`join_all`) and returns a complete `Story`; a failed
   option fetch keeps the parent's `poll[]` entry (`item`/`points`), and `poll_votes_count` is summed over
   the final slots so bars stay consistent. Slightly later first paint for polls, but deterministic and no shared
   mutable state. Polls are rare on the front page so this path is essentially untested against live data.
2. **Nested comment recursion.** A recursive `#[component]` must return `AnyView` (`.into_any()`) to
   avoid an infinitely-sized `impl IntoView` type. Deep threads (300+ comments) render fine in the
   scaffold, but each comment creates its own `RwSignal` for collapse; virtualisation may be worth
   considering later.
3. **Service worker / offline.** Leptos has no SW integration. Options: (a) hand-written `sw.js`
   (cache-first for `/`, hashed `*.wasm/*.js/*.css`, network-first for the API) registered from Rust via
   `web_sys::Navigator::service_worker()`, copied with `<link data-trunk rel="copy-file" href="sw.js">`;
   (b) Workbox CLI in a post-build step like the Angular repo's `npm run precache`. Hashed Trunk output
   names change every build, so the precache manifest must be generated post-build. `manifest.json` and
   icons still need to be copied into `rust-app/assets`.
4. **Bundle size / lazy loading.** Angular lazy-loads `item` and `user`. Trunk produces one WASM bundle
   (~17 MB debug, expect ~1–2 MB release before `wasm-opt`, ~600–900 KB after `-Oz` + gzip/brotli).
   No code-splitting in Leptos CSR; mitigate with `opt-level="z"`, `lto`, `wasm-opt`, and server compression.
5. **`innerHTML` of untrusted API HTML.** Same XSS surface as the Angular app (which used `[innerHTML]`
   without a sanitizer for comments/polls). Consider `ammonia` (pure Rust sanitizer) if hardening is wanted.
6. **`/user/:id` endpoint reliability.** The live host returned 404 HTML for a sampled user; the port shows
   the error component. Consider falling back to `https://hacker-news.firebaseio.com/v0/user/{id}.json`.
7. **`prefers-color-scheme` listener persists theme.** Reproduced faithfully (the listener calls
   `set_theme` which writes `localStorage`), but arguably a bug in the original: after one OS toggle the
   app stops following the OS. Decide whether to keep.
8. **Type mismatches in the TS models.** `time_ago` is declared `number` but is a string; `type` includes
   `link`/`ask` at runtime; `user`/`points` are `null` for jobs; `User.crated_time` typo. Rust models use
   `Option<_>`, `#[serde(default)]`, `#[serde(other)]` and an `alias` to be lenient.
9. **Styling.** Angular's emulated view encapsulation is gone; all component SCSS is concatenated into one
   global file. Selectors are mostly class-scoped so no collisions were observed, but generic rules
   (`p`, `a`, `ul`, `h1`) from different components now apply globally. Deprecated `$a / $b` division was
   rewritten to `math.div`.
10. **Analytics / `<base href>` / skip-link / noscript splash** from `index.html` were not ported.
11. **`routerLinkActive="active"`.** `leptos_router::A` sets `aria-current="page"` instead of an `active`
    class; no CSS depended on `.active` so nothing was ported.
12. **Toolchain risk.** Leptos 0.9 is in beta; 0.8 was pinned. `proc-macro-error2` emits a
    future-incompat warning via a transitive dependency.

---

## 4. Status / follow-up checklist

Verified in this session (`trunk serve`, Chromium against live API):
`/` → `/news/1`, 30 rows rendered, `More ›` → `/news/2` (`start=31`), settings popup switches theme
to `night` and persists to `localStorage`, `/item/:id` renders story header + 310 nested comments,
no console errors. `cargo check --target wasm32-unknown-unknown` and `trunk build` succeed.

- [x] Cargo/Trunk project, `index.html`, SCSS themes (default / night / amoledblack)
- [x] Models (`Story`, `Comment`, `User`, `PollResult`, `FeedType`, `comment_label`)
- [x] API (`fetch_feed`, `fetch_item` with poll fan-out, `fetch_user`)
- [x] Router (feed routes, `item/:id`, `user/:id`, redirect)
- [x] Feed list + item row (title font size, list spacing, open-in-new-tab)
- [x] Header / footer / settings panel (theme, new-tab, font size, spacing, persisted)
- [x] Settings context backed by `gloo-storage`, `prefers-color-scheme` auto dark
- [x] Item details with poll bars and recursive, collapsible comment tree (first pass)
- [x] User page (first pass; blocked on API returning 404 for `/user/:id`)
- [ ] Verify poll rendering against a real poll item (e.g. find one via `/ask`)
- [ ] Verify user page once a working user endpoint is chosen (or add Firebase fallback)
- [ ] Mobile layout QA (`.subtext-palm`, fixed header, back buttons) — only desktop was checked
- [ ] PWA: `manifest.json` + icons into `assets/`, `sw.js` (or Workbox post-build), SW registration
- [ ] Splash/`noscript` loader and `<meta>` tags from the Angular `index.html`
- [ ] Release-size tuning (`trunk build --release`, `wasm-opt`, measure)
- [ ] Optional: sanitize API HTML with `ammonia`
- [ ] Optional: `<For>` keyed rendering for feed rows; scroll restoration on back navigation
- [ ] Tests: unit tests for `comment_label`, model deserialization fixtures (`serde_json`), poll summing;
      port Playwright e2e in `e2e/playwright` to target `http://127.0.0.1:8080`
- [ ] CI: add a `wasm32` `cargo check` / `trunk build` job; hosting (Firebase rewrites to `index.html`)
