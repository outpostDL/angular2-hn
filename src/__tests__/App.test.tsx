import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import { SettingsContext, SettingsContextValue } from '../contexts/SettingsContext';

// Mock the useFeed hook so FeedPage doesn't make API calls
vi.mock('../hooks/useFeed', () => ({
    useFeed: vi.fn(() => ({ items: [], error: null, loading: true })),
}));

function renderApp(route = '/', settingsOverrides: Partial<SettingsContextValue> = {}) {
    const mockSettings: SettingsContextValue = {
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
        ...settingsOverrides,
    };

    return {
        mockSettings,
        ...render(
            <SettingsContext.Provider value={mockSettings}>
                <MemoryRouter initialEntries={[route]}>
                    <App />
                </MemoryRouter>
            </SettingsContext.Provider>
        ),
    };
}

describe('App', () => {
    it('renders the header with nav links', () => {
        renderApp();
        expect(screen.getByText('new')).toBeInTheDocument();
        expect(screen.getByText('show')).toBeInTheDocument();
        expect(screen.getByText('ask')).toBeInTheDocument();
        expect(screen.getByText('jobs')).toBeInTheDocument();
    });

    it('renders the footer with GitHub link', () => {
        renderApp();
        expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
    });

    it('applies the theme class from settings context', () => {
        const { container } = renderApp('/', { theme: 'night' });
        const themeDiv = container.firstChild as HTMLElement;
        expect(themeDiv).toHaveClass('night');
    });

    it('renders body-cover div', () => {
        const { container } = renderApp();
        expect(container.querySelector('.body-cover')).toBeInTheDocument();
    });

    it('renders wrapper div', () => {
        const { container } = renderApp();
        expect(container.querySelector('.wrapper')).toBeInTheDocument();
    });

    it('redirects / to /news/1 and renders FeedPage (shows Loader while loading)', () => {
        renderApp('/');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders FeedPage for /news/:page route', () => {
        renderApp('/news/2');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders FeedPage for /newest/:page route', () => {
        renderApp('/newest/1');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders FeedPage for /show/:page route', () => {
        renderApp('/show/1');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders FeedPage for /ask/:page route', () => {
        renderApp('/ask/1');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders FeedPage for /jobs/:page route', () => {
        renderApp('/jobs/1');
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
});
