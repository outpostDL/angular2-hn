import React, { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';

// ── State shape (matches Angular Settings interface) ──

export interface SettingsState {
    showSettings: boolean;
    openLinkInNewTab: boolean;
    theme: string;
    titleFontSize: string;
    listSpacing: string;
}

// ── Actions ──

type SettingsAction =
    | { type: 'TOGGLE_SETTINGS' }
    | { type: 'TOGGLE_OPEN_LINKS_IN_NEW_TAB' }
    | { type: 'SET_THEME'; payload: string }
    | { type: 'SET_FONT'; payload: string }
    | { type: 'SET_SPACING'; payload: string };

// ── Context value type ──

export interface SettingsContextValue extends SettingsState {
    toggleSettings: () => void;
    toggleOpenLinksInNewTab: () => void;
    setTheme: (theme: string) => void;
    setFont: (fontSize: string) => void;
    setSpacing: (spacing: string) => void;
}

// ── Helpers ──

function readInitialState(): SettingsState {
    const savedOpenLinkInNewTab = localStorage.getItem('openLinkInNewTab');
    const savedTheme = localStorage.getItem('theme');
    const savedTitleFontSize = localStorage.getItem('titleFontSize');
    const savedListSpacing = localStorage.getItem('listSpacing');

    let theme: string;
    if (savedTheme) {
        theme = savedTheme;
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'night' : 'default';
    }

    return {
        showSettings: false,
        openLinkInNewTab: savedOpenLinkInNewTab ? JSON.parse(savedOpenLinkInNewTab) : false,
        theme,
        titleFontSize: savedTitleFontSize ?? '16',
        listSpacing: savedListSpacing ?? '0',
    };
}

// ── Reducer ──

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
    switch (action.type) {
        case 'TOGGLE_SETTINGS':
            return { ...state, showSettings: !state.showSettings };

        case 'TOGGLE_OPEN_LINKS_IN_NEW_TAB': {
            const newVal = !state.openLinkInNewTab;
            localStorage.setItem('openLinkInNewTab', JSON.stringify(newVal));
            return { ...state, openLinkInNewTab: newVal };
        }

        case 'SET_THEME':
            localStorage.setItem('theme', action.payload);
            return { ...state, theme: action.payload };

        case 'SET_FONT':
            localStorage.setItem('titleFontSize', action.payload);
            return { ...state, titleFontSize: action.payload };

        case 'SET_SPACING':
            localStorage.setItem('listSpacing', action.payload);
            return { ...state, listSpacing: action.payload };

        default:
            return state;
    }
}

// ── Context ──

export const SettingsContext = createContext<SettingsContextValue | null>(null);

// ── Provider ──

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(settingsReducer, undefined, readInitialState);

    // ── System dark mode listener ──
    useEffect(() => {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');

        const handler = (event: MediaQueryListEvent) => {
            dispatch({ type: 'SET_THEME', payload: event.matches ? 'night' : 'default' });
        };

        mql.addEventListener('change', handler);

        return () => {
            mql.removeEventListener('change', handler);
        };
    }, []);

    // ── Action creators ──
    const toggleSettings = useCallback(() => dispatch({ type: 'TOGGLE_SETTINGS' }), []);
    const toggleOpenLinksInNewTab = useCallback(() => dispatch({ type: 'TOGGLE_OPEN_LINKS_IN_NEW_TAB' }), []);
    const setTheme = useCallback((theme: string) => dispatch({ type: 'SET_THEME', payload: theme }), []);
    const setFont = useCallback((fontSize: string) => dispatch({ type: 'SET_FONT', payload: fontSize }), []);
    const setSpacing = useCallback((spacing: string) => dispatch({ type: 'SET_SPACING', payload: spacing }), []);

    const value = useMemo<SettingsContextValue>(
        () => ({
            ...state,
            toggleSettings,
            toggleOpenLinksInNewTab,
            setTheme,
            setFont,
            setSpacing,
        }),
        [state, toggleSettings, toggleOpenLinksInNewTab, setTheme, setFont, setSpacing]
    );

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
