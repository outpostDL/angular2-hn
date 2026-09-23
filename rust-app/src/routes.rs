//! Router config mirroring `app.routes.ts`.
//!
//! - `/` → redirect to `/news/1`
//! - `/{news|newest|show|ask|jobs}/:page` → `Feed`
//! - `/item/:id` → `ItemDetails`
//! - `/user/:id` → `UserPage`

use leptos::prelude::*;
use leptos_router::components::{Redirect, Route, Router, Routes};
use leptos_router::path;

use crate::components::feed::Feed;
use crate::components::footer::Footer;
use crate::components::header::Header;
use crate::components::item_details::ItemDetails;
use crate::components::user::UserPage;
use crate::models::FeedType;
use crate::settings::use_settings;

#[component]
pub fn AppRouter() -> impl IntoView {
    let settings = use_settings();
    let theme = move || settings.0.with(|s| s.theme.clone());

    view! {
        <Router>
            <div class=theme>
                <div class="body-cover"></div>
                <div class="wrapper">
                    <Header/>
                    <Routes fallback=|| view! { <p class="main-content">"Page not found."</p> }>
                        <Route path=path!("/") view=|| view! { <Redirect path="/news/1"/> }/>
                        <Route path=path!("/news/:page") view=|| view! { <Feed feed_type=FeedType::News/> }/>
                        <Route path=path!("/newest/:page") view=|| view! { <Feed feed_type=FeedType::Newest/> }/>
                        <Route path=path!("/show/:page") view=|| view! { <Feed feed_type=FeedType::Show/> }/>
                        <Route path=path!("/ask/:page") view=|| view! { <Feed feed_type=FeedType::Ask/> }/>
                        <Route path=path!("/jobs/:page") view=|| view! { <Feed feed_type=FeedType::Jobs/> }/>
                        <Route path=path!("/item/:id") view=ItemDetails/>
                        <Route path=path!("/user/:id") view=UserPage/>
                    </Routes>
                    <Footer/>
                </div>
            </div>
        </Router>
    }
}
