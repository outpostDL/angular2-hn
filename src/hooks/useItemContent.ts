import { useState, useEffect } from 'react';
import { Story } from '../types';
import { fetchItemContent as apiFetchItemContent } from '../services/hackernews-api';

interface UseItemContentResult {
    item: Story | null;
    error: string | null;
    loading: boolean;
}

export function useItemContent(id: number): UseItemContentResult {
    const [item, setItem] = useState<Story | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);
        setItem(null);

        apiFetchItemContent(id)
            .then((data) => {
                if (!cancelled) {
                    setItem(data);
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

    return { item, error, loading };
}
