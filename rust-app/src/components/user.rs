use leptos::prelude::*;
use leptos_router::hooks::use_params_map;

use crate::api::fetch_user;
use crate::components::error_message::ErrorMessage;
use crate::components::loader::Loader;

fn go_back() {
    if let Some(w) = web_sys::window() {
        let _ = w.history().and_then(|h| h.back());
    }
}

/// Port of `UserComponent`.
#[component]
pub fn UserPage() -> impl IntoView {
    let params = use_params_map();
    let id = Memo::new(move |_| params.with(|p| p.get("id").unwrap_or_default()));
    let user = LocalResource::new(move || {
        let id = id.get();
        async move { fetch_user(&id).await }
    });

    view! {
        <Suspense fallback=Loader>
            {move || Suspend::new(async move {
                match user.await {
                    Err(_) => view! {
                        <ErrorMessage message=format!("Could not load user {}.", id.get_untracked())/>
                    }.into_any(),
                    Ok(u) => view! {
                        <div class="profile">
                            <div class="mobile item-header">
                                <p class="title-block">
                                    <span class="back-button" on:click=move |_| go_back()></span>
                                    "Profile: " {u.id.clone()}
                                </p>
                            </div>
                            <div class="main-details">
                                <span class="name">{u.id.clone()}</span>
                                <span class="right">{u.karma} " ★"</span>
                                <p class="age">"Created " {u.created.clone()}</p>
                            </div>
                            {u.about.clone().filter(|a| !a.is_empty()).map(|about| view! {
                                <div class="other-details"><p inner_html=about></p></div>
                            })}
                        </div>
                    }.into_any(),
                }
            })}
        </Suspense>
    }
}
