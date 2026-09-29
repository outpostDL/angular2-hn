import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useItemContent } from '../../hooks/useItemContent';
import { useSettings } from '../../hooks/useSettings';
import { formatCommentCount } from '../../utils/format-comment-count';
import Loader from '../../components/Loader/Loader';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import Comment from '../../components/Comment/Comment';
import './ItemDetailsPage.scss';

function ItemDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { item, error, loading } = useItemContent(Number(id));
    const { openLinkInNewTab } = useSettings();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const hasUrl = item ? item.url?.indexOf('http') === 0 : false;

    const titleLink = () => {
        if (!item) return null;
        if (hasUrl) {
            return (
                <a
                    className="title"
                    href={item.url}
                    target={openLinkInNewTab ? '_blank' : undefined}
                    rel={openLinkInNewTab ? 'noopener' : undefined}
                >
                    {item.title}
                </a>
            );
        }
        return (
            <Link className="title" to={`/item/${item.id}`}>
                {item.title}
            </Link>
        );
    };

    if (loading) {
        return (
            <div className="item-details-page">
                <div className="main-content">
                    <Loader />
                </div>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="item-details-page">
                <div className="main-content">
                    <ErrorMessage message="Could not load item comments." />
                </div>
            </div>
        );
    }

    return (
        <div className="item-details-page">
            <div className="main-content">
                <div className="item">
                    {/* Mobile layout */}
                    <div className="mobile item-header">
                        <p className="title-block">
                            <span className="back-button" onClick={() => window.history.back()} />
                            {titleLink()}
                        </p>
                    </div>

                    {/* Laptop layout */}
                    <div
                        className={`laptop${item.comments_count > 0 || item.type === 'job' ? ' item-header' : ''}${item.content ? ' head-margin' : ''}`}
                    >
                        {hasUrl ? (
                            <p>
                                {titleLink()}
                                {item.domain && <span className="domain"> ({item.domain})</span>}
                            </p>
                        ) : (
                            <p>{titleLink()}</p>
                        )}
                        <div className="subtext">
                            {item.type !== 'job' && (
                                <span>
                                    {item.points} points by{' '}
                                    <Link to={`/user/${item.user}`}>{item.user}</Link>
                                </span>
                            )}
                            <span className={item.type !== 'job' ? 'item-details' : ''}>
                                {item.time_ago}
                                {item.type !== 'job' && (
                                    <span>
                                        {' '}
                                        |{' '}
                                        <Link to={`/item/${item.id}`}>
                                            {formatCommentCount(item.comments_count)}
                                        </Link>
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Poll results */}
                    {item.type === 'poll' && item.poll && (
                        <div className="pollResults">
                            {item.poll.map((pollResult, index) => (
                                <div key={index} className="pollContent">
                                    <div dangerouslySetInnerHTML={{ __html: pollResult.content }} />
                                    <div className="subtext">{pollResult.points} points</div>
                                    <div
                                        className="pollBar"
                                        style={{
                                            width: `${item.poll_votes_count > 0 ? (pollResult.points / item.poll_votes_count) * 100 : 0}%`,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Item text content */}
                    {item.content && (
                        <p className="subject" dangerouslySetInnerHTML={{ __html: item.content }} />
                    )}

                    {/* Comment list */}
                    <ul className="comment-list">
                        {item.comments?.map((comment) => (
                            <li key={comment.id}>
                                <Comment comment={comment} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default ItemDetailsPage;
