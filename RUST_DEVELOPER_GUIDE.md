# Angular 2 HN for Rust Developers

This guide explains how this codebase works by mapping Angular/TypeScript concepts
onto concepts you already know from Rust. Every file path and snippet below refers to
real code in this repository.

## 1. Overview

This app is a [Hacker News](https://news.ycombinator.com) client built as a
Progressive Web App (PWA) with [Angular](https://angular.io) and written in
TypeScript.

TypeScript is JavaScript plus a compile-time type system. The important caveat for a
Rust developer: **types are erased at compile time**. The compiler checks your code,
then emits plain JavaScript with no type information. There is no runtime enforcement,
so a value that arrives from the network as JSON is trusted to match its declared type
without any validation — nothing like `serde`'s deserialization errors happens
automatically.

## 2. Mental model

Angular UIs are built from two main building blocks:

- **Components** — reusable UI widgets. Think of a component as a `struct` (state +
  methods) paired with an HTML *template* that renders that state.
- **Services** — shared singletons that hold logic or data (HTTP access, settings),
  roughly what you might put in an `Arc<AppState>` and pass around.

Components receive services via **constructor dependency injection (DI)**. Declaring a
constructor parameter is analogous to taking a `&Service`, except the runtime
*injector* constructs and passes the instance for you. From
`src/app/feeds/feed/feed.component.ts`:

```ts
constructor(
  private _hackerNewsAPIService: HackerNewsAPIService,
  private route: ActivatedRoute
) { }
```

`private` on a constructor parameter is TypeScript shorthand that also declares a field
of the same name, so `this._hackerNewsAPIService` is available in every method.

## 3. Startup flow (like `fn main()`)

`src/main.ts` is the entry point:

```ts
if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
```

It bootstraps `AppModule` (`src/app/app.module.ts`), which is the root "crate
manifest". An `@NgModule` declares which components belong to it, which other modules
it imports, and which services (`providers`) the injector can construct:

```ts
@NgModule({
    declarations: [AppComponent, FeedComponent, ItemComponent],
    imports: [
        BrowserModule,
        routing,
        CoreModule,
        SharedComponentsModule,
        PipesModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
        }),
    ],
    providers: [HackerNewsAPIService, SettingsService],
    bootstrap: [AppComponent],
})
export class AppModule {}
```

`bootstrap: [AppComponent]` names the root component that gets mounted into
`index.html`.

## 4. Routing (URL → view)

`src/app/app.routes.ts` maps URL paths to components — effectively a `match` on the
URL:

```ts
const feedRoutes = [{
  path: ':page',
  component: FeedComponent
}];

const routes: Routes = [
  {path: '', redirectTo: 'news/1', pathMatch: 'full'},
  {
    path: 'news',
    children: feedRoutes,
    data: {feedType: 'news'}
  },
  // ... newest, show, ask, jobs follow the same shape
  {path: 'item', loadChildren: () => import('./item-details/item-details.module').then(m => m.ItemDetailsModule)},
  {path: 'user', loadChildren: () => import('./user/user.module').then(m => m.UserModule)}
];

export const routing = RouterModule.forRoot(routes);
```

Two things to note:

- **`data: {feedType: ...}`** attaches a static tag to the route. All five feed routes
  render the same `FeedComponent`; the component reads `feedType` at runtime to decide
  which feed to fetch. `:page` is a path parameter, like a captured segment in a
  pattern.
- **Lazy-loaded modules.** `loadChildren: () => import(...)` tells the bundler to emit
  the item-details and user modules as separate bundles that are downloaded only when
  the user first navigates there — comparable to an on-demand `dlopen` of a plugin, or
  a feature-gated crate that is compiled separately and linked in at runtime.

## 5. Data fetching

`src/app/shared/services/hackernews-api.service.ts` is the HTTP client. Its methods
return RxJS `Observable<T>` values:

```ts
fetchFeed(feedType: string, page: number): Observable<Story[]> {
  return lazyFetch(`${this.baseUrl}/${feedType}?page=${page}`);
}
```

An `Observable` is closest to a Rust `Stream` (or a lazy `Future` that can yield
multiple items). Like a Rust future, **nothing happens until it is polled** — here,
until someone calls `.subscribe()`. Creating the observable does not send a request.

The `lazyFetch` helper at the bottom of the file wraps the browser `fetch` API:

```ts
function lazyFetch<T>(url, options?) {
  return new Observable<T>(fetchObserver => {
    let cancelToken = false;
    fetch(url, options)
      .then(res => {
        if (!cancelToken) {
          return res.json()
            .then(data => {
              fetchObserver.next(data);
              fetchObserver.complete();
            });
        }
      }).catch(err => fetchObserver.error(err));
    return () => {
      cancelToken = true;
    };
  });
}
```

The closure returned at the end is the **teardown**. RxJS runs it when the subscription
is unsubscribed, which is the equivalent of `Drop` on a future: dropping the
subscription cancels delivery of the result. (The underlying HTTP request still
completes, but its result is discarded, much like dropping a `JoinHandle` without
aborting the task.)

Transforming results uses `.pipe(map(...))`, which is `stream.map(...)`:

```ts
fetchItemContent(id: number): Observable<Story> {
  return lazyFetch(`${this.baseUrl}/item/${id}`).pipe(map((story: Story) => {
    // ...
    return story;
  }));
}
```

## 6. Component consuming data

`FeedComponent` (`src/app/feeds/feed/feed.component.ts`) implements the `OnInit`
interface — a lifecycle trait with one method, `ngOnInit`, which Angular calls once
after the component is constructed and its inputs are set:

```ts
export class FeedComponent implements OnInit {
  typeSub: Subscription;
  pageSub: Subscription;
  items: Story[];
  feedType: string;
  pageNum: number;
  listStart: number;
  errorMessage = '';

  ngOnInit() {
    this.typeSub = this.route
      .data
      .subscribe(data => {
        this.feedType = (data as any).feedType;
      });

    this.pageSub = this.route.params.subscribe(params => {
      this.pageNum = params['page'] ? +params['page'] : 1;
      this._hackerNewsAPIService.fetchFeed(this.feedType, this.pageNum)
        .subscribe(
          items => this.items = items,
          error => this.errorMessage = 'Could not load ' + this.feedType + ' stories.',
          () => {
            this.listStart = ((this.pageNum - 1) * 30) + 1;
            window.scrollTo(0, 0);
          }
        );
    });
  }
}
```

Flow: subscribe to the route's `data` (the `feedType` tag) and `params` (the `:page`
segment); whenever the page changes, call `fetchFeed` and store the results on
`this.items`, which the template renders.

The three-argument `.subscribe(next, error, complete)` maps onto `Result`-style
handling:

| RxJS callback | Rust analogue |
|---------------|---------------|
| `next(items)` | the `Ok(items)` arm |
| `error(err)` | the `Err(err)` arm |
| `complete()` | code that runs after the stream ends successfully |

Note `(data as any).feedType` — `as any` opts out of type checking entirely, similar in
spirit to `unsafe { transmute }`: the compiler trusts you completely.

## 7. Data models

`src/app/shared/models/story.ts` defines the shape of API responses:

```ts
export class Story {
    id: number;
    title: string;
    points: number;
    user: string;
    time: number;
    time_ago: number;
    type: FeedType;
    url: string;
    domain: string;
    comments: Comment[];
    comments_count: number;
    poll: PollResult[];
    poll_votes_count: number;
    deleted: boolean;
    dead: boolean;
}
```

This is the equivalent of a `#[derive(Deserialize)] struct Story { ... }`. The
difference is that no deserialization actually happens: `res.json()` returns an untyped
object and TypeScript *asserts* it is a `Story`. If the API renames a field, the
compiler will not catch it and the field will simply be `undefined` at runtime.

`FeedType` (`src/app/shared/models/feed-type.type.ts`) is a string-literal union, the
TypeScript way to spell a fieldless enum:

```ts
export type FeedType = 'poll' | 'story' | 'job';
```

## 8. Shared state / settings

`src/app/shared/services/settings.service.ts` holds user preferences:

```ts
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  settings: Settings = {
    showSettings : false,
    openLinkInNewTab: localStorage.getItem("openLinkInNewTab") ? JSON.parse(localStorage.getItem("openLinkInNewTab")) : false,
    theme: 'default',
    titleFontSize: localStorage.getItem("titleFontSize") ? localStorage.getItem("titleFontSize") : '16',
    listSpacing: localStorage.getItem("listSpacing") ? localStorage.getItem("listSpacing") : '0',
  };

  darkColorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  // ...
}
```

`providedIn: 'root'` makes it an application-wide singleton, lazily constructed the
first time something injects it — like a `lazy_static!`/`OnceCell` global, but handed
to you through DI instead of accessed by name. Every component that injects
`SettingsService` gets the same instance, so mutating `settings.theme` in the settings
panel is immediately visible in `AppComponent`.

The service persists each setting to `localStorage` (a simple string key/value store
in the browser) and listens to the OS `prefers-color-scheme` media query to switch
between the `default` and `night` themes when the user has not chosen one explicitly.

## 9. Templates & reactivity

`src/app/app.component.html` is the root template:

```html
<div class="{{ settings.theme }}">
  <div class="body-cover"></div>
  <div class="wrapper">
    <app-header></app-header>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  </div>
</div>
```

- `{{ settings.theme }}` is **interpolation**: it reads the `settings` field from
  `AppComponent` (`src/app/app.component.ts`) and writes it into the DOM.
- `<router-outlet>` is the placeholder where the router inserts whichever component
  matched the current URL (Section 4).
- `<app-header>` and `<app-footer>` are child components, selected by the `selector`
  string in their `@Component` decorator.

Rendering is **reactive**, not immediate-mode. You do not call a `render()` function
in a loop; you mutate fields on the component and Angular's change detection re-checks
bindings after events, timers, and HTTP callbacks and patches only the DOM that
changed. When `FeedComponent` assigns `this.items = items`, the list re-renders
automatically.

## 10. PWA layer

`AppModule` registers a service worker:

```ts
ServiceWorkerModule.register('ngsw-worker.js', {
    enabled: environment.production,
}),
```

A service worker is a script the browser runs in the background, separate from the
page. `ngsw-worker.js` is generated by the Angular build from `ngsw-config.json` and
caches the app shell and assets so the app loads instantly and works offline. It is
enabled only in production builds; in development you get plain network requests.

## 11. Cheat sheet

| Rust | Angular / TypeScript here |
|------|---------------------------|
| `fn main()` | `src/main.ts` |
| Crate / module tree, `Cargo.toml` | `@NgModule` (`src/app/app.module.ts`) |
| `struct` + `impl` methods | Component or Service class |
| Passing `&dep` | Constructor dependency injection |
| `impl Trait for T` | `implements OnInit` |
| `Stream` / lazy `Future` | RxJS `Observable<T>` |
| `.map()` on a stream | `.pipe(map(...))` |
| Drop to cancel | `lazyFetch` teardown closure |
| `match result { Ok, Err }` | `.subscribe(next, error, complete)` |
| `#[derive(Deserialize)]` structs | Model classes in `src/app/shared/models/` |
| Fieldless `enum` | String-literal union (`FeedType`) |
| `lazy_static!` / `OnceCell` global | `@Injectable({ providedIn: 'root' })` |
| `match` on input | `Routes` array (`src/app/app.routes.ts`) |
| Dynamically loaded plugin | `loadChildren: () => import(...)` |
| `unsafe` / `transmute` | `as any` |

## 12. Key mindset shifts

- **Types are compile-time only.** They help you while editing but vanish at runtime.
  Data from the network is never validated against the declared type.
- **No ownership or borrow checker.** Everything is a garbage-collected reference;
  aliasing and mutation are unrestricted. Singletons like `SettingsService` are shared
  mutable state by design.
- **Async is expressed as `Observable` subscriptions**, not `async/await`. Streams are
  lazy until subscribed, can emit many values, and are cancelled by unsubscribing.
  Forgetting to unsubscribe is the JavaScript equivalent of a leaked task.
