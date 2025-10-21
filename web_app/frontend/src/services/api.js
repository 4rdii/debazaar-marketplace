
const API_BASE = 'https://api.debazaar.click/api';

export const api = {
    // Get all listings with optional search and filter parameters
    getListings: async (params = {}) => {
        const url = new URL(`${API_BASE}/listings/`);

        // Add search and filter parameters to URL
        Object.keys(params).forEach(key => {
            if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        console.log('Fetching listings from:', url.toString());
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch listings');
        return response.json();
    },

    // Get user's own products
    getUserProducts: async (sellerId) => {
        const url = new URL(`${API_BASE}/listings/`);
        url.searchParams.append('seller', sellerId);

        console.log('Fetching user products from:', url.toString());
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Failed to fetch user products');
        return response.json();
    },

    createListing: async (listingData) => {
        const response = await fetch(`${API_BASE}/listings/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listingData)
        });
        if (!response.ok) throw new Error('Failed to create listing');
        return response.json();
    },

    // Delete a listing (soft delete)
    deleteListing: async (listingId, sellerId) => {
        const response = await fetch(`${API_BASE}/listings/${listingId}/delete/`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seller_id: sellerId })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete listing');
        }
        return response.json();
    },

    // === BLOCKCHAIN TRANSACTION ENDPOINTS ===

    /**
     * Build unsigned transaction for creating a listing on blockchain
     * @param {Object} listingData - Listing details
     * @returns {Promise<{success: boolean, transaction: Object, listing_id: string, db_listing_id: number}>}
     */
    createListingTransaction: async (listingData) => {
        const response = await fetch(`${API_BASE}/listings/create-transaction/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listingData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create listing transaction');
        }
        return response.json();
    },

    /**
     * Confirm that listing creation transaction was sent to blockchain
     * @param {number} dbListingId - Database listing ID
     * @param {string} txHash - Transaction hash from blockchain
     * @returns {Promise<{success: boolean, message: string}>}
     */
    confirmListingTransaction: async (dbListingId, txHash) => {
        const response = await fetch(`${API_BASE}/listings/${dbListingId}/confirm-transaction/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx_hash: txHash })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to confirm transaction');
        }
        return response.json();
    },

    /**
     * Finalize listing after blockchain confirmation
     * @param {number} dbListingId - Database listing ID
     * @returns {Promise<{success: boolean, listing: Object}>}
     */
    finalizeListing: async (dbListingId) => {
        const response = await fetch(`${API_BASE}/listings/${dbListingId}/finalize/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to finalize listing');
        }
        return response.json();
    },

    // === BUYER PURCHASE ENDPOINTS ===

    /**
     * Build unsigned transaction for ERC20 token approval
     * @param {number} listingId - Listing ID
     * @param {string} buyerWallet - Buyer wallet address
     * @returns {Promise<{success: boolean, transaction: Object}>}
     */
    approveTokenTransaction: async (listingId, buyerWallet) => {
        const response = await fetch(`${API_BASE}/orders/approve-token-transaction/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listing_id: listingId, buyer_wallet: buyerWallet })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to build approval transaction');
        }
        return response.json();
    },

    /**
     * Build unsigned transaction for purchasing listing
     * @param {number} listingId - Listing ID
     * @param {string} buyerWallet - Buyer wallet address
     * @param {number} deadlineDays - Deadline in days
     * @returns {Promise<{success: boolean, transaction: Object, order_id: number}>}
     */
    purchaseListingTransaction: async (listingId, buyerWallet, deadlineDays = 7) => {
        const response = await fetch(`${API_BASE}/orders/purchase-transaction/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                listing_id: listingId,
                buyer_wallet: buyerWallet,
                deadline_days: deadlineDays
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to build purchase transaction');
        }
        return response.json();
    },

    /**
     * Confirm purchase transaction was sent
     * @param {number} orderId - Order ID
     * @param {string} txHash - Transaction hash
     * @returns {Promise<{success: boolean}>}
     */
    confirmPurchase: async (orderId, txHash) => {
        const response = await fetch(`${API_BASE}/orders/${orderId}/confirm-purchase/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx_hash: txHash })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to confirm purchase');
        }
        return response.json();
    },

    /**
     * Build unsigned transaction for delivery
     * @param {number} listingId - Listing ID
     * @param {string} sellerWallet - Seller wallet address
     * @returns {Promise<{success: boolean, transaction: Object}>}
     */
    deliverListingTransaction: async (listingId, sellerWallet) => {
        const response = await fetch(`${API_BASE}/listings/${listingId}/deliver-transaction/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seller_wallet: sellerWallet })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to build delivery transaction');
        }
        return response.json();
    },

    /**
     * Confirm delivery transaction was sent
     * @param {number} listingId - Listing ID
     * @param {string} txHash - Transaction hash
     * @returns {Promise<{success: boolean}>}
     */
    confirmDeliveryTransaction: async (listingId, txHash) => {
        const response = await fetch(`${API_BASE}/listings/${listingId}/confirm-delivery-transaction/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tx_hash: txHash })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to confirm delivery');
        }
        return response.json();
    },

    /**
     * Get user purchases
     * @param {number} userId - User ID
     * @returns {Promise<{purchases: Array}>}
     */
    getUserPurchases: async (userId) => {
        const response = await fetch(`${API_BASE}/listings/?buyer=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch purchases');
        const data = await response.json();
        return { purchases: data.listings || [] };
    }
};
