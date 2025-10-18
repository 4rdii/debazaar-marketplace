import React, { useState } from 'react';

const AddProductForm = ({ onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        currency: 'USDT',
        image_url: '',
        token_address: '0x0000000000000000000000000000000000000000',
        payment_method: 'escrow',
        listing_duration_days: 30,
        seller_id: 1 // Mock seller ID
    });

    const [imageMethod, setImageMethod] = useState('url'); // 'url' or 'upload'
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
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

        console.log('Submitting form with data:', finalFormData);
        onSubmit(finalFormData);
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
                        <button type="button" onClick={onClose} className="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            Add Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductForm;
