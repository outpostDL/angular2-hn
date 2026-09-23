use leptos::prelude::*;
use leptos_router::components::A;

use crate::models::{comment_label, Story};
use crate::settings::use_settings;

/// Port of the `<item>` feed row component (`feeds/item`).
#[component]
pub fn Item(item: Story) -> impl IntoView {
    let settings = use_settings();

    let spacing = move || format!("margin-bottom: {}px", settings.get().list_spacing);
    let title_style = move || format!("font-size: {}px", settings.get().title_font_size);
    let target = move || settings.get().open_link_in_new_tab.then_some("_blank");
    let rel = move || settings.get().open_link_in_new_tab.then_some("noopener");

    let item_href = format!("/item/{}", item.id);
    let user = item.user.clone().unwrap_or_default();
    let user_href = format!("/user/{user}");
    let points = item.points.unwrap_or(0);
    let is_job = item.is_job();
    let comments = comment_label(item.comments_count);
    let not_job = !is_job;
    let (user_a, user_b, comments_a, comments_b) = (
        user.clone(),
        user.clone(),
        comments.clone(),
        comments.clone(),
    );
    let (item_href_a, item_href_b, user_href_a, user_href_b) = (
        item_href.clone(),
        item_href.clone(),
        user_href.clone(),
        user_href.clone(),
    );

    let title = if item.has_url() {
        view! {
            <p>
                <a class="title" style=title_style href=item.url.clone() target=target rel=rel>{item.title.clone()}</a>
                {item.domain.clone().map(|d| view! { <span class="domain">"(" {d} ")"</span> })}
            </p>
        }
        .into_any()
    } else {
        view! {
            <p>
                <A href=item_href.clone() attr:class="title" attr:style=title_style>{item.title.clone()}</A>
            </p>
        }
        .into_any()
    };

    view! {
        <div style=spacing>
            {title}
            <div class="subtext-palm">
                {not_job.then(|| view! {
                    <div class="details">
                        <span class="name"><A href=user_href_a>{user_a}</A></span>
                        <span class="right">{points} " ★"</span>
                    </div>
                })}
                <div class="details">
                    {item.time_ago.clone()}
                    {not_job.then(|| view! {
                        <A href=item_href_a attr:class="comment-number">" • " {comments_a}</A>
                    })}
                </div>
            </div>
            <div class="subtext-laptop">
                {not_job.then(|| view! {
                    <span>{points} " points by " <A href=user_href_b>{user_b}</A></span>
                })}
                <span class:item-details=not_job>
                    {item.time_ago.clone()}
                    {not_job.then(|| view! {
                        " | " <A href=item_href_b>{comments_b}</A>
                    })}
                </span>
            </div>
        </div>
    }
}
