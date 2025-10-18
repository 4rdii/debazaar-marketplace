import React, { useState } from 'react';
import { formatPriceWithCurrency } from '../utils/priceFormatter';
import './MyProductCard.css';

const MyProductCard = ({ product, onWatchClick, onDelete }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    console.log('MyProductCard rendered for product:', product.title);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
            setIsDeleting(true);
            try {
                await onDelete(product.id);
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product. Please try again.');
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="my-product-card">
            {product.image_url && (
                <img src={product.image_url} alt={product.title} className="product-image" />
            )}
            <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-details">
                    <span className="product-price">{formatPriceWithCurrency(product.price, product.currency)}</span>
                    <span className="product-seller">by {product.seller.username}</span>
                </div>
                <div className="product-meta">
                    <span className="product-rating">★ {product.seller_rating ? product.seller_rating.toFixed(1) : '0.0'}</span>
                </div>
                <div className="product-payment-info">
                    <span className="payment-method">💳 {product.payment_method === 'escrow' ? 'Using escrow' : 'Direct'}</span>
                    {product.is_expired && <span className="expired-badge">⏰ Expired</span>}
                </div>
                <div className="product-actions">
                    <button className="view-btn" onClick={() => onWatchClick(product)}>View</button>
                    <button
                        className="delete-btn"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        style={{ backgroundColor: '#dc3545', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyProductCard;
