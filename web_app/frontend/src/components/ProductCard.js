import React from 'react';
import { formatPriceWithCurrency } from '../utils/priceFormatter';
import { formatAddress } from '../utils/metamask';

const ProductCard = ({ product, onWatchClick, onBuyClick }) => {
    const handleBuyClick = (e) => {
        e.stopPropagation();
        if (onBuyClick) {
            onBuyClick(product);
        }
    };

    return (
        <div className="product-card">
            {product.status === 'filled' && (
                <div className="sold-overlay">
                    <div className="sold-badge reserved-badge">RESERVED</div>
                </div>
            )}
            {['delivered', 'disputed', 'released'].includes(product.status) && (
                <div className="sold-overlay">
                    <div className="sold-badge">SOLD</div>
                </div>
            )}
            {product.image_url && (
                <img src={product.image_url} alt={product.title} className="product-image" />
            )}
            <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <p className="product-description">{product.description}</p>
                <div className="product-details">
                    <span className="product-price">{formatPriceWithCurrency(product.price, product.currency)}</span>
                    <span className="product-seller">by {formatAddress(product.seller.username)}</span>
                </div>
                <div className="product-meta">
                    <span className="product-rating">★ {product.seller_rating ? product.seller_rating.toFixed(1) : '0.0'}</span>
                </div>
                <div className="product-payment-info">
                    <span className="payment-method">💳 {product.payment_method === 'escrow' ? 'Using escrow' : 'Direct'}</span>
                    {product.is_expired && <span className="expired-badge">⏰ Expired</span>}
                </div>
                <div className="product-actions">
                    {product.status === 'open' && (
                        <button className="buy-now-btn" onClick={handleBuyClick}>Buy It Now</button>
                    )}
                    <button className="watch-btn" onClick={() => onWatchClick(product)}>Watch</button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
