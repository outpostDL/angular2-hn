import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ItemDetailsPage from './ItemDetailsPage';
import type { Story } from '../../types';

// Mock the hooks
vi.mock('../../hooks/useItemContent', () => ({
    useItemContent: vi.fn(),
}));

vi.mock('../../hooks/useSettings', () => ({
    useSettings: vi.fn(() => ({
        openLinkInNewTab: false,
        theme: 'default',
        showSettings: false,
        titleFontSize: '16',
        listSpacing: '0',
        toggleSettings: vi.fn(),
        toggleOpenLinksInNewTab: vi.fn(),
        setTheme: vi.fn(),
        setFont: vi.fn(),
        setSpacing: vi.fn(),
    })),
}));

import { useItemContent } from '../../hooks/useItemContent';
import { useSettings } from '../../hooks/useSettings';

const mockStory: Story = {
    id: 123,
    title: 'Test Story Title',
    points: 42,
    user: 'storyuser',
    time: 1234567890,
    time_ago: '5 hours ago',
    type: 'story',
    url: 'https://example.com/article',
    domain: 'example.com',
    comments: [
        {
            id: 1,
            level: 0,
            user: 'commenter1',
            time: 1234567891,
            time_ago: '4 hours ago',
            content: 'Great article!',
            deleted: false,
            comments: [],
        },
    ],
    comments_count: 1,
    poll: [],
    poll_votes_count: 0,
    deleted: false,
    dead: false,
};

function renderPage(itemId = '123') {
    return render(
        <MemoryRouter initialEntries={[`/item/${itemId}`]}>
            <Routes>
                <Route path="/item/:id" element={<ItemDetailsPage />} />
                <Route path="/user/:id" element={<div>User Page</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ItemDetailsPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    });

    it('shows Loader when loading', () => {
        vi.mocked(useItemContent).mockReturnValue({
            item: null,
            error: null,
            loading: true,
        });
        const { container } = renderPage();
        expect(container.querySelector('.loading-section')).toBeInTheDocument();
    });

    it('shows ErrorMessage on error', () => {
        vi.mocked(useItemContent).mockReturnValue({
            item: null,
            error: 'API failure',
            loading: false,
        });
        renderPage();
        expect(screen.getByText('Could not load item comments.')).toBeInTheDocument();
    });

    it('renders title, user, and points for a story', () => {
        vi.mocked(useItemContent).mockReturnValue({
            item: mockStory,
            error: null,
            loading: false,
        });
        renderPage();
        // Title should be rendered (in both mobile and laptop layouts)
        const titles = screen.getAllByText('Test Story Title');
        expect(titles.length).toBeGreaterThanOrEqual(1);
        // Points and user in laptop subtext
        expect(screen.getByText(/42 points by/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'storyuser' })).toBeInTheDocument();
    });

    it('renders poll section for poll type items', () => {
        const pollStory: Story = {
            ...mockStory,
            type: 'poll',
            poll: [
                { points: 60, content: 'Option A' },
                { points: 40, content: 'Option B' },
            ],
            poll_votes_count: 100,
        };
        vi.mocked(useItemContent).mockReturnValue({
            item: pollStory,
            error: null,
            loading: false,
        });
        const { container } = renderPage();
        expect(container.querySelector('.pollResults')).toBeInTheDocument();
        expect(screen.getByText('60 points')).toBeInTheDocument();
        expect(screen.getByText('40 points')).toBeInTheDocument();
    });

    it('renders item content as HTML', () => {
        const storyWithContent: Story = {
            ...mockStory,
            content: '<b>Bold text</b> and more',
        };
        vi.mocked(useItemContent).mockReturnValue({
            item: storyWithContent,
            error: null,
            loading: false,
        });
        const { container } = renderPage();
        const subject = container.querySelector('.subject');
        expect(subject).toBeInTheDocument();
        expect(subject!.innerHTML).toContain('<b>Bold text</b>');
    });

    it('calls window.scrollTo(0, 0) on mount', () => {
        vi.mocked(useItemContent).mockReturnValue({
            item: null,
            error: null,
            loading: true,
        });
        renderPage();
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('back button calls history.back()', () => {
        vi.mocked(useItemContent).mockReturnValue({
            item: mockStory,
            error: null,
            loading: false,
        });
        const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
        const { container } = renderPage();
        const backButton = container.querySelector('.back-button') as HTMLElement;
        expect(backButton).toBeInTheDocument();
        backButton.click();
        expect(backSpy).toHaveBeenCalled();
        backSpy.mockRestore();
    });

    it('renders external link with target _blank when openLinkInNewTab is true', () => {
        vi.mocked(useSettings).mockReturnValue({
            openLinkInNewTab: true,
            theme: 'default',
            showSettings: false,
            titleFontSize: '16',
            listSpacing: '0',
            toggleSettings: vi.fn(),
            toggleOpenLinksInNewTab: vi.fn(),
            setTheme: vi.fn(),
            setFont: vi.fn(),
            setSpacing: vi.fn(),
        });
        vi.mocked(useItemContent).mockReturnValue({
            item: mockStory,
            error: null,
            loading: false,
        });
        renderPage();
        // At least one of the title links should have target _blank
        const links = screen.getAllByRole('link', { name: 'Test Story Title' });
        const externalLink = links.find((l) => l.getAttribute('href') === 'https://example.com/article');
        expect(externalLink).toBeDefined();
        expect(externalLink).toHaveAttribute('target', '_blank');
        expect(externalLink).toHaveAttribute('rel', 'noopener');
    });

    it('hides user/points for job type items', () => {
        const jobStory: Story = {
            ...mockStory,
            type: 'job',
        };
        vi.mocked(useItemContent).mockReturnValue({
            item: jobStory,
            error: null,
            loading: false,
        });
        const { container } = renderPage();
        // The subtext should not contain "points by"
        const subtext = container.querySelector('.laptop .subtext');
        expect(subtext).toBeInTheDocument();
        expect(subtext!.textContent).not.toContain('points by');
    });

    it('renders comment list with Comment components', () => {
        vi.mocked(useItemContent).mockReturnValue({
            item: mockStory,
            error: null,
            loading: false,
        });
        const { container } = renderPage();
        const commentList = container.querySelector('.comment-list');
        expect(commentList).toBeInTheDocument();
        expect(commentList!.querySelectorAll(':scope > li').length).toBe(1);
    });
});
