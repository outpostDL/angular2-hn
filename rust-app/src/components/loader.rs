use leptos::prelude::*;

/// Port of `app-loader`.
#[component]
pub fn Loader() -> impl IntoView {
    view! {
        <div class="loading-section">
            <div class="loader">"Loading..."</div>
        </div>
    }
}
