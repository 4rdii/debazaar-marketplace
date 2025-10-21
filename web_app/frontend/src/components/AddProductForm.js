import React, { useState } from 'react';
import { api } from '../services/api';
import { sendTransaction, waitForTransaction } from '../services/blockchain';
import { getStoredAuth } from '../services/auth';
import { ensureCorrectNetwork } from '../utils/metamask';

const AddProductForm = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        currency: 'USDT',
        image_url: '',
        payment_method: 'escrow',
        escrow_type: 'disputable',
        seller_contact: '',
        listing_duration_days: 30
    });

    const [imageMethod, setImageMethod] = useState('url'); // 'url' or 'upload'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState(''); // 'building', 'signing', 'confirming', 'finalizing'

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if user is authenticated
        const auth = getStoredAuth();
        if (!auth || !auth.walletAddress) {
            alert('Please connect your wallet first!');
            return;
        }

        console.log('Form submitted with method:', imageMethod);
        console.log('Selected file:', selectedFile);
        console.log('Current formData.image_url:', formData.image_url);

        let finalFormData = formData;

        // For upload method, ensure file is uploaded before submitting
        if (imageMethod === 'upload' && selectedFile && !formData.image_url) {
            console.log('Need to upload file before submission');
            const uploadResult = await handleFileUpload();
            if (!uploadResult) {
                console.log('Upload failed, stopping submission');
                alert('Please wait for the image to upload before submitting.');
                return;
            }
            // Use the uploaded image URL directly
            finalFormData = { ...formData, image_url: uploadResult };
            console.log('Upload successful, finalFormData:', finalFormData);
        }

        // Validate that we have an image URL
        if (!finalFormData.image_url) {
            console.log('No image URL found, validation failed');
            alert('Please provide an image URL or upload an image.');
            return;
        }

        // For escrow listings, use blockchain transaction flow
        if (finalFormData.payment_method === 'escrow') {
            await handleBlockchainListing(finalFormData, auth.walletAddress);
        } else {
            // For direct listings, use old flow
            console.log('Submitting direct listing:', finalFormData);
            onSubmit(finalFormData);
        }
    };

    /**
     * Handle blockchain listing creation flow
     * 1. Build transaction on backend
     * 2. Sign transaction with MetaMask
     * 3. Wait for blockchain confirmation
     * 4. Finalize listing on backend
     */
    const handleBlockchainListing = async (listingData, walletAddress) => {
        setIsSubmitting(true);

        try {
            // STEP 0: Ensure correct network
            const networkCorrect = await ensureCorrectNetwork();
            if (!networkCorrect) {
                throw new Error('Please switch to Arbitrum Sepolia network to continue');
            }

            // STEP 1: Build unsigned transaction
            setSubmissionStatus('building');
            console.log('Step 1: Building transaction...');

            const txData = await api.createListingTransaction({
                seller_wallet: walletAddress,
                title: listingData.title,
                description: listingData.description,
                price: listingData.price,
                currency: listingData.currency,
                image_url: listingData.image_url,
                escrow_type: listingData.escrow_type,
                listing_duration_days: listingData.listing_duration_days
            });

            console.log('Transaction built:', txData);
            const { transaction, listing_id, db_listing_id } = txData;

            // STEP 2: Sign and send transaction with MetaMask
            setSubmissionStatus('signing');
            console.log('Step 2: Please sign transaction in MetaMask...');

            const txHash = await sendTransaction(transaction);
            console.log('Transaction sent! Hash:', txHash);

            // STEP 3: Confirm transaction on backend
            setSubmissionStatus('confirming');
            console.log('Step 3: Confirming transaction on backend...');

            await api.confirmListingTransaction(db_listing_id, txHash);

            // STEP 4: Wait for blockchain confirmation
            console.log('Step 4: Waiting for blockchain confirmation...');

            await waitForTransaction(txHash);
            console.log('Transaction confirmed on blockchain!');

            // STEP 5: Finalize listing on backend
            setSubmissionStatus('finalizing');
            console.log('Step 5: Finalizing listing...');

            const result = await api.finalizeListing(db_listing_id);
            console.log('Listing finalized!', result);

            // Success!
            alert('✅ Listing created successfully on blockchain!');

            // Call parent onSubmit to refresh listings
            if (onSubmit) {
                onSubmit(result.listing);
            }

            // Close form
            onClose();

        } catch (error) {
            console.error('Blockchain listing creation failed:', error);

            let errorMessage = 'Failed to create listing: ';

            if (error.message.includes('rejected')) {
                errorMessage += 'Transaction was rejected by user';
            } else if (error.message.includes('insufficient funds')) {
                errorMessage += 'Insufficient funds for gas fees';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
            setSubmissionStatus('');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageMethodChange = (method) => {
        setImageMethod(method);
        setSelectedFile(null);
        setPreviewUrl('');
        setFormData(prev => ({ ...prev, image_url: '' }));
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile) {
            console.log('No file selected');
            return null;
        }

        console.log('Starting upload for file:', selectedFile.name);
        setIsUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('file', selectedFile);

        try {
            const response = await fetch('https://api.debazaar.click/api/upload/', {
                method: 'POST',
                body: formDataUpload,
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.ok) {
                const result = await response.json();
                console.log('Upload successful, result:', result);
                // New API returns 'url' instead of 'data_url'
                const imageUrl = result.url || result.data_url;
                setFormData(prev => ({ ...prev, image_url: imageUrl }));
                setPreviewUrl(imageUrl);
                return imageUrl;
            } else {
                const errorText = await response.text();
                console.error('Upload failed with status:', response.status, 'Error:', errorText);
                alert(`Upload failed: ${response.status} - ${errorText}`);
                return null;
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleImageUrlChange = (e) => {
        const url = e.target.value;
        setFormData(prev => ({ ...prev, image_url: url }));
        setPreviewUrl(url);
    };

    // Helper functions for UI feedback
    const getSubmitButtonText = () => {
        switch (submissionStatus) {
            case 'building':
                return 'Building Transaction...';
            case 'signing':
                return 'Waiting for Signature...';
            case 'confirming':
                return 'Confirming on Blockchain...';
            case 'finalizing':
                return 'Finalizing...';
            default:
                return 'Processing...';
        }
    };

    const getStatusMessage = () => {
        switch (submissionStatus) {
            case 'building':
                return 'Building unsigned transaction on backend...';
            case 'signing':
                return '⏳ Please sign the transaction in MetaMask...';
            case 'confirming':
                return '⏳ Transaction sent! Waiting for blockchain confirmation (2-5 seconds)...';
            case 'finalizing':
                return '⏳ Transaction confirmed! Activating your listing...';
            default:
                return 'Processing your request...';
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Product</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="product-form">
                    <input
                        type="text"
                        name="title"
                        placeholder="Product Title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />

                    <textarea
                        name="description"
                        placeholder="Product Description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="number"
                        name="price"
                        placeholder="Price (e.g., 1.50 for USDT/USDC)"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.00000001"
                        min="0"
                        required
                    />

                    <select name="currency" value={formData.currency} onChange={handleChange}>
                        <option value="USDT">USDT (Tether USD)</option>
                        <option value="USDC">USDC (USD Coin)</option>
                    </select>


                    <div className="form-field-group">
                        <label className="form-label">Product Image</label>
                        <div className="image-method-toggle">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="imageMethod"
                                    value="url"
                                    checked={imageMethod === 'url'}
                                    onChange={() => handleImageMethodChange('url')}
                                />
                                Image URL
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="imageMethod"
                                    value="upload"
                                    checked={imageMethod === 'upload'}
                                    onChange={() => handleImageMethodChange('upload')}
                                />
                                Upload Image
                            </label>
                        </div>

                        {imageMethod === 'url' ? (
                            <input
                                type="url"
                                name="image_url"
                                placeholder="Image URL (required)"
                                value={formData.image_url}
                                onChange={handleImageUrlChange}
                                required
                            />
                        ) : (
                            <div className="file-upload-section">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    id="imageUpload"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="imageUpload" className="file-upload-btn">
                                    Choose Image File
                                </label>
                                {selectedFile && (
                                    <div className="file-info">
                                        <span>{selectedFile.name}</span>
                                        <button
                                            type="button"
                                            onClick={handleFileUpload}
                                            disabled={isUploading}
                                            className="upload-btn"
                                        >
                                            {isUploading ? 'Uploading...' : 'Upload'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {previewUrl && (
                            <div className="image-preview">
                                <img src={previewUrl} alt="Preview" style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    <div className="form-field-group">
                        <label className="form-label">Payment Method</label>
                        <select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                            <option value="escrow">Using escrow</option>
                            <option value="direct">Direct</option>
                        </select>
                    </div>

                    {formData.payment_method === 'escrow' && (
                        <div className="form-field-group">
                            <label className="form-label">Escrow Type</label>
                            <select name="escrow_type" value={formData.escrow_type} onChange={handleChange}>
                                <option value="disputable">Disputable</option>
                                <option value="api_approval">API Approval</option>
                                <option value="onchain_approval">On-chain Approval</option>
                            </select>
                            <small style={{color: '#666', fontSize: '12px', display: 'block', marginTop: '4px'}}>
                                Choose the type of escrow mechanism for this listing
                            </small>
                        </div>
                    )}

                    {formData.payment_method === 'direct' && (
                        <div className="form-field-group">
                            <label className="form-label">Contact Information (Required for Direct Method)</label>
                            <input
                                type="text"
                                name="seller_contact"
                                placeholder="Email, Telegram (@username), or other contact method"
                                value={formData.seller_contact}
                                onChange={handleChange}
                                required
                            />
                            <small style={{color: '#666', fontSize: '12px'}}>
                                Buyers will see this to contact you directly
                            </small>
                        </div>
                    )}

                    <div className="form-field-group">
                        <label className="form-label">Listing Duration</label>
                        <input
                            type="number"
                            name="listing_duration_days"
                            placeholder="e.g., 30 (days the listing will be active)"
                            value={formData.listing_duration_days}
                            onChange={handleChange}
                            min="1"
                            max="365"
                        />
                    </div>


                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? getSubmitButtonText() : 'Add Product'}
                        </button>
                    </div>

                    {isSubmitting && (
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: '#f0f7ff',
                            border: '1px solid #4CAF50',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#333'
                        }}>
                            <strong>Status:</strong> {getStatusMessage()}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default AddProductForm;
