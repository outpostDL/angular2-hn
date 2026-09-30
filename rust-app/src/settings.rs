//! Port of `SettingsService` (`settings.service.ts`) backed by `gloo-storage` LocalStorage.
//! Uses the same localStorage keys as the Angular app so preferences carry over.

use gloo_storage::{LocalStorage, Storage};
use leptos::prelude::*;
use wasm_bindgen::prelude::*;

pub const THEMES: [(&str, &str); 3] = [
    ("default", "Default"),
    ("night", "Night"),
    ("amoledblack", "Black (AMOLED)"),
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Settings {
    pub show_settings: bool,
    pub open_link_in_new_tab: bool,
    pub theme: String,
    pub title_font_size: String,
    pub list_spacing: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            show_settings: false,
            open_link_in_new_tab: false,
            theme: "default".into(),
            title_font_size: "16".into(),
            list_spacing: "0".into(),
        }
    }
}

fn prefers_dark() -> Option<web_sys::MediaQueryList> {
    web_sys::window()?
        .match_media("(prefers-color-scheme: dark)")
        .ok()
        .flatten()
}

/// Angular stores `theme`/`titleFontSize`/`listSpacing` as raw (unquoted) strings via
/// `localStorage.setItem`, while `gloo_storage` JSON-encodes values. These helpers use the
/// raw Web Storage API so both apps can read each other's preferences.
fn get_raw(key: &str) -> Option<String> {
    LocalStorage::raw()
        .get_item(key)
        .ok()
        .flatten()
        .filter(|v| !v.is_empty())
}

fn set_raw(key: &str, value: &str) {
    let _ = LocalStorage::raw().set_item(key, value);
}

impl Settings {
    fn load() -> Self {
        let defaults = Self::default();
        let theme = get_raw("theme").unwrap_or_else(|| {
            if prefers_dark().map(|m| m.matches()).unwrap_or(false) {
                "night".into()
            } else {
                "default".into()
            }
        });
        Self {
            show_settings: false,
            open_link_in_new_tab: LocalStorage::get("openLinkInNewTab").unwrap_or(false),
            theme,
            title_font_size: get_raw("titleFontSize").unwrap_or(defaults.title_font_size),
            list_spacing: get_raw("listSpacing").unwrap_or(defaults.list_spacing),
        }
    }
}

/// Reactive settings store; provided via `provide_context` from the root component.
#[derive(Clone, Copy)]
pub struct SettingsStore(pub RwSignal<Settings>);

impl SettingsStore {
    pub fn get(&self) -> Settings {
        self.0.get()
    }

    pub fn toggle_settings(&self) {
        self.0.update(|s| s.show_settings = !s.show_settings);
    }

    pub fn toggle_open_links_in_new_tab(&self) {
        self.0.update(|s| {
            s.open_link_in_new_tab = !s.open_link_in_new_tab;
            let _ = LocalStorage::set("openLinkInNewTab", s.open_link_in_new_tab);
        });
    }

    pub fn set_theme(&self, theme: &str) {
        self.0.update(|s| {
            s.theme = theme.to_string();
            set_raw("theme", theme);
        });
    }

    pub fn set_font(&self, size: &str) {
        self.0.update(|s| {
            s.title_font_size = size.to_string();
            set_raw("titleFontSize", size);
        });
    }

    pub fn set_spacing(&self, spacing: &str) {
        self.0.update(|s| {
            s.list_spacing = spacing.to_string();
            set_raw("listSpacing", spacing);
        });
    }
}

/// Creates the store, subscribes to `prefers-color-scheme` changes (only applied while
/// no theme is persisted, matching the Angular behaviour), and provides it as context.
pub fn provide_settings() -> SettingsStore {
    let store = SettingsStore(RwSignal::new(Settings::load()));

    if let Some(mq) = prefers_dark() {
        let cb = Closure::<dyn Fn(web_sys::MediaQueryListEvent)>::new(
            move |e: web_sys::MediaQueryListEvent| {
                let theme = if e.matches() { "night" } else { "default" };
                store.set_theme(theme);
            },
        );
        let _ = mq.add_event_listener_with_callback("change", cb.as_ref().unchecked_ref());
        cb.forget();
    }

    provide_context(store);
    store
}

pub fn use_settings() -> SettingsStore {
    expect_context::<SettingsStore>()
}
