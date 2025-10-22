import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getStoredAuth } from '../services/auth';
import { sendTransaction, waitForTransaction } from '../services/blockchain';
import { formatPriceWithCurrency } from '../utils/priceFormatter';
import './MyProductsModal.css';

const MyPurchasesModal = ({ onClose, authUser, onProductClick }) => {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        loadPurchases();
    }, [authUser]);

    const loadPurchases = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = authUser?.user_id;

            if (!userId) {
                setError('User not authenticated. Please connect your wallet.');
                setLoading(false);
                return;
            }

            const data = await api.getUserPurchases(userId);
            setPurchases(data.purchases || []);
        } catch (err) {
            console.error('Error loading purchases:', err);
            setError('Failed to load your purchases');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleApproveDelivery = async (purchase) => {
        const auth = getStoredAuth();
        if (!auth || !auth.walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        setProcessingId(purchase.id);
        try {
            const orderId = purchase.orders?.[0]?.id;
            if (!orderId) {
                alert('Order not found for this purchase');
                return;
            }

            // Build approval transaction
            const approvalData = await api.approveDeliveryTransaction(orderId, auth.walletAddress);

            // Send transaction
            const txHash = await sendTransaction(approvalData.transaction);

            // Wait for confirmation
            await waitForTransaction(txHash);

            // Confirm on backend
            await api.confirmApprovalTransaction(orderId, txHash);

            alert('✅ Delivery approved! Payment released to seller.');
            loadPurchases();
        } catch (error) {
            console.error('Approval error:', error);
            alert(`Failed to approve delivery: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDisputeDelivery = async (purchase) => {
        const auth = getStoredAuth();
        if (!auth || !auth.walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        if (!window.confirm('Are you sure you want to dispute this delivery? This will open a dispute process.')) {
            return;
        }

        setProcessingId(purchase.id);
        try {
            const orderId = purchase.orders?.[0]?.id;
            if (!orderId) {
                alert('Order not found for this purchase');
                return;
            }

            // Build dispute transaction
            const disputeData = await api.disputeDeliveryTransaction(orderId, auth.walletAddress);

            // Send transaction
            const txHash = await sendTransaction(disputeData.transaction);

            // Wait for confirmation
            await waitForTransaction(txHash);

            // Confirm on backend
            await api.confirmDisputeTransaction(orderId, txHash);

            alert('✅ Dispute opened. An arbiter will review the case.');
            loadPurchases();
        } catch (error) {
            console.error('Dispute error:', error);
            alert(`Failed to open dispute: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'open': { text: 'Open', color: '#28a745' },
            'filled': { text: 'Paid', color: '#007bff' },
            'delivered': { text: 'Delivered', color: '#ffc107' },
            'released': { text: 'Completed', color: '#28a745' },
            'refunded': { text: 'Refunded', color: '#6c757d' },
            'disputed': { text: 'Disputed', color: '#dc3545' },
            'canceled': { text: 'Canceled', color: '#6c757d' }
        };
        const badge = badges[status] || { text: status, color: '#6c757d' };
        return (
            <span
                className="status-badge"
                style={{
                    backgroundColor: badge.color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                }}
            >
                {badge.text}
            </span>
        );
    };

    const renderEmptyState = () => (
        <div className="empty-products-state">
            <div className="empty-icon">🛒</div>
            <h3>You haven't purchased anything yet</h3>
            <p>Browse the marketplace and find something you like!</p>
        </div>
    );

    const renderPurchasesList = () => (
        <div className="my-products-grid">
            {purchases.map(purchase => (
                <div key={purchase.id} className="my-product-card">
                    {purchase.image_url && (
                        <img src={purchase.image_url} alt={purchase.title} className="product-image" />
                    )}
                    <div className="product-info">
                        <h3 className="product-title">{purchase.title}</h3>
                        <p className="product-description">{purchase.description}</p>
                        <div className="product-details">
                            <span className="product-price">{formatPriceWithCurrency(purchase.price, purchase.currency)}</span>
                        </div>
                        <div className="product-meta">
                            {getStatusBadge(purchase.status)}
                        </div>
                        <div className="product-actions">
                            <button className="view-btn" onClick={() => { onClose(); onProductClick(purchase); }}>View</button>
                            {purchase.status === 'delivered' && (
                                <>
                                    <button
                                        className="deliver-btn"
                                        onClick={() => handleApproveDelivery(purchase)}
                                        disabled={processingId === purchase.id}
                                        style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {processingId === purchase.id ? 'Processing...' : '✓ Approve Delivery'}
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDisputeDelivery(purchase)}
                                        disabled={processingId === purchase.id}
                                        style={{ backgroundColor: '#ffc107', color: 'black', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        {processingId === purchase.id ? 'Processing...' : '⚠ Dispute'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="my-products-modal">
                <div className="modal-header">
                    <h2>My Purchases</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="loading-spinner">⏳</div>
                            <p>Loading your purchases...</p>
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <p>{error}</p>
                            <button
                                className="retry-btn"
                                onClick={loadPurchases}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : purchases.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        <>
                            <div className="products-header">
                                <p>{purchases.length} purchase{purchases.length !== 1 ? 's' : ''} found</p>
                            </div>
                            {renderPurchasesList()}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyPurchasesModal;
