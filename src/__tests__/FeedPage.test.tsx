import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedPage from '../pages/FeedPage/FeedPage';
import { SettingsContext, SettingsContextValue } from '../contexts/SettingsContext';

// Mock the useFeed hook
vi.mock('../hooks/useFeed', () => ({
    useFeed: vi.fn(),
}));

import { useFeed } from '../hooks/useFeed';
const mockUseFeed = vi.mocked(useFeed);

function mockSettings(overrides: Partial<SettingsContextValue> = {}): SettingsContextValue {
    return {
        showSettings: false,
        openLinkInNewTab: false,
        theme: 'default',
        titleFontSize: '16',
        listSpacing: '0',
        toggleSettings: vi.fn(),
        toggleOpenLinksInNewTab: vi.fn(),
        setTheme: vi.fn(),
        setFont: vi.fn(),
        setSpacing: vi.fn(),
        ...overrides,
    };
}

function renderFeedPage(feedType: string, page: string, settingsOverrides: Partial<SettingsContextValue> = {}) {
    return render(
        <SettingsContext.Provider value={mockSettings(settingsOverrides)}>
            <MemoryRouter initialEntries={[`/${feedType}/${page}`]}>
                <Routes>
                    <Route path="/:feedType/:page" element={<FeedPage feedType={feedType} />} />
                </Routes>
            </MemoryRouter>
        </SettingsContext.Provider>
    );
}

// Helper to create mock stories
function createMockStories(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        title: `Story ${i + 1}`,
        points: 100 + i,
        user: `user${i + 1}`,
        time: Date.now(),
        time_ago: '2 hours ago',
        type: 'story' as const,
        url: `https://example.com/story-${i + 1}`,
        domain: 'example.com',
        comments: [],
        comments_count: 10 + i,
        poll: [],
        poll_votes_count: 0,
        deleted: false,
        dead: false,
    }));
}

describe('FeedPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });

    it('renders Loader when loading and no error', () => {
        mockUseFeed.mockReturnValue({ items: [], error: null, loading: true });
        renderFeedPage('news', '1');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders ErrorMessage on error', () => {
        mockUseFeed.mockReturnValue({ items: [], error: 'Network error', loading: false });
        renderFeedPage('news', '1');
        expect(screen.getByText('Could not load news stories.')).toBeInTheDocument();
    });

    it('renders item list when loaded', () => {
        const stories = createMockStories(3);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '1');
        expect(screen.getByText('Story 1')).toBeInTheDocument();
        expect(screen.getByText('Story 2')).toBeInTheDocument();
        expect(screen.getByText('Story 3')).toBeInTheDocument();
    });

    it('hides "Prev" link on page 1', () => {
        const stories = createMockStories(30);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '1');
        expect(screen.queryByText(/Prev/)).not.toBeInTheDocument();
    });

    it('shows "Prev" link on page 2', () => {
        const stories = createMockStories(30);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '2');
        expect(screen.getByText(/Prev/)).toBeInTheDocument();
    });

    it('hides "More" link when fewer than 30 items', () => {
        const stories = createMockStories(10);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '1');
        expect(screen.queryByText(/More/)).not.toBeInTheDocument();
    });

    it('shows "More" link when exactly 30 items', () => {
        const stories = createMockStories(30);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '1');
        expect(screen.getByText(/More/)).toBeInTheDocument();
    });

    it('shows jobs header for jobs feed', () => {
        const stories = createMockStories(5);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('jobs', '1');
        expect(screen.getByText(/Y Combinator/)).toBeInTheDocument();
    });

    it('does not show jobs header for non-jobs feed', () => {
        const stories = createMockStories(5);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '1');
        expect(screen.queryByText(/Y Combinator/)).not.toBeInTheDocument();
    });

    it('calculates listStart correctly for page 1', () => {
        const stories = createMockStories(5);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        const { container } = renderFeedPage('news', '1');
        const ol = container.querySelector('ol');
        expect(ol).toHaveAttribute('start', '1');
    });

    it('calculates listStart correctly for page 3', () => {
        const stories = createMockStories(5);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        const { container } = renderFeedPage('news', '3');
        const ol = container.querySelector('ol');
        expect(ol).toHaveAttribute('start', '61');
    });

    it('calls window.scrollTo(0,0) when data loads', () => {
        const scrollToSpy = vi.spyOn(window, 'scrollTo');
        const stories = createMockStories(5);
        mockUseFeed.mockReturnValue({ items: stories, error: null, loading: false });
        renderFeedPage('news', '1');
        expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    });

    it('calls useFeed with correct feedType and page number', () => {
        mockUseFeed.mockReturnValue({ items: [], error: null, loading: true });
        renderFeedPage('newest', '3');
        expect(mockUseFeed).toHaveBeenCalledWith('newest', 3);
    });
});
