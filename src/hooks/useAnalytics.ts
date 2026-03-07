import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
    interface Window {
        ga?: (...args: unknown[]) => void;
    }
}

/**
 * Sends a Google Analytics pageview on every route change.
 * Mirrors the Angular version's NavigationEnd behavior:
 * fires after the route resolves (useLocation updates after navigation completes).
 */
export function useAnalytics(): void {
    const location = useLocation();

    useEffect(() => {
        if (typeof window.ga === 'function') {
            window.ga('set', 'page', location.pathname);
            window.ga('send', 'pageview');
        }
    }, [location.pathname]);
}
