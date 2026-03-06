import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchFeed, fetchItemContent, fetchUser, fetchPollContent, BASE_URL } from '../services/hackernews-api';
import type { Story, User, PollResult } from '../types';

const mockStory: Story = {
    id: 1,
    title: 'Test Story',
    points: 100,
    user: 'testuser',
    time: 1234567890,
    time_ago: '2 hours ago',
    type: 'story',
    url: 'https://example.com',
    domain: 'example.com',
    comments: [],
    comments_count: 5,
    poll: [],
    poll_votes_count: 0,
    deleted: false,
    dead: false,
};

const mockUser: User = {
    id: 'testuser',
    created_time: 1234567890,
    created: '10 years ago',
    karma: 5000,
    avg: 10,
    about: 'A test user',
};

const mockPollResult: PollResult = {
    points: 42,
    content: 'Option A',
};

describe('HackerNews API Service', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(null),
                })
            )
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchFeed', () => {
        it('fetches a feed and returns stories', async () => {
            const stories = [mockStory];
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(stories),
            } as Response);

            const result = await fetchFeed('news', 1);
            expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/news?page=1`, expect.anything());
            expect(result).toEqual(stories);
        });

        it('throws on network error', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchFeed('news', 1)).rejects.toThrow('Network error');
        });
    });

    describe('fetchItemContent', () => {
        it('fetches item content for a non-poll story', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockStory),
            } as Response);

            const result = await fetchItemContent(1);
            expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/item/1`, expect.anything());
            expect(result).toEqual(mockStory);
        });

        it('fetches and merges poll sub-items for poll type', async () => {
            const pollStory: Story = {
                ...mockStory,
                id: 100,
                type: 'poll',
                poll: [{} as PollResult, {} as PollResult],
                poll_votes_count: 0,
            };
            const pollResult1: PollResult = { points: 10, content: 'Option 1' };
            const pollResult2: PollResult = { points: 20, content: 'Option 2' };

            vi.mocked(fetch)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(pollStory),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(pollResult1),
                } as Response)
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve(pollResult2),
                } as Response);

            const result = await fetchItemContent(100);
            expect(result.type).toBe('poll');
            expect(result.poll).toEqual([pollResult1, pollResult2]);
            expect(result.poll_votes_count).toBe(30);
        });

        it('throws on network error', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchItemContent(1)).rejects.toThrow('Network error');
        });
    });

    describe('fetchPollContent', () => {
        it('fetches poll content by id', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockPollResult),
            } as Response);

            const result = await fetchPollContent(101);
            expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/item/101`, expect.anything());
            expect(result).toEqual(mockPollResult);
        });
    });

    describe('fetchUser', () => {
        it('fetches a user by id', async () => {
            vi.mocked(fetch).mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockUser),
            } as Response);

            const result = await fetchUser('testuser');
            expect(fetch).toHaveBeenCalledWith(`${BASE_URL}/user/testuser`, expect.anything());
            expect(result).toEqual(mockUser);
        });

        it('throws on network error', async () => {
            vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchUser('testuser')).rejects.toThrow('Network error');
        });
    });
});
