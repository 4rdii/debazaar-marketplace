import React from 'react';
import { formatPriceWithCurrency } from '../utils/priceFormatter';

const ProductDetailModal = ({ product, onClose }) => {
    if (!product) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="product-detail-header">
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="product-detail-content">
                    <div className="product-detail-left">
                        {product.image_url ? (
                            <img src={product.image_url} alt={product.title} className="product-detail-image" />
                        ) : (
                            <div className="product-detail-placeholder">No Image Available</div>
                        )}
                    </div>

                    <div className="product-detail-right">
                        <div className="product-detail-info">
                            <h2 className="product-detail-title">{product.title}</h2>

                            <div className="product-detail-price">
                                <span className="current-price">{formatPriceWithCurrency(product.price, product.currency)}</span>
                            </div>

                            <div className="product-detail-seller">
                                <div className="seller-info">
                                    <span className="seller-name">Sold by: {product.seller.username}</span>
                                    <span className="seller-rating">★ {product.seller_rating.toFixed(1)} rating</span>
                                </div>
                            </div>


                            <div className="product-detail-payment" style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                                <span className="payment-label" style={{ fontSize: '14px', color: '#767676', fontWeight: '500' }}>Payment Method:</span>
                                <span className="payment-value" style={{
                                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                                    color: '#ffffff',
                                    padding: '6px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)'
                                }}>{product.payment_method === 'escrow' ? 'Using escrow' : 'Direct'}</span>
                            </div>


                            {product.listing_duration_days && (
                                <div className="product-detail-access">
                                    <span className="access-label">Listing Duration:</span>
                                    <span className="access-value">{product.listing_duration_days} days</span>
                                </div>
                            )}


                            <div className="product-detail-description">
                                <h3>Description</h3>
                                <p>{product.description}</p>
                            </div>
                        </div>

                        <div className="product-detail-actions">
                            <button className="buy-button-large">Buy It Now</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;

