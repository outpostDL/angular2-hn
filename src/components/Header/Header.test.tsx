import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Header from './Header';
import { SettingsContext, SettingsContextValue } from '../../contexts/SettingsContext';

function renderWithProviders(ui: React.ReactElement, { route = '/' }: { route?: string } = {}) {
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
    };

    return {
        mockSettings,
        ...render(
            <SettingsContext.Provider value={mockSettings}>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </SettingsContext.Provider>
        ),
    };
}

describe('Header', () => {
    it('renders all 4 nav links', () => {
        renderWithProviders(<Header />);
        expect(screen.getByText('new')).toBeInTheDocument();
        expect(screen.getByText('show')).toBeInTheDocument();
        expect(screen.getByText('ask')).toBeInTheDocument();
        expect(screen.getByText('jobs')).toBeInTheDocument();
    });

    it('nav links point to correct routes', () => {
        renderWithProviders(<Header />);
        expect(screen.getByText('new').closest('a')).toHaveAttribute('href', '/newest/1');
        expect(screen.getByText('show').closest('a')).toHaveAttribute('href', '/show/1');
        expect(screen.getByText('ask').closest('a')).toHaveAttribute('href', '/ask/1');
        expect(screen.getByText('jobs').closest('a')).toHaveAttribute('href', '/jobs/1');
    });

    it('renders the logo linking to /news/1', () => {
        renderWithProviders(<Header />);
        const logo = screen.getByAltText('Logo');
        expect(logo).toBeInTheDocument();
        const homeLink = logo.closest('a');
        expect(homeLink).toHaveAttribute('href', '/news/1');
    });

    it('active class applied to "new" when on /newest path', () => {
        renderWithProviders(<Header />, { route: '/newest/1' });
        const newLink = screen.getByText('new').closest('a');
        expect(newLink).toHaveClass('active');
    });

    it('active class applied to "new" when on /newest/2 (page prefix match)', () => {
        renderWithProviders(<Header />, { route: '/newest/2' });
        const newLink = screen.getByText('new').closest('a');
        expect(newLink).toHaveClass('active');
    });

    it('active class applied to "show" when on /show path', () => {
        renderWithProviders(<Header />, { route: '/show/1' });
        const showLink = screen.getByText('show').closest('a');
        expect(showLink).toHaveClass('active');
    });

    it('active class applied to "ask" when on /ask path', () => {
        renderWithProviders(<Header />, { route: '/ask/1' });
        const askLink = screen.getByText('ask').closest('a');
        expect(askLink).toHaveClass('active');
    });

    it('active class applied to "jobs" when on /jobs path', () => {
        renderWithProviders(<Header />, { route: '/jobs/1' });
        const jobsLink = screen.getByText('jobs').closest('a');
        expect(jobsLink).toHaveClass('active');
    });

    it('settings toggle calls context toggleSettings', () => {
        const { mockSettings } = renderWithProviders(<Header />);
        const settingsIcon = screen.getByAltText('Settings');
        fireEvent.click(settingsIcon);
        expect(mockSettings.toggleSettings).toHaveBeenCalledTimes(1);
    });

    it('renders Settings component when showSettings is true', () => {
        const mockSettings: SettingsContextValue = {
            showSettings: true,
            openLinkInNewTab: false,
            theme: 'default',
            titleFontSize: '16',
            listSpacing: '0',
            toggleSettings: vi.fn(),
            toggleOpenLinksInNewTab: vi.fn(),
            setTheme: vi.fn(),
            setFont: vi.fn(),
            setSpacing: vi.fn(),
        };

        render(
            <SettingsContext.Provider value={mockSettings}>
                <MemoryRouter>
                    <Header />
                </MemoryRouter>
            </SettingsContext.Provider>
        );

        expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('does not render Settings component when showSettings is false', () => {
        renderWithProviders(<Header />);
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
    });
});
