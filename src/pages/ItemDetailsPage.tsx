import { useParams } from 'react-router-dom';

function ItemDetailsPage() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="item-details-page">
            <p>Item: {id}</p>
        </div>
    );
}

export default ItemDetailsPage;
