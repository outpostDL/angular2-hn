import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFeed } from '../hooks/useFeed';
import { useItemContent } from '../hooks/useItemContent';
import { useUser } from '../hooks/useUser';
import type { Story, User } from '../types';

// Mock the API service
vi.mock('../services/hackernews-api', () => ({
    fetchFeed: vi.fn(),
    fetchItemContent: vi.fn(),
    fetchUser: vi.fn(),
}));

import { fetchFeed, fetchItemContent, fetchUser } from '../services/hackernews-api';

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

describe('useFeed', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transitions from loading to data on success', async () => {
        vi.mocked(fetchFeed).mockResolvedValueOnce([mockStory]);

        const { result } = renderHook(() => useFeed('news', 1));

        // Initially loading
        expect(result.current.loading).toBe(true);
        expect(result.current.items).toEqual([]);
        expect(result.current.error).toBeNull();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.items).toEqual([mockStory]);
        expect(result.current.error).toBeNull();
    });

    it('transitions from loading to error on failure', async () => {
        vi.mocked(fetchFeed).mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useFeed('news', 1));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.items).toEqual([]);
        expect(result.current.error).toBe('Network error');
    });
});

describe('useItemContent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transitions from loading to data on success', async () => {
        vi.mocked(fetchItemContent).mockResolvedValueOnce(mockStory);

        const { result } = renderHook(() => useItemContent(1));

        expect(result.current.loading).toBe(true);
        expect(result.current.item).toBeNull();
        expect(result.current.error).toBeNull();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.item).toEqual(mockStory);
        expect(result.current.error).toBeNull();
    });

    it('transitions from loading to error on failure', async () => {
        vi.mocked(fetchItemContent).mockRejectedValueOnce(new Error('Not found'));

        const { result } = renderHook(() => useItemContent(1));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.item).toBeNull();
        expect(result.current.error).toBe('Not found');
    });
});

describe('useUser', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('transitions from loading to data on success', async () => {
        vi.mocked(fetchUser).mockResolvedValueOnce(mockUser);

        const { result } = renderHook(() => useUser('testuser'));

        expect(result.current.loading).toBe(true);
        expect(result.current.user).toBeNull();
        expect(result.current.error).toBeNull();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.user).toEqual(mockUser);
        expect(result.current.error).toBeNull();
    });

    it('transitions from loading to error on failure', async () => {
        vi.mocked(fetchUser).mockRejectedValueOnce(new Error('User not found'));

        const { result } = renderHook(() => useUser('testuser'));

        expect(result.current.loading).toBe(true);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.user).toBeNull();
        expect(result.current.error).toBe('User not found');
    });
});
