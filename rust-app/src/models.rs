//! Data models mirroring `src/app/shared/models/*` in the Angular app.
//! Field names match the JSON returned by https://node-hnapi.herokuapp.com.

#![allow(dead_code)] // models mirror the full TS types even where fields are not yet rendered

use serde::Deserialize;

/// Mirrors `feed-type.type.ts` (`'poll' | 'story' | 'job'`).
/// The live API also emits `"link"` and `"ask"`, so unknown values are kept as `Other`.
#[derive(Debug, Clone, PartialEq, Eq, Default, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ItemType {
    Poll,
    Story,
    Job,
    Link,
    Ask,
    #[default]
    #[serde(other)]
    Other,
}

/// Mirrors `poll-result.ts`.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct PollResult {
    #[serde(default)]
    pub points: u32,
    #[serde(default)]
    pub content: String,
}

/// Mirrors `comment.ts`. Recursive via `comments`.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct Comment {
    pub id: u64,
    #[serde(default)]
    pub level: u32,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub time: u64,
    #[serde(default)]
    pub time_ago: String,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub deleted: bool,
    #[serde(default)]
    pub comments: Vec<Comment>,
}

/// Mirrors `story.ts`.
#[derive(Debug, Clone, Default, Deserialize)]
pub struct Story {
    pub id: u64,
    #[serde(default)]
    pub title: String,
    #[serde(default)]
    pub points: Option<u32>,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub time: u64,
    #[serde(default)]
    pub time_ago: String,
    #[serde(rename = "type", default)]
    pub item_type: ItemType,
    #[serde(default)]
    pub url: String,
    #[serde(default)]
    pub domain: Option<String>,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub comments: Vec<Comment>,
    #[serde(default)]
    pub comments_count: u32,
    #[serde(default)]
    pub poll: Vec<PollResult>,
    #[serde(default)]
    pub poll_votes_count: u32,
    #[serde(default)]
    pub deleted: bool,
    #[serde(default)]
    pub dead: bool,
}

impl Story {
    /// Equivalent of the Angular `hasUrl` getter (`item.url.indexOf('http') === 0`).
    pub fn has_url(&self) -> bool {
        self.url.starts_with("http")
    }

    pub fn is_job(&self) -> bool {
        self.item_type == ItemType::Job
    }
}

/// Mirrors `user.ts` (the original has a `crated_time` typo; the API sends `created_time`).
#[derive(Debug, Clone, Default, Deserialize)]
pub struct User {
    pub id: String,
    #[serde(default, alias = "crated_time")]
    pub created_time: u64,
    #[serde(default)]
    pub created: String,
    #[serde(default)]
    pub karma: i64,
    #[serde(default)]
    pub avg: Option<f64>,
    #[serde(default)]
    pub about: Option<String>,
}

/// Feed categories used in routing (`news`, `newest`, `show`, `ask`, `jobs`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FeedType {
    News,
    Newest,
    Show,
    Ask,
    Jobs,
}

impl FeedType {
    pub const ALL: [FeedType; 5] = [
        FeedType::News,
        FeedType::Newest,
        FeedType::Show,
        FeedType::Ask,
        FeedType::Jobs,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            FeedType::News => "news",
            FeedType::Newest => "newest",
            FeedType::Show => "show",
            FeedType::Ask => "ask",
            FeedType::Jobs => "jobs",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|f| f.as_str() == s)
    }
}

/// Equivalent of `CommentPipe`: `n comment(s)` or `discuss` when zero.
pub fn comment_label(count: u32) -> String {
    match count {
        0 => "discuss".to_string(),
        1 => "1 comment".to_string(),
        n => format!("{n} comments"),
    }
}
