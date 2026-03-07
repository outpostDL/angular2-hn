import { useParams } from 'react-router-dom';

interface FeedPageProps {
    feedType: string;
}

function FeedPage({ feedType }: FeedPageProps) {
    const { page } = useParams<{ page: string }>();

    return (
        <div className="feed-page">
            <p>
                Feed: {feedType}, Page: {page}
            </p>
        </div>
    );
}

export default FeedPage;
