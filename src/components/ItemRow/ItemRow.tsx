import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { Story } from '../../types';
import { formatCommentCount } from '../../utils/format-comment-count';
import './ItemRow.scss';

interface ItemRowProps {
    item: Story;
}

function ItemRow({ item }: ItemRowProps) {
    const { openLinkInNewTab, titleFontSize, listSpacing } = useSettings();

    const hasUrl = item.url.indexOf('http') === 0;
    const isJob = item.type === 'job';

    const titleStyle = { fontSize: `${titleFontSize}px` };

    return (
        <div className="item-row" style={{ marginBottom: `${listSpacing}px` }}>
            {hasUrl ? (
                <p>
                    <a
                        className="title"
                        style={titleStyle}
                        href={item.url}
                        {...(openLinkInNewTab ? { target: '_blank', rel: 'noopener' } : {})}
                    >
                        {item.title}
                    </a>
                    {item.domain && <span className="domain">({item.domain})</span>}
                </p>
            ) : (
                <p>
                    <Link className="title" style={titleStyle} to={`/item/${item.id}`}>
                        {item.title}
                    </Link>
                </p>
            )}
            <div className="subtext-palm">
                {!isJob && (
                    <div className="details">
                        <span className="name">
                            <Link to={`/user/${item.user}`}>{item.user}</Link>
                        </span>
                        <span className="right">{item.points} &#9733;</span>
                    </div>
                )}
                <div className="details">
                    {item.time_ago}
                    {!isJob && (
                        <Link to={`/item/${item.id}`} className="comment-number">
                            {' '}
                            &bull; {formatCommentCount(item.comments_count)}
                        </Link>
                    )}
                </div>
            </div>
            <div className="subtext-laptop">
                {!isJob && (
                    <span>
                        {item.points} points by{' '}
                        <Link to={`/user/${item.user}`}>{item.user}</Link>
                    </span>
                )}
                <span className={!isJob ? 'item-details' : ''}>
                    {item.time_ago}
                    {!isJob && (
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
    );
}

export default ItemRow;
