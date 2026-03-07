import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFeed } from '../../hooks/useFeed';
import Loader from '../../components/Loader/Loader';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import ItemRow from '../../components/ItemRow/ItemRow';
import './FeedPage.scss';

interface FeedPageProps {
    feedType: string;
}

function FeedPage({ feedType }: FeedPageProps) {
    const { page } = useParams<{ page: string }>();
    const pageNum = page ? parseInt(page, 10) : 1;
    const { items, error, loading } = useFeed(feedType, pageNum);
    const listStart = (pageNum - 1) * 30 + 1;

    useEffect(() => {
        if (!loading && !error && items.length > 0) {
            window.scrollTo(0, 0);
        }
    }, [items, loading, error]);

    return (
        <div className="main-content feed-page">
            {loading && !error && <Loader />}
            {!loading && error && (
                <ErrorMessage message={`Could not load ${feedType} stories.`} />
            )}
            {!loading && !error && items.length > 0 && (
                <div>
                    {feedType === 'jobs' && (
                        <p className="job-header">
                            These are jobs at startups that were funded by Y Combinator. You can
                            also get a job at a YC startup through{' '}
                            <a href="https://triplebyte.com/?ref=yc_jobs">Triplebyte</a>.
                        </p>
                    )}
                    <ol
                        className={feedType !== 'jobs' ? 'list-margin' : ''}
                        start={listStart}
                    >
                        {items.map((item) => (
                            <li key={item.id} className="post">
                                <ItemRow item={item} />
                            </li>
                        ))}
                    </ol>
                    <div className="nav">
                        {pageNum > 1 && (
                            <Link
                                to={`/${feedType}/${pageNum - 1}`}
                                className="prev"
                            >
                                &#8249; Prev
                            </Link>
                        )}
                        {items.length === 30 && (
                            <Link
                                to={`/${feedType}/${pageNum + 1}`}
                                className="more"
                            >
                                More &#8250;
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default FeedPage;
