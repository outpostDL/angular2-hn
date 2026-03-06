import { useState, useEffect } from 'react';
import { Story } from '../types';
import { fetchFeed as apiFetchFeed } from '../services/hackernews-api';

interface UseFeedResult {
    items: Story[];
    error: string | null;
    loading: boolean;
}

export function useFeed(type: string, page: number): UseFeedResult {
    const [items, setItems] = useState<Story[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);
        setItems([]);

        apiFetchFeed(type, page)
            .then((data) => {
                if (!cancelled) {
                    setItems(data);
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
    }, [type, page]);

    return { items, error, loading };
}
