# Leptos HN (Rust rewrite scaffold)

Client-side WASM rewrite of the Angular Hacker News PWA using [Leptos](https://leptos.dev) 0.8 (CSR),
built with [Trunk](https://trunkrs.dev). Talks to the same API: `https://node-hnapi.herokuapp.com`.

See `../RUST_REWRITE_PLAN.md` for the investigation, Angular→Leptos mapping and remaining work.

## Prerequisites

```sh
rustup target add wasm32-unknown-unknown
cargo install trunk --locked
```

Trunk downloads `wasm-bindgen` and `dart-sass` on first build (network required).

## Run

```sh
cd rust-app
trunk serve          # http://127.0.0.1:8080 with SPA fallback + hot reload
```

## Build

```sh
trunk build --release   # output in rust-app/dist/
cargo check --target wasm32-unknown-unknown
cargo fmt && cargo clippy --target wasm32-unknown-unknown
```

## Layout

```
src/main.rs            mounts <App/>, provides meta + settings context
src/routes.rs          leptos_router config (mirrors app.routes.ts)
src/api.rs             fetch_feed / fetch_item (poll fan-out) / fetch_user
src/models.rs          Story, Comment, User, PollResult, FeedType, comment_label()
src/settings.rs        SettingsStore (RwSignal) backed by gloo-storage LocalStorage
src/components/        feed, item (row), item_details (+ recursive CommentView),
                       user, header, footer, settings_panel, loader, error_message
styles/                SCSS ported from the Angular app (themes: default/night/amoledblack)
assets/                logo.svg, cog.svg
```
