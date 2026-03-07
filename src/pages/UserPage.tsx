import { useParams } from 'react-router-dom';

function UserPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="user-page">
            <p>User: {id}</p>
        </div>
    );
}

export default UserPage;
