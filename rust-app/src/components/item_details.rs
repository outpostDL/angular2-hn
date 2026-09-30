use leptos::prelude::*;
use leptos_router::components::A;
use leptos_router::hooks::use_params_map;

use crate::api::fetch_item;
use crate::components::error_message::ErrorMessage;
use crate::components::loader::Loader;
use crate::models::{comment_label, Comment, ItemType, Story};
use crate::settings::use_settings;

fn go_back() {
    if let Some(w) = web_sys::window() {
        let _ = w.history().and_then(|h| h.back());
    }
}

/// Port of `ItemDetailsComponent` (story header + poll results + comment tree).
#[component]
pub fn ItemDetails() -> impl IntoView {
    let params = use_params_map();
    let id = Memo::new(move |_| {
        params
            .with(|p| p.get("id").and_then(|v| v.parse::<u64>().ok()))
            .unwrap_or(0)
    });
    let item = LocalResource::new(move || fetch_item(id.get()));

    view! {
        <div class="main-content">
            <Suspense fallback=Loader>
                {move || Suspend::new(async move {
                    match item.await {
                        Err(_) => view! { <ErrorMessage message="Could not load item comments.".to_string()/> }.into_any(),
                        Ok(story) => view! { <StoryView story/> }.into_any(),
                    }
                })}
            </Suspense>
        </div>
    }
}

#[component]
fn StoryView(story: Story) -> impl IntoView {
    let settings = use_settings();
    let target = move || settings.get().open_link_in_new_tab.then_some("_blank");
    let rel = move || settings.get().open_link_in_new_tab.then_some("noopener");

    let has_url = story.has_url();
    let is_job = story.is_job();
    let is_poll = story.item_type == ItemType::Poll;
    let item_href = format!("/item/{}", story.id);
    let user = story.user.clone().unwrap_or_default();
    let user_href = format!("/user/{user}");
    let title = story.title.clone();
    let url = story.url.clone();
    let votes = story.poll_votes_count.max(1) as f64;
    let not_job = !is_job;
    let has_comments_header = story.comments_count > 0 || is_job;
    let has_content = !story.content.is_empty();

    let title_link = move || {
        let (url, title, item_href) = (url.clone(), title.clone(), item_href.clone());
        if has_url {
            view! { <a class="title" href=url target=target rel=rel>{title}</a> }.into_any()
        } else {
            view! { <A href=item_href attr:class="title">{title}</A> }.into_any()
        }
    };

    view! {
        <div class="item">
            <div class="mobile item-header">
                <p class="title-block">
                    <span class="back-button" on:click=move |_| go_back()></span>
                    {title_link()}
                </p>
            </div>
            <div class="laptop" class:item-header=has_comments_header class:head-margin=has_content>
                <p>
                    {title_link()}
                    {has_url.then(|| story.domain.clone()).flatten().map(|d| view! { <span class="domain">"(" {d} ")"</span> })}
                </p>
                <div class="subtext">
                    {not_job.then(|| view! {
                        <span>{story.points.unwrap_or(0)} " points by " <A href=user_href.clone()>{user.clone()}</A></span>
                    })}
                    <span class:item-details=not_job>
                        {story.time_ago.clone()}
                        {not_job.then(|| view! {
                            " | " <A href=format!("/item/{}", story.id)>{comment_label(story.comments_count)}</A>
                        })}
                    </span>
                </div>
            </div>
            {is_poll.then(|| view! {
                <div class="pollResults">
                    {story.poll.iter().map(|opt| {
                        let width = format!("width: {}%", opt.points as f64 / votes * 100.0);
                        view! {
                            <div class="pollContent">
                                <div inner_html=opt.content.clone()></div>
                                <div class="subtext">{opt.points} " points"</div>
                                <div class="pollBar" style=width></div>
                            </div>
                        }
                    }).collect_view()}
                </div>
            })}
            <p class="subject" inner_html=story.content.clone()></p>
            <ul class="comment-list">
                {story.comments.iter().cloned().map(|c| view! { <li><CommentView comment=c/></li> }).collect_view()}
            </ul>
        </div>
    }
}

/// Port of the recursive `app-comment` component.
#[component]
pub fn CommentView(comment: Comment) -> impl IntoView {
    let collapsed = RwSignal::new(false);

    if comment.deleted {
        return view! {
            <div class="deleted-meta">
                <span class="collapse">"[deleted]"</span>" | Comment Deleted"
            </div>
        }
        .into_any();
    }

    let user = comment.user.clone().unwrap_or_default();
    let children = comment.comments.clone();

    view! {
        <div>
            <div class="meta" class:meta-collapse=move || collapsed.get()>
                <span class="collapse" on:click=move |_| collapsed.update(|c| *c = !*c)>
                    {move || if collapsed.get() { "[+]" } else { "[-]" }}
                </span>
                " "
                <A href=format!("/user/{user}")>{user.clone()}</A>
                " "
                <span class="time">{comment.time_ago.clone()}</span>
            </div>
            <div class="comment-tree">
                <div style:display=move || if collapsed.get() { "none" } else { "block" }>
                    <p class="comment-text" inner_html=comment.content.clone()></p>
                    <ul class="subtree">
                        {children.into_iter().map(|c| view! { <li><CommentView comment=c/></li> }).collect_view()}
                    </ul>
                </div>
            </div>
        </div>
    }
    .into_any()
}
