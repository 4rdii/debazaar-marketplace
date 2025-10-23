import React, { useState } from 'react';
import { formatPriceWithCurrency } from '../utils/priceFormatter';
import { getStoredAuth } from '../services/auth';
import { ensureCorrectNetwork } from '../utils/metamask';
import { api } from '../services/api';
import { sendTransaction, waitForTransaction } from '../services/blockchain';

const ProductDetailModal = ({ product, onClose, onPurchaseSuccess }) => {
    const [showContact, setShowContact] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [purchaseStatus, setPurchaseStatus] = useState('');
    const [tweetId, setTweetId] = useState('');

    if (!product) return null;

    // Check if this is a tweet repost product
    const isTweetRepostProduct = product.escrow_type === 'api_approval' && product.api_approval_method === 'tweet_repost';

    const handlePurchase = async () => {
        // Check authentication
        const auth = getStoredAuth();
        if (!auth || !auth.walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        // For tweet repost products, validate tweet ID
        if (isTweetRepostProduct && !tweetId.trim()) {
            alert('Please enter the Tweet ID you want to be reposted');
            return;
        }

        // Check if buyer is trying to buy their own listing (allow for testing)
        if (auth.authUser.username === product.seller.username) {
            const confirmSelfPurchase = window.confirm(
                '⚠️ WARNING: You are about to purchase your own listing!\n\n' +
                'This is only allowed for testing purposes.\n\n' +
                'Continue?'
            );
            if (!confirmSelfPurchase) {
                return;
            }
        }

        // Check network
        const networkCorrect = await ensureCorrectNetwork();
        if (!networkCorrect) {
            alert('Please switch to Arbitrum Sepolia network to continue');
            return;
        }

        setIsPurchasing(true);

        try {
            // STEP 0: Check if user has enough tokens (optional warning)
            console.log(`⚠️ Make sure you have at least ${product.price} ${product.currency} tokens in your wallet!`);
            console.log(`Token contract: 0xC9C401E0094B2d3d796Ed074b023551038b84F07 (PYUSD)`);

            // STEP 1: Approve token spending
            setPurchaseStatus('approving');
            console.log('Step 1: Building token approval transaction...');

            const approvalData = await api.approveTokenTransaction(product.id, auth.walletAddress);
            console.log('Approval transaction built:', approvalData);

            // Check if approval is needed
            if (approvalData.transaction) {
                console.log('Step 2: Please approve token spending in MetaMask...');
                const approvalTxHash = await sendTransaction(approvalData.transaction);
                console.log('Approval transaction sent:', approvalTxHash);

                console.log('Step 3: Waiting for approval confirmation...');
                await waitForTransaction(approvalTxHash);
                console.log('Token approval confirmed!');
            } else {
                console.log('Token already approved, skipping approval step.');
            }

            // STEP 2: Purchase listing
            setPurchaseStatus('purchasing');
            console.log('Step 4: Building purchase transaction...');

            const purchaseData = await api.purchaseListingTransaction(
                product.id,
                auth.walletAddress,
                7, // 7 days deadline
                tweetId // Pass tweet ID for API approval
            );
            console.log('Purchase transaction built:', purchaseData);

            console.log('Step 5: Please sign purchase transaction in MetaMask...');
            const purchaseTxHash = await sendTransaction(purchaseData.transaction);
            console.log('Purchase transaction sent:', purchaseTxHash);

            // STEP 3: Confirm purchase on backend
            setPurchaseStatus('confirming');
            console.log('Step 6: Confirming purchase on backend...');

            await api.confirmPurchase(purchaseData.order_id, purchaseTxHash);

            console.log('Step 7: Waiting for blockchain confirmation...');
            await waitForTransaction(purchaseTxHash);
            console.log('Purchase confirmed on blockchain!');

            // Success!
            alert('✅ Purchase successful! Your order is now being processed.');

            // Call success callback to refresh products list
            if (onPurchaseSuccess) {
                onPurchaseSuccess();
            }

            onClose();

        } catch (error) {
            console.error('Purchase error:', error);

            let errorMessage = 'Purchase failed: ';
            if (error.message.includes('rejected')) {
                errorMessage += 'Transaction was rejected by user';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage += 'Insufficient funds for transaction';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        } finally {
            setIsPurchasing(false);
            setPurchaseStatus('');
        }
    };

    const getPurchaseButtonText = () => {
        switch (purchaseStatus) {
            case 'approving':
                return 'Approving Token...';
            case 'purchasing':
                return 'Purchasing...';
            case 'confirming':
                return 'Confirming...';
            default:
                return 'Processing...';
        }
    };

    const getPurchaseStatusMessage = () => {
        switch (purchaseStatus) {
            case 'approving':
                return '⏳ Step 1/2: Please approve token spending in MetaMask...';
            case 'purchasing':
                return '⏳ Step 2/2: Please sign purchase transaction in MetaMask...';
            case 'confirming':
                return '⏳ Waiting for blockchain confirmation (2-5 seconds)...';
            default:
                return 'Processing your purchase...';
        }
    };

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

                            {product.payment_method === 'escrow' && product.escrow_type && (
                                <div className="product-detail-escrow-type" style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
                                    <span className="escrow-type-label" style={{ fontSize: '14px', color: '#767676', fontWeight: '500' }}>Escrow Type:</span>
                                    <span className="escrow-type-value" style={{
                                        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                        color: '#ffffff',
                                        padding: '6px 12px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        textTransform: 'capitalize',
                                        boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)'
                                    }}>
                                        {product.escrow_type === 'api_approval' ? 'API Approval' :
                                         product.escrow_type === 'onchain_approval' ? 'On-chain Approval' :
                                         'Disputable'}
                                    </span>
                                </div>
                            )}

                            {product.payment_method === 'direct' && product.seller_contact && showContact && (
                                <div className="seller-contact-info" style={{
                                    background: '#f8f9fa',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '20px'
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057', fontWeight: '600' }}>
                                        📞 Seller Contact
                                    </h4>
                                    <p style={{ margin: '0', fontSize: '14px', color: '#212529', wordBreak: 'break-word' }}>
                                        {product.seller_contact}
                                    </p>
                                    <small style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                                        Contact the seller directly to complete the purchase
                                    </small>
                                </div>
                            )}


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
                            {product.payment_method === 'direct' ? (
                                <button
                                    className="buy-button-large"
                                    onClick={() => setShowContact(!showContact)}
                                >
                                    {showContact ? 'Hide Contact' : 'Show Contact'}
                                </button>
                            ) : (
                                <>
                                    {isTweetRepostProduct && (
                                        <div style={{
                                            marginBottom: '16px',
                                            padding: '16px',
                                            backgroundColor: '#f0f8ff',
                                            borderRadius: '8px',
                                            border: '1px solid #cce5ff'
                                        }}>
                                            <label style={{
                                                display: 'block',
                                                fontWeight: 'bold',
                                                marginBottom: '8px',
                                                color: '#333'
                                            }}>
                                                🐦 Tweet ID to be Reposted
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g., 1234567890123456789"
                                                value={tweetId}
                                                onChange={(e) => setTweetId(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    fontSize: '14px'
                                                }}
                                            />
                                            <small style={{
                                                display: 'block',
                                                marginTop: '6px',
                                                color: '#666',
                                                fontSize: '12px'
                                            }}>
                                                Seller <strong>@{product.tweet_username || 'seller'}</strong> will repost your tweet
                                            </small>
                                        </div>
                                    )}
                                    <button
                                        className="buy-button-large"
                                        onClick={handlePurchase}
                                        disabled={isPurchasing}
                                    >
                                        {isPurchasing ? getPurchaseButtonText() : 'Buy It Now'}
                                    </button>
                                    {isPurchasing && (
                                        <div style={{
                                            marginTop: '16px',
                                            padding: '12px',
                                            background: '#f0f7ff',
                                            border: '1px solid #4CAF50',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            color: '#333'
                                        }}>
                                            <strong>Status:</strong> {getPurchaseStatusMessage()}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;

