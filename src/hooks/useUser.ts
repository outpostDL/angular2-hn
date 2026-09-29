import { useState, useEffect } from 'react';
import { User } from '../types';
import { fetchUser as apiFetchUser } from '../services/hackernews-api';

interface UseUserResult {
    user: User | null;
    error: string | null;
    loading: boolean;
}

export function useUser(id: string): UseUserResult {
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);
        setUser(null);

        apiFetchUser(id)
            .then((data) => {
                if (!cancelled) {
                    setUser(data);
                    setLoading(false);
                }
            })
            .catch((err: Error) => {
                if (!cancelled) {
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    return { user, error, loading };
}
