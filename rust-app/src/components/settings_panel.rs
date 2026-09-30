use leptos::prelude::*;

use crate::settings::{use_settings, THEMES};

/// Port of `app-settings` (the popup overlay).
#[component]
pub fn SettingsPanel() -> impl IntoView {
    let settings = use_settings();
    let current = move || settings.get();

    view! {
        <div id="popup1" class="overlay">
            <div class="popup">
                <h1>"Settings"</h1>
                <hr/>
                <span class="close" on:click=move |_| settings.toggle_settings()>"×"</span>
                <div class="content">
                    <div class="control-section">
                        <h2>"Links"</h2>
                        <input
                            type="checkbox"
                            prop:checked=move || current().open_link_in_new_tab
                            on:change=move |_| settings.toggle_open_links_in_new_tab()
                        />
                        " Open links in a new tab"
                    </div>
                    <div class="theme-controls">
                        <div class="control-section">
                            <h2>"Select a theme"</h2>
                            {THEMES.iter().map(|(value, label)| {
                                let value = *value;
                                view! {
                                    <div>
                                        <label>
                                            <input
                                                name="theme"
                                                type="radio"
                                                value=value
                                                prop:checked=move || current().theme == value
                                                on:click=move |_| settings.set_theme(value)
                                            />
                                            {*label}
                                        </label>
                                    </div>
                                }
                            }).collect_view()}
                        </div>
                        <div class="control-section">
                            <h2>"Change Font"</h2>
                            <div>
                                <label>
                                    "Font size: "
                                    <input
                                        min="1"
                                        type="number"
                                        prop:value=move || current().title_font_size
                                        on:input=move |ev| settings.set_font(&event_target_value(&ev))
                                    />
                                </label>
                            </div>
                            <div>
                                <label>
                                    "List spacing: "
                                    <input
                                        min="0"
                                        type="number"
                                        prop:value=move || current().list_spacing
                                        on:input=move |ev| settings.set_spacing(&event_target_value(&ev))
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}
