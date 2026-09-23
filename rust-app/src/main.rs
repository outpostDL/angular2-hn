mod api;
mod components;
mod models;
mod routes;
mod settings;

use leptos::prelude::*;
use leptos_meta::{provide_meta_context, Title};

use routes::AppRouter;

#[component]
fn App() -> impl IntoView {
    provide_meta_context();
    settings::provide_settings();
    view! {
        <Title text="Leptos HN"/>
        <AppRouter/>
    }
}

fn main() {
    console_error_panic_hook::set_once();
    leptos::mount::mount_to_body(App);
}
