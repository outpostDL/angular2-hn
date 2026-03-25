import React, { createContext, useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

// ── Types ──

export interface MockUser {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    user: MockUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

export interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    signup: (email: string, password: string, name: string) => Promise<void>;
}

// ── Actions ──

type AuthAction =
    | { type: 'LOGIN_START' }
    | { type: 'LOGIN_SUCCESS'; payload: MockUser }
    | { type: 'LOGIN_FAILURE' }
    | { type: 'LOGOUT' }
    | { type: 'SIGNUP_SUCCESS'; payload: MockUser }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'RESTORE_AUTH'; payload: MockUser };

// ── Constants ──

const STORAGE_KEY = 'mockAuth';
const USERS_STORAGE_KEY = 'mockUsers';
const HARDCODED_EMAIL = 'test@test.com';
const HARDCODED_PASSWORD = 'password';
const LOGIN_DELAY_MS = 500;

// ── Helpers ──

function readInitialState(): AuthState {
    return {
        user: null,
        isAuthenticated: false,
        isLoading: true,
    };
}

function getStoredUsers(): Array<{ email: string; password: string; user: MockUser }> {
    try {
        const raw = localStorage.getItem(USERS_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function storeUser(email: string, password: string, user: MockUser): void {
    const users = getStoredUsers();
    users.push({ email, password, user });
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

// ── Reducer (pure — no side effects) ──

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'LOGIN_START':
            return { ...state, isLoading: true };

        case 'LOGIN_SUCCESS':
            return { user: action.payload, isAuthenticated: true, isLoading: false };

        case 'LOGIN_FAILURE':
            return { user: null, isAuthenticated: false, isLoading: false };

        case 'LOGOUT':
            return { user: null, isAuthenticated: false, isLoading: false };

        case 'SIGNUP_SUCCESS':
            return { user: action.payload, isAuthenticated: true, isLoading: false };

        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };

        case 'RESTORE_AUTH':
            return { user: action.payload, isAuthenticated: true, isLoading: false };

        default:
            return state;
    }
}

// ── Context ──

export const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(authReducer, undefined, readInitialState);
    const prevStateRef = useRef(state);

    // ── Restore auth from localStorage on mount ──
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved: { user: MockUser } = JSON.parse(raw);
                if (saved.user) {
                    dispatch({ type: 'RESTORE_AUTH', payload: saved.user });
                    return;
                }
            }
        } catch {
            // Corrupted data — fall through to clear loading
        }
        dispatch({ type: 'SET_LOADING', payload: false });
    }, []);

    // ── Persist to localStorage via useEffect (keeps reducer pure) ──
    useEffect(() => {
        const prev = prevStateRef.current;
        if (prev.user !== state.user || prev.isAuthenticated !== state.isAuthenticated) {
            if (state.isAuthenticated && state.user) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: state.user }));
            } else if (!state.isAuthenticated) {
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        prevStateRef.current = state;
    }, [state.user, state.isAuthenticated]);

    // ── Action creators ──

    const login = useCallback(async (email: string, password: string): Promise<void> => {
        dispatch({ type: 'LOGIN_START' });

        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS));

        // Check hardcoded credentials
        if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
            const user: MockUser = { id: '1', email: HARDCODED_EMAIL, name: 'Test User' };
            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
            return;
        }

        // Check signup'd users in localStorage
        const storedUsers = getStoredUsers();
        const found = storedUsers.find((u) => u.email === email && u.password === password);
        if (found) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: found.user });
            return;
        }

        dispatch({ type: 'LOGIN_FAILURE' });
        throw new Error('Invalid email or password');
    }, []);

    const logout = useCallback((): void => {
        dispatch({ type: 'LOGOUT' });
    }, []);

    const signup = useCallback(async (email: string, password: string, name: string): Promise<void> => {
        dispatch({ type: 'LOGIN_START' });

        // Simulate async delay
        await new Promise((resolve) => setTimeout(resolve, LOGIN_DELAY_MS));

        const user: MockUser = {
            id: crypto.randomUUID(),
            email,
            name,
        };

        storeUser(email, password, user);
        dispatch({ type: 'SIGNUP_SUCCESS', payload: user });
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            isLoading: state.isLoading,
            login,
            logout,
            signup,
        }),
        [state, login, logout, signup]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
