import { useParams } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import Loader from '../../components/Loader/Loader';
import ErrorMessage from '../../components/ErrorMessage/ErrorMessage';
import './UserPage.scss';

function UserPage() {
    const { id } = useParams<{ id: string }>();
    const { user, error, loading } = useUser(id!);

    if (loading) {
        return (
            <div className="user-page">
                <Loader />
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-page">
                <ErrorMessage message={`Could not load user ${id}.`} />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="user-page">
            <div className="profile">
                <div className="mobile item-header">
                    <p className="title-block">
                        <span
                            className="back-button"
                            onClick={() => window.history.back()}
                        ></span>
                        Profile: {user.id}
                    </p>
                </div>
                <div className="main-details">
                    <span className="name">{user.id}</span>
                    <span className="right">{user.karma} &#9733;</span>
                    <p className="age">Created {user.created}</p>
                </div>
                {user.about && (
                    <div className="other-details">
                        <p dangerouslySetInnerHTML={{ __html: user.about }} />
                    </div>
                )}
            </div>
        </div>
    );
}

export default UserPage;
