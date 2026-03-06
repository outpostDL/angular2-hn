import { Story, User, PollResult } from '../types';

const BASE_URL = 'https://node-hnapi.herokuapp.com';

export async function fetchFeed(type: string, page: number): Promise<Story[]> {
    const response = await fetch(`${BASE_URL}/${type}?page=${page}`, {});
    if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function fetchItemContent(id: number): Promise<Story> {
    const response = await fetch(`${BASE_URL}/item/${id}`, {});
    if (!response.ok) {
        throw new Error(`Failed to fetch item: ${response.status} ${response.statusText}`);
    }
    const story: Story = await response.json();

    if (story.type === 'poll') {
        const numberOfPollOptions = story.poll.length;
        const pollPromises: Promise<PollResult>[] = [];

        for (let i = 1; i <= numberOfPollOptions; i++) {
            pollPromises.push(fetchPollContent(story.id + i));
        }

        const pollResults = await Promise.all(pollPromises);
        story.poll = pollResults;
        story.poll_votes_count = pollResults.reduce((sum, result) => sum + result.points, 0);
    }

    return story;
}

export async function fetchPollContent(id: number): Promise<PollResult> {
    const response = await fetch(`${BASE_URL}/item/${id}`, {});
    if (!response.ok) {
        throw new Error(`Failed to fetch poll content: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function fetchUser(id: string): Promise<User> {
    const response = await fetch(`${BASE_URL}/user/${id}`, {});
    if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export { BASE_URL };
