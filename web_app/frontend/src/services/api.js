
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
    }
};
