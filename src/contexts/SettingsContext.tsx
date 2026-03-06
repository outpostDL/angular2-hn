import React, { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

// ── State shape (matches Angular Settings interface) ──

export interface SettingsState {
    showSettings: boolean;
    openLinkInNewTab: boolean;
    theme: string;
    titleFontSize: string;
    listSpacing: string;
}

// ── Internal state includes a flag for user-explicit theme choice ──

interface InternalState extends SettingsState {
    /** True when the user (or localStorage) has explicitly chosen a theme */
    _userSetTheme: boolean;
}

// ── Actions ──

type SettingsAction =
    | { type: 'TOGGLE_SETTINGS' }
    | { type: 'TOGGLE_OPEN_LINKS_IN_NEW_TAB' }
    | { type: 'SET_THEME'; payload: string }
    | { type: 'SET_SYSTEM_THEME'; payload: string }
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

function readInitialState(): InternalState {
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
        _userSetTheme: savedTheme !== null,
    };
}

// ── Reducer (pure — no side effects) ──

function settingsReducer(state: InternalState, action: SettingsAction): InternalState {
    switch (action.type) {
        case 'TOGGLE_SETTINGS':
            return { ...state, showSettings: !state.showSettings };

        case 'TOGGLE_OPEN_LINKS_IN_NEW_TAB':
            return { ...state, openLinkInNewTab: !state.openLinkInNewTab };

        case 'SET_THEME':
            return { ...state, theme: action.payload, _userSetTheme: true };

        case 'SET_SYSTEM_THEME':
            // Only apply system theme when user hasn't explicitly chosen one
            if (state._userSetTheme) {
                return state;
            }
            return { ...state, theme: action.payload };

        case 'SET_FONT':
            return { ...state, titleFontSize: action.payload };

        case 'SET_SPACING':
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
    const prevStateRef = useRef(state);

    // ── Persist to localStorage via useEffect (keeps reducer pure) ──
    useEffect(() => {
        const prev = prevStateRef.current;
        if (prev.openLinkInNewTab !== state.openLinkInNewTab) {
            localStorage.setItem('openLinkInNewTab', JSON.stringify(state.openLinkInNewTab));
        }
        // Only persist theme when user explicitly set it
        if (prev.theme !== state.theme && state._userSetTheme) {
            localStorage.setItem('theme', state.theme);
        }
        if (prev.titleFontSize !== state.titleFontSize) {
            localStorage.setItem('titleFontSize', state.titleFontSize);
        }
        if (prev.listSpacing !== state.listSpacing) {
            localStorage.setItem('listSpacing', state.listSpacing);
        }
        prevStateRef.current = state;
    }, [state.openLinkInNewTab, state.theme, state.titleFontSize, state.listSpacing, state._userSetTheme]);

    // ── System dark mode listener ──
    useEffect(() => {
        const mql = window.matchMedia('(prefers-color-scheme: dark)');

        const handler = (event: MediaQueryListEvent) => {
            dispatch({ type: 'SET_SYSTEM_THEME', payload: event.matches ? 'night' : 'default' });
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
            showSettings: state.showSettings,
            openLinkInNewTab: state.openLinkInNewTab,
            theme: state.theme,
            titleFontSize: state.titleFontSize,
            listSpacing: state.listSpacing,
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
