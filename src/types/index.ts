export type FeedType = 'poll' | 'story' | 'job';

export interface PollResult {
    points: number;
    content: string;
}

export interface Comment {
    id: number;
    level: number;
    user: string;
    time: number;
    time_ago: string;
    content: string;
    deleted: boolean;
    comments: Comment[];
}

export interface Story {
    id: number;
    title: string;
    points: number;
    user: string;
    time: number;
    time_ago: string;
    type: FeedType;
    url: string;
    domain: string;
    comments: Comment[];
    comments_count: number;
    poll: PollResult[];
    poll_votes_count: number;
    deleted: boolean;
    dead: boolean;
}

export interface User {
    id: string;
    created_time: number;
    created: string;
    karma: number;
    avg: number;
    about: string;
}

export interface Settings {
    showSettings: boolean;
    openLinkInNewTab: boolean;
    theme: string;
    titleFontSize: string;
    listSpacing: string;
}
