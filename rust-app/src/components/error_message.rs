use leptos::prelude::*;

/// Port of `app-error-message`.
#[component]
pub fn ErrorMessage(message: String) -> impl IntoView {
    view! {
        <div class="error-section">
            <div class="skull">
                <div class="head"><div class="crack"></div></div>
                <div class="mouth"><div class="teeth"></div></div>
            </div>
            <p class="strong">{message}</p>
            <p>"If you are offline viewing, you'll need to visit this page with a network connection first before it can work offline."</p>
        </div>
    }
}
