use leptos::prelude::*;
use leptos_router::components::A;
use leptos_router::hooks::use_params_map;

use crate::api::fetch_feed;
use crate::components::error_message::ErrorMessage;
use crate::components::item::Item;
use crate::components::loader::Loader;
use crate::models::FeedType;

const PAGE_SIZE: usize = 30;

/// Port of `FeedComponent`. The `feed_type` comes from the route (like Angular's
/// route `data.feedType`); `:page` is read from the params map.
#[component]
pub fn Feed(feed_type: FeedType) -> impl IntoView {
    let params = use_params_map();
    let page = Memo::new(move |_| {
        params
            .with(|p| p.get("page").and_then(|v| v.parse::<u32>().ok()))
            .unwrap_or(1)
            .max(1)
    });

    let stories = LocalResource::new(move || fetch_feed(feed_type, page.get()));

    Effect::new(move |_| {
        page.track();
        if let Some(w) = web_sys::window() {
            w.scroll_to_with_x_and_y(0.0, 0.0);
        }
    });

    let list_start = move || ((page.get() - 1) * PAGE_SIZE as u32 + 1).to_string();
    let kind = feed_type.as_str();
    let has_prev = move || page.get() > 1;

    view! {
        <div class="main-content">
            <Suspense fallback=Loader>
                {move || Suspend::new(async move {
                    match stories.await {
                        Err(_) => view! {
                            <ErrorMessage message=format!("Could not load {kind} stories.")/>
                        }.into_any(),
                        Ok(items) => {
                            let count = items.len();
                            view! {
                                <div>
                                    <Show when=move || feed_type == FeedType::Jobs>
                                        <p class="job-header">
                                            "These are jobs at startups that were funded by Y Combinator. You can also get a job at a YC startup through "
                                            <a href="https://triplebyte.com/?ref=yc_jobs">"Triplebyte"</a>"."
                                        </p>
                                    </Show>
                                    <ol class:list-margin=feed_type != FeedType::Jobs start=list_start>
                                        {items.into_iter().map(|story| view! {
                                            <li class="post"><Item item=story/></li>
                                        }).collect_view()}
                                    </ol>
                                    <div class="nav">
                                        <Show when=has_prev>
                                            <A href=move || format!("/{kind}/{}", page.get() - 1) attr:class="prev">"‹ Prev"</A>
                                        </Show>
                                        <Show when=move || count == PAGE_SIZE>
                                            <A href=move || format!("/{kind}/{}", page.get() + 1) attr:class="more">"More ›"</A>
                                        </Show>
                                    </div>
                                </div>
                            }.into_any()
                        }
                    }
                })}
            </Suspense>
        </div>
    }
}
