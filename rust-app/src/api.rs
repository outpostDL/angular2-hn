//! Port of `HackerNewsAPIService` (`hackernews-api.service.ts`).

use futures::future::join_all;
use gloo_net::http::Request;
use serde::de::DeserializeOwned;

use crate::models::{FeedType, ItemType, PollResult, Story, User};

pub const BASE_URL: &str = "https://node-hnapi.herokuapp.com";

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ApiError {
    Network(String),
    Status(u16),
    Decode(String),
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiError::Network(e) => write!(f, "network error: {e}"),
            ApiError::Status(s) => write!(f, "unexpected HTTP status {s}"),
            ApiError::Decode(e) => write!(f, "decode error: {e}"),
        }
    }
}

async fn get_json<T: DeserializeOwned>(url: &str) -> Result<T, ApiError> {
    let resp = Request::get(url)
        .send()
        .await
        .map_err(|e| ApiError::Network(e.to_string()))?;
    if !resp.ok() {
        return Err(ApiError::Status(resp.status()));
    }
    resp.json::<T>()
        .await
        .map_err(|e| ApiError::Decode(e.to_string()))
}

/// `GET /{feedType}?page={n}`
pub async fn fetch_feed(feed_type: FeedType, page: u32) -> Result<Vec<Story>, ApiError> {
    get_json(&format!("{BASE_URL}/{}?page={page}", feed_type.as_str())).await
}

/// `GET /item/{id}` for a poll option.
pub async fn fetch_poll_option(id: u64) -> Result<PollResult, ApiError> {
    get_json(&format!("{BASE_URL}/item/{id}")).await
}

/// `GET /item/{id}`, replicating the poll special case from `fetchItemContent`:
/// for a poll with N options, items `id+1..=id+N` are fetched, replace `story.poll[i]`,
/// and their points are summed into `poll_votes_count`.
///
/// Unlike the Angular version (fire-and-forget subscriptions mutating the story
/// after render) this awaits all option fetches concurrently before returning.
pub async fn fetch_item(id: u64) -> Result<Story, ApiError> {
    let mut story: Story = get_json(&format!("{BASE_URL}/item/{id}")).await?;
    if story.item_type == ItemType::Poll {
        let n = story.poll.len() as u64;
        let results = join_all((1..=n).map(|i| fetch_poll_option(story.id + i))).await;
        let mut total = 0;
        for (slot, res) in story.poll.iter_mut().zip(results) {
            if let Ok(opt) = res {
                total += opt.points;
                *slot = opt;
            }
        }
        story.poll_votes_count = total;
    }
    Ok(story)
}

/// `GET /user/{id}`
pub async fn fetch_user(id: &str) -> Result<User, ApiError> {
    get_json(&format!("{BASE_URL}/user/{id}")).await
}
