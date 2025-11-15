import React, { useState } from 'react';
import { formatPriceWithCurrency } from '../utils/priceFormatter';
import { api } from '../services/api';
import { getStoredAuth } from '../services/auth';
import { sendTransaction, waitForTransaction } from '../services/blockchain';
import './MyProductCard.css';

const MyProductCard = ({ product, onWatchClick, onDelete, onDelivered }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDelivering, setIsDelivering] = useState(false);
    const [isDisputing, setIsDisputing] = useState(false);
    const [canDispute, setCanDispute] = useState(false);

    console.log('MyProductCard rendered for product:', product.title);

    // Check if 10 seconds passed since delivery
    React.useEffect(() => {
        if (product.status === 'delivered' && product.orders?.[0]?.delivered_at) {
            const checkDeadline = () => {
                const deliveredAt = new Date(product.orders[0].delivered_at);
                const disputeDeadline = new Date(deliveredAt.getTime() + 10000); // 10 seconds
                setCanDispute(new Date() >= disputeDeadline);
            };

            checkDeadline();
            const interval = setInterval(checkDeadline, 1000);
            return () => clearInterval(interval);
        }
    }, [product]);

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

    const handleDeliver = async () => {
        const auth = getStoredAuth();
        if (!auth || !auth.walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        setIsDelivering(true);
        try {
            // Build delivery transaction
            const deliveryData = await api.deliverListingTransaction(product.id, auth.walletAddress);

            // Send transaction
            const txHash = await sendTransaction(deliveryData.transaction);

            // Wait for confirmation
            await waitForTransaction(txHash);

            // Confirm delivery on backend
            await api.confirmDeliveryTransaction(product.id, txHash);

            alert('✅ Product marked as delivered!');

            if (onDelivered) {
                onDelivered(product.id);
            }
        } catch (error) {
            console.error('Delivery error:', error);
            alert(`Failed to mark as delivered: ${error.message}`);
        } finally {
            setIsDelivering(false);
        }
    };

    const handleDispute = async () => {
        const auth = getStoredAuth();
        if (!auth || !auth.walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        if (!window.confirm('Are you sure you want to dispute this order? This requires an entropy fee.')) {
            return;
        }

        setIsDisputing(true);
        try {
            const order = product.orders?.[0];
            if (!order) {
                throw new Error('No order found for this product');
            }

            const disputeData = await api.disputeDeliveryTransaction(order.id, auth.walletAddress);
            const txHash = await sendTransaction({
                ...disputeData.transaction,
                value: '0x' + disputeData.entropy_fee_wei.toString(16)
            });
            await waitForTransaction(txHash);
            await api.confirmDisputeTransaction(order.id, txHash, auth.walletAddress);

            alert('✅ Dispute submitted successfully!');

            if (onDelivered) {
                onDelivered(product.id);
            }
        } catch (error) {
            console.error('Dispute error:', error);
            const errorMsg = error?.message || error?.toString() || 'Unknown error';
            alert(`Failed to dispute: ${errorMsg}`);
        } finally {
            setIsDisputing(false);
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
                {product.buyer_address && product.status === 'filled' && (
                    <div style={{
                        backgroundColor: '#e3f2fd',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '8px',
                        fontSize: '12px'
                    }}>
                        <strong>👤 Buyer Address:</strong>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            wordBreak: 'break-all',
                            marginTop: '4px'
                        }}>
                            {product.buyer_address}
                        </div>
                    </div>
                )}
                {product.orders?.[0]?.tweet_id && ['filled', 'delivered'].includes(product.status) && (
                    <div style={{
                        backgroundColor: '#f0f8ff',
                        padding: '8px',
                        borderRadius: '4px',
                        marginTop: '8px',
                        fontSize: '12px'
                    }}>
                        <strong>🐦 Tweet ID to Repost:</strong>
                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            wordBreak: 'break-all',
                            marginTop: '4px'
                        }}>
                            {product.orders[0].tweet_id}
                        </div>
                    </div>
                )}
                <div className="product-actions">
                    <button className="view-btn" onClick={() => onWatchClick(product)}>View</button>
                    {product.status === 'filled' && (
                        <button
                            className="deliver-btn"
                            onClick={handleDeliver}
                            disabled={isDelivering}
                            style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            {isDelivering ? 'Delivering...' : '📦 Delivered'}
                        </button>
                    )}
                    {product.status === 'delivered' && canDispute && product.escrow_type === 'disputable' && (
                        <button
                            className="dispute-btn"
                            onClick={handleDispute}
                            disabled={isDisputing}
                            style={{ backgroundColor: '#ff9800', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            {isDisputing ? 'Disputing...' : '⚠️ Dispute'}
                        </button>
                    )}
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
