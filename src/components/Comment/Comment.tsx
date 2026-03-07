import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Comment as CommentType } from '../../types';
import './Comment.scss';

interface CommentProps {
    comment: CommentType;
}

function Comment({ comment }: CommentProps) {
    const [collapse, setCollapse] = useState(false);

    if (comment.deleted) {
        return (
            <div className="comment-component">
                <div className="deleted-meta">
                    <span className="collapse">[deleted]</span> | Comment Deleted
                </div>
            </div>
        );
    }

    return (
        <div className="comment-component">
            <div className={`meta${collapse ? ' meta-collapse' : ''}`}>
                <span className="collapse" onClick={() => setCollapse(!collapse)}>
                    [{collapse ? '+' : '-'}]
                </span>{' '}
                <Link to={`/user/${comment.user}`}>{comment.user}</Link>
                <span className="time">{comment.time_ago}</span>
            </div>
            <div className="comment-tree">
                <div hidden={collapse}>
                    <p className="comment-text" dangerouslySetInnerHTML={{ __html: comment.content }} />
                    <ul className="subtree">
                        {comment.comments.map((subComment) => (
                            <li key={subComment.id}>
                                <Comment comment={subComment} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Comment;
