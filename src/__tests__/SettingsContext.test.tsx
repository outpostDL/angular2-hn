import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

import { SettingsProvider } from '../contexts/SettingsContext';
import { useSettings } from '../hooks/useSettings';

// Helper component that exposes settings via data-testid attributes
function SettingsConsumer() {
    const {
        showSettings,
        openLinkInNewTab,
        theme,
        titleFontSize,
        listSpacing,
        toggleSettings,
        toggleOpenLinksInNewTab,
        setTheme,
        setFont,
        setSpacing,
    } = useSettings();

    return (
        <div>
            <span data-testid="showSettings">{String(showSettings)}</span>
            <span data-testid="openLinkInNewTab">{String(openLinkInNewTab)}</span>
            <span data-testid="theme">{theme}</span>
            <span data-testid="titleFontSize">{titleFontSize}</span>
            <span data-testid="listSpacing">{listSpacing}</span>
            <button data-testid="toggleSettings" onClick={toggleSettings}>
                toggleSettings
            </button>
            <button data-testid="toggleOpenLinksInNewTab" onClick={toggleOpenLinksInNewTab}>
                toggleOpenLinksInNewTab
            </button>
            <button data-testid="setThemeNight" onClick={() => setTheme('night')}>
                setThemeNight
            </button>
            <button data-testid="setFont20" onClick={() => setFont('20')}>
                setFont20
            </button>
            <button data-testid="setSpacing10" onClick={() => setSpacing('10')}>
                setSpacing10
            </button>
        </div>
    );
}

// Mock matchMedia
function createMatchMediaMock(matches: boolean) {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    const mql = {
        matches,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === 'change') listeners.push(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: (e: MediaQueryListEvent) => void) => {
            if (event === 'change') {
                const idx = listeners.indexOf(cb);
                if (idx !== -1) listeners.splice(idx, 1);
            }
        }),
        dispatchEvent: vi.fn(),
        _listeners: listeners,
        _fire(newMatches: boolean) {
            const event = new Event('change') as MediaQueryListEvent;
            Object.defineProperty(event, 'matches', { value: newMatches });
            Object.defineProperty(event, 'media', { value: '(prefers-color-scheme: dark)' });
            listeners.forEach((cb) => cb(event));
        },
    };
    return mql;
}

describe('SettingsContext + useSettings', () => {
    let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

    beforeEach(() => {
        localStorage.clear();
        matchMediaMock = createMatchMediaMock(false);
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue(matchMediaMock)
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ── 1. Initial defaults when no localStorage values ──
    it('provides correct default values when localStorage is empty', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('showSettings').textContent).toBe('false');
        expect(screen.getByTestId('openLinkInNewTab').textContent).toBe('false');
        expect(screen.getByTestId('theme').textContent).toBe('default');
        expect(screen.getByTestId('titleFontSize').textContent).toBe('16');
        expect(screen.getByTestId('listSpacing').textContent).toBe('0');
    });

    // ── 2. Reads persisted values from localStorage on mount ──
    it('reads persisted values from localStorage on mount', () => {
        localStorage.setItem('openLinkInNewTab', JSON.stringify(true));
        localStorage.setItem('theme', 'night');
        localStorage.setItem('titleFontSize', '20');
        localStorage.setItem('listSpacing', '5');

        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('openLinkInNewTab').textContent).toBe('true');
        expect(screen.getByTestId('theme').textContent).toBe('night');
        expect(screen.getByTestId('titleFontSize').textContent).toBe('20');
        expect(screen.getByTestId('listSpacing').textContent).toBe('5');
    });

    // ── 3. toggleSettings updates showSettings ──
    it('toggleSettings toggles showSettings boolean', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('showSettings').textContent).toBe('false');

        act(() => {
            screen.getByTestId('toggleSettings').click();
        });

        expect(screen.getByTestId('showSettings').textContent).toBe('true');

        act(() => {
            screen.getByTestId('toggleSettings').click();
        });

        expect(screen.getByTestId('showSettings').textContent).toBe('false');
    });

    // ── 4. toggleOpenLinksInNewTab updates state and persists ──
    it('toggleOpenLinksInNewTab toggles and persists to localStorage', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('openLinkInNewTab').textContent).toBe('false');

        act(() => {
            screen.getByTestId('toggleOpenLinksInNewTab').click();
        });

        expect(screen.getByTestId('openLinkInNewTab').textContent).toBe('true');
        expect(JSON.parse(localStorage.getItem('openLinkInNewTab')!)).toBe(true);

        act(() => {
            screen.getByTestId('toggleOpenLinksInNewTab').click();
        });

        expect(screen.getByTestId('openLinkInNewTab').textContent).toBe('false');
        expect(JSON.parse(localStorage.getItem('openLinkInNewTab')!)).toBe(false);
    });

    // ── 5. setTheme updates state and persists ──
    it('setTheme updates theme and persists to localStorage', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        act(() => {
            screen.getByTestId('setThemeNight').click();
        });

        expect(screen.getByTestId('theme').textContent).toBe('night');
        expect(localStorage.getItem('theme')).toBe('night');
    });

    // ── 6. setFont updates state and persists ──
    it('setFont updates titleFontSize and persists to localStorage', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        act(() => {
            screen.getByTestId('setFont20').click();
        });

        expect(screen.getByTestId('titleFontSize').textContent).toBe('20');
        expect(localStorage.getItem('titleFontSize')).toBe('20');
    });

    // ── 7. setSpacing updates state and persists ──
    it('setSpacing updates listSpacing and persists to localStorage', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        act(() => {
            screen.getByTestId('setSpacing10').click();
        });

        expect(screen.getByTestId('listSpacing').textContent).toBe('10');
        expect(localStorage.getItem('listSpacing')).toBe('10');
    });

    // ── 8. Dark mode detection: sets theme to 'night' when system prefers dark ──
    it('sets theme to night when system prefers dark and no saved theme', () => {
        matchMediaMock = createMatchMediaMock(true);
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue(matchMediaMock)
        );

        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('theme').textContent).toBe('night');
    });

    // ── 9. Dark mode detection: saved theme takes precedence over system preference ──
    it('uses saved theme from localStorage even when system prefers dark', () => {
        matchMediaMock = createMatchMediaMock(true);
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockReturnValue(matchMediaMock)
        );
        localStorage.setItem('theme', 'amoledblack');

        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('theme').textContent).toBe('amoledblack');
    });

    // ── 10. System dark mode change event updates theme when no saved theme ──
    it('responds to system dark mode change events when no saved theme', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(screen.getByTestId('theme').textContent).toBe('default');

        // Simulate system switching to dark mode
        act(() => {
            matchMediaMock._fire(true);
        });

        expect(screen.getByTestId('theme').textContent).toBe('night');

        // Simulate system switching back to light mode
        act(() => {
            matchMediaMock._fire(false);
        });

        expect(screen.getByTestId('theme').textContent).toBe('default');
    });

    // ── 13. System dark mode change does NOT override user-chosen theme ──
    it('does not override user-chosen theme when system dark mode changes', () => {
        render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        // User explicitly sets a theme
        act(() => {
            screen.getByTestId('setThemeNight').click();
        });

        expect(screen.getByTestId('theme').textContent).toBe('night');
        expect(localStorage.getItem('theme')).toBe('night');

        // System switches to light mode — should NOT override user's choice
        act(() => {
            matchMediaMock._fire(false);
        });

        expect(screen.getByTestId('theme').textContent).toBe('night');
    });

    // ── 11. Cleanup removes matchMedia listener on unmount ──
    it('removes matchMedia event listener on unmount', () => {
        const { unmount } = render(
            <SettingsProvider>
                <SettingsConsumer />
            </SettingsProvider>
        );

        expect(matchMediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

        unmount();

        expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    // ── 12. useSettings throws when used outside SettingsProvider ──
    it('throws an error when useSettings is used outside SettingsProvider', () => {
        // Suppress console.error for this test since React will log the error
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            render(<SettingsConsumer />);
        }).toThrow('useSettings must be used within a SettingsProvider');

        consoleSpy.mockRestore();
    });
});
