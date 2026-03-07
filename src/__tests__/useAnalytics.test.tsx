import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnalytics } from '../hooks/useAnalytics';
import { useEffect } from 'react';

// A simple component that calls the hook
function AnalyticsConsumer() {
    useAnalytics();
    return null;
}

// Component that navigates to a given path on mount
function NavigateTo({ path }: { path: string }) {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(path);
    }, [navigate, path]);
    return null;
}

describe('useAnalytics', () => {
    let gaSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        gaSpy = vi.fn();
        window.ga = gaSpy;
    });

    afterEach(() => {
        delete window.ga;
    });

    it('fires ga pageview on initial render with the current path', () => {
        render(
            <MemoryRouter initialEntries={['/news/1']}>
                <AnalyticsConsumer />
                <Routes>
                    <Route path="/news/:page" element={<div>News Page</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/news/1');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');
    });

    it('fires ga pageview when navigating to a different route', () => {
        render(
            <MemoryRouter initialEntries={['/news/1']}>
                <AnalyticsConsumer />
                <NavigateTo path="/show/1" />
                <Routes>
                    <Route path="/news/:page" element={<div>News</div>} />
                    <Route path="/show/:page" element={<div>Show</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/show/1');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');
    });

    it('fires ga pageview for each navigation in sequence', () => {
        // Start at /news/1, then navigate to /item/123
        const { unmount } = render(
            <MemoryRouter initialEntries={['/news/1']}>
                <AnalyticsConsumer />
                <NavigateTo path="/item/123" />
                <Routes>
                    <Route path="/news/:page" element={<div>News</div>} />
                    <Route path="/item/:id" element={<div>Item</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/item/123');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');

        unmount();
        gaSpy.mockClear();

        // Separate render: navigate to /user/pg
        render(
            <MemoryRouter initialEntries={['/news/1']}>
                <AnalyticsConsumer />
                <NavigateTo path="/user/pg" />
                <Routes>
                    <Route path="/news/:page" element={<div>News</div>} />
                    <Route path="/user/:id" element={<div>User</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/user/pg');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');
    });

    it('does not throw when window.ga is not defined', () => {
        delete window.ga;

        expect(() => {
            render(
                <MemoryRouter initialEntries={['/news/1']}>
                    <AnalyticsConsumer />
                    <Routes>
                        <Route path="/news/:page" element={<div>News</div>} />
                    </Routes>
                </MemoryRouter>
            );
        }).not.toThrow();
    });

    it('calls ga with correct arguments (set then send, in order)', () => {
        render(
            <MemoryRouter initialEntries={['/show/1']}>
                <AnalyticsConsumer />
                <Routes>
                    <Route path="/show/:page" element={<div>Show</div>} />
                </Routes>
            </MemoryRouter>
        );

        // Verify call order: 'set' before 'send'
        expect(gaSpy.mock.calls[0]).toEqual(['set', 'page', '/show/1']);
        expect(gaSpy.mock.calls[1]).toEqual(['send', 'pageview']);
    });

    it('tracks the correct path for item detail routes', () => {
        render(
            <MemoryRouter initialEntries={['/item/42']}>
                <AnalyticsConsumer />
                <Routes>
                    <Route path="/item/:id" element={<div>Item Details</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/item/42');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');
    });

    it('tracks the correct path for user profile routes', () => {
        render(
            <MemoryRouter initialEntries={['/user/pg']}>
                <AnalyticsConsumer />
                <Routes>
                    <Route path="/user/:id" element={<div>User Profile</div>} />
                </Routes>
            </MemoryRouter>
        );

        expect(gaSpy).toHaveBeenCalledWith('set', 'page', '/user/pg');
        expect(gaSpy).toHaveBeenCalledWith('send', 'pageview');
    });
});
