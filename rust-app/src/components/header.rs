use leptos::prelude::*;
use leptos_router::components::A;

use crate::components::settings_panel::SettingsPanel;
use crate::settings::use_settings;

fn scroll_top() {
    if let Some(w) = web_sys::window() {
        w.scroll_to_with_x_and_y(0.0, 0.0);
    }
}

/// Port of `app-header`.
#[component]
pub fn Header() -> impl IntoView {
    let settings = use_settings();
    let show_settings = move || settings.0.with(|s| s.show_settings);

    view! {
        <header>
            <div id="header">
                <A href="/news/1" attr:class="home-link" on:click=move |_| scroll_top()>
                    <div class="logo-inner"></div>
                    <img class="logo" src="/assets/logo.svg" alt="Logo"/>
                </A>
                <div class="header-text">
                    <div class="left">
                        <span class="header-nav">
                            <A href="/newest/1" on:click=move |_| scroll_top()>"new"</A>
                            " | "
                            <A href="/show/1" on:click=move |_| scroll_top()>"show"</A>
                            " | "
                            <A href="/ask/1" on:click=move |_| scroll_top()>"ask"</A>
                            " | "
                            <A href="/jobs/1" on:click=move |_| scroll_top()>"jobs"</A>
                        </span>
                    </div>
                </div>
                <div class="info">
                    <img class="settings" src="/assets/cog.svg" alt="Settings" on:click=move |_| settings.toggle_settings()/>
                </div>
            </div>
            <Show when=show_settings>
                <SettingsPanel/>
            </Show>
        </header>
    }
}
