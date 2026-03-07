import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ItemRow from '../components/ItemRow/ItemRow';
import { SettingsContext, SettingsContextValue } from '../contexts/SettingsContext';
import { Story } from '../types';

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

function createStory(overrides: Partial<Story> = {}): Story {
    return {
        id: 1,
        title: 'Test Story',
        points: 100,
        user: 'testuser',
        time: Date.now(),
        time_ago: '2 hours ago',
        type: 'story',
        url: 'https://example.com/story',
        domain: 'example.com',
        comments: [],
        comments_count: 42,
        poll: [],
        poll_votes_count: 0,
        deleted: false,
        dead: false,
        ...overrides,
    };
}

function renderItemRow(item: Story, settingsOverrides: Partial<SettingsContextValue> = {}) {
    return render(
        <SettingsContext.Provider value={mockSettings(settingsOverrides)}>
            <MemoryRouter>
                <ItemRow item={item} />
            </MemoryRouter>
        </SettingsContext.Provider>
    );
}

describe('ItemRow', () => {
    it('renders external URL as <a> tag with href', () => {
        const item = createStory({ url: 'https://example.com/article' });
        renderItemRow(item);
        const link = screen.getByText('Test Story');
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', 'https://example.com/article');
    });

    it('renders internal URL as <Link> (anchor pointing to /item/:id)', () => {
        const item = createStory({ url: 'item?id=1', id: 123 });
        renderItemRow(item);
        const link = screen.getByText('Test Story');
        expect(link.tagName).toBe('A');
        expect(link).toHaveAttribute('href', '/item/123');
    });

    it('hides user/points sections for job type', () => {
        const item = createStory({ type: 'job', user: 'jobposter', points: 0 });
        renderItemRow(item);
        // Job type should not show user link or points
        expect(screen.queryByText('jobposter')).not.toBeInTheDocument();
        expect(screen.queryByText(/points by/)).not.toBeInTheDocument();
    });

    it('shows user and points for story type', () => {
        const item = createStory({ type: 'story', user: 'testuser', points: 100 });
        renderItemRow(item);
        // The laptop subtext should show points and user
        expect(screen.getByText(/100 points by/)).toBeInTheDocument();
        expect(screen.getAllByText('testuser').length).toBeGreaterThanOrEqual(1);
    });

    it('applies titleFontSize from settings as inline style', () => {
        const item = createStory();
        renderItemRow(item, { titleFontSize: '20' });
        const titleLink = screen.getByText('Test Story');
        expect(titleLink).toHaveStyle({ fontSize: '20px' });
    });

    it('applies listSpacing from settings as inline style', () => {
        const item = createStory();
        const { container } = renderItemRow(item, { listSpacing: '10' });
        const root = container.querySelector('.item-row');
        expect(root).toHaveStyle({ marginBottom: '10px' });
    });

    it('renders domain text when item has domain', () => {
        const item = createStory({ domain: 'example.com' });
        renderItemRow(item);
        expect(screen.getByText('(example.com)')).toBeInTheDocument();
    });

    it('does not render domain when item has no domain', () => {
        const item = createStory({ domain: '' });
        renderItemRow(item);
        expect(screen.queryByText(/\(.*\)/)).not.toBeInTheDocument();
    });

    it('uses formatCommentCount for comment display', () => {
        const item = createStory({ comments_count: 0 });
        renderItemRow(item);
        // formatCommentCount(0) returns 'discuss'
        expect(screen.getAllByText('discuss').length).toBeGreaterThanOrEqual(1);
    });

    it('adds target="_blank" and rel="noopener" when openLinkInNewTab is true', () => {
        const item = createStory({ url: 'https://example.com/article' });
        renderItemRow(item, { openLinkInNewTab: true });
        const link = screen.getByText('Test Story');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener');
    });

    it('does not add target="_blank" when openLinkInNewTab is false', () => {
        const item = createStory({ url: 'https://example.com/article' });
        renderItemRow(item, { openLinkInNewTab: false });
        const link = screen.getByText('Test Story');
        expect(link).not.toHaveAttribute('target');
    });

    it('shows time_ago text', () => {
        const item = createStory({ time_ago: '3 hours ago' });
        renderItemRow(item);
        expect(screen.getAllByText('3 hours ago').length).toBeGreaterThanOrEqual(1);
    });
});
